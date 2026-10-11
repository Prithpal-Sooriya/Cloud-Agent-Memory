/**
 * Minimal Chrome DevTools Protocol client. Replaces Playwright with Node built-ins only
 * (child_process, global fetch and WebSocket). Needs a Chromium-family binary.
 */

import { execFileSync, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { homedir, platform, tmpdir } from "node:os";
import { join } from "node:path";
import { UserError } from "./errors.ts";

/** Find a Chromium-family binary: --chrome / $CHROME_BIN, Playwright's headless shell, then system Chrome. */
export function findChrome(explicit?: string): string {
	const fromEnv = explicit ?? process.env.CHROME_BIN;
	if (fromEnv) {
		if (!existsSync(fromEnv)) throw new UserError(`Chrome binary not found: ${fromEnv}`);
		return fromEnv;
	}
	const candidates: string[] = [];

	// Playwright's cached headless shell (no Playwright package needed to use it).
	const cacheRoots = [
		join(homedir(), "Library", "Caches", "ms-playwright"),
		join(homedir(), ".cache", "ms-playwright"),
		join(process.env.LOCALAPPDATA ?? "", "ms-playwright"),
	];
	for (const root of cacheRoots) {
		if (!existsSync(root)) continue;
		const shells = readdirSync(root)
			.filter((d) => d.startsWith("chromium_headless_shell-"))
			.sort()
			.reverse();
		for (const shell of shells) {
			for (const sub of readdirSync(join(root, shell))) {
				candidates.push(join(root, shell, sub, "chrome-headless-shell"));
				candidates.push(join(root, shell, sub, "chrome-headless-shell.exe"));
			}
		}
	}

	if (platform() === "darwin") {
		candidates.push(
			"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			"/Applications/Chromium.app/Contents/MacOS/Chromium",
		);
	} else if (platform() === "win32") {
		for (const base of [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA]) {
			if (base) candidates.push(join(base, "Google", "Chrome", "Application", "chrome.exe"));
		}
	} else {
		for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
			try {
				const found = execFileSync("which", [name], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
				if (found) candidates.push(found);
			} catch {
				// not on PATH
			}
		}
	}

	const found = candidates.find((c) => c && existsSync(c));
	if (!found) {
		throw new UserError(
			"No Chrome or Chromium found",
			"Install Google Chrome, or pass --chrome <path> / set CHROME_BIN. (Playwright's chrome-headless-shell also works.)",
		);
	}
	return found;
}

type Listener = (params: any) => void;

/**
 * A DevTools connection to the browser. Commands default to the attached page session once
 * `attachNewPage()` has been called; browser-level commands (Target.*) use no session.
 */
export class Cdp {
	private ws: WebSocket;
	private nextId = 0;
	private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
	private listeners = new Map<string, Listener[]>();
	private sessionId: string | undefined;

	private constructor(ws: WebSocket) {
		this.ws = ws;
		ws.onmessage = (event: MessageEvent) => {
			const msg = JSON.parse(String(event.data));
			if (msg.id !== undefined) {
				const p = this.pending.get(msg.id);
				if (!p) return;
				this.pending.delete(msg.id);
				if (msg.error) p.reject(new Error(`${msg.error.message} (${msg.error.code})`));
				else p.resolve(msg.result);
			} else if (msg.method) {
				// Events for other sessions are not ours.
				if (this.sessionId !== undefined && msg.sessionId !== undefined && msg.sessionId !== this.sessionId) return;
				for (const l of this.listeners.get(msg.method) ?? []) l(msg.params);
			}
		};
		ws.onclose = () => {
			for (const p of this.pending.values()) p.reject(new Error("Chrome connection closed"));
			this.pending.clear();
		};
	}

	static async connect(wsUrl: string): Promise<Cdp> {
		const ws = new WebSocket(wsUrl);
		await new Promise<void>((resolve, reject) => {
			ws.onopen = () => resolve();
			ws.onerror = () => reject(new Error("Could not connect to Chrome DevTools"));
		});
		return new Cdp(ws);
	}

	send(method: string, params: object = {}, browserLevel = false): Promise<any> {
		return new Promise((resolve, reject) => {
			const id = ++this.nextId;
			this.pending.set(id, { resolve, reject });
			const message: Record<string, unknown> = { id, method, params };
			if (this.sessionId && !browserLevel) message.sessionId = this.sessionId;
			this.ws.send(JSON.stringify(message));
		});
	}

	/**
	 * Create a fresh browser context with one blank page and route page commands to it. Playwright does
	 * the same; rendering in a new context (not the default profile's startup window) is part of what
	 * makes the pixels match.
	 */
	async attachNewPage(): Promise<void> {
		const { browserContextId } = await this.send("Target.createBrowserContext", {}, true);
		const { targetId } = await this.send("Target.createTarget", { url: "about:blank", browserContextId }, true);
		const { sessionId } = await this.send("Target.attachToTarget", { targetId, flatten: true }, true);
		this.sessionId = sessionId;
	}

	on(method: string, listener: Listener): void {
		const list = this.listeners.get(method) ?? [];
		list.push(listener);
		this.listeners.set(method, list);
	}

	/** Evaluate JS in the page, awaiting promises. Throws if the page code throws. */
	async evaluate<T = unknown>(expression: string): Promise<T> {
		const res = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
		if (res.exceptionDetails) {
			const d = res.exceptionDetails;
			throw new Error(d.exception?.description ?? d.text ?? "page evaluation failed");
		}
		return res.result.value as T;
	}

	async waitForFunction(expression: string, timeoutMs: number): Promise<void> {
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			if (await this.evaluate<boolean>(`!!(${expression})`)) return;
			await new Promise((r) => setTimeout(r, 50));
		}
		throw new UserError(`Timed out after ${timeoutMs / 1000}s waiting for: ${expression}`);
	}

	/**
	 * PNG screenshot of the viewport. Like Playwright, wait for web fonts first: flushing layout makes the
	 * browser request any font the current frame needs, and `document.fonts.ready` resolves once they have
	 * loaded. Without this, embedded (data URL) fonts can still be decoding and early frames render in a
	 * fallback font, which also makes renders non-deterministic.
	 */
	async screenshot(): Promise<Buffer> {
		await this.evaluate("(document.body.offsetHeight, document.fonts.ready.then(() => true))");
		const res = await this.send("Page.captureScreenshot", { format: "png" });
		return Buffer.from(res.data, "base64");
	}

	close(): void {
		try {
			this.ws.close();
		} catch {
			// already closed
		}
	}
}

// Generic font families (`monospace`, `sans-serif`, ...) differ per OS, which changes the fallback glyphs
// for characters a page's own fonts lack (arrows, check marks). Playwright pins them per platform; so do we,
// so renders match videowright + Playwright and look the same on every machine. Tables copied from Playwright 1.63.
const FONT_FAMILIES: Record<string, object> = {
	darwin: {
		fontFamilies: {
			standard: "Times",
			fixed: "Courier",
			serif: "Times",
			sansSerif: "Helvetica",
			cursive: "Apple Chancery",
			fantasy: "Papyrus",
		},
		forScripts: [
			{ script: "jpan", fontFamilies: { standard: "Hiragino Kaku Gothic ProN", fixed: "Osaka-Mono", serif: "Hiragino Mincho ProN", sansSerif: "Hiragino Kaku Gothic ProN" } },
			{ script: "hang", fontFamilies: { standard: "Apple SD Gothic Neo", serif: "AppleMyungjo", sansSerif: "Apple SD Gothic Neo" } },
			{ script: "hans", fontFamilies: { standard: ",PingFang SC,STHeiti", serif: "Songti SC", sansSerif: ",PingFang SC,STHeiti", cursive: "Kaiti SC" } },
			{ script: "hant", fontFamilies: { standard: ",PingFang TC,Heiti TC", serif: "Songti TC", sansSerif: ",PingFang TC,Heiti TC", cursive: "Kaiti TC" } },
		],
	},
	linux: {
		fontFamilies: {
			standard: "Times New Roman",
			fixed: "Monospace",
			serif: "Times New Roman",
			sansSerif: "Arial",
			cursive: "Comic Sans MS",
			fantasy: "Impact",
		},
	},
};

/**
 * Page setup identical to what Playwright applies to every page: viewport and screen metrics, window size,
 * en-US locale, light/no-motion media, generic font families. Call after attachNewPage(), before navigating.
 */
export async function applyPageDefaults(cdp: Cdp, width: number, height: number): Promise<void> {
	await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
	try {
		const { windowId } = await cdp.send("Browser.getWindowForTarget");
		await cdp.send("Browser.setWindowBounds", { windowId, bounds: { width, height } });
	} catch {
		// headless builds without window management: the metrics override below is what matters
	}
	await cdp.send("Emulation.setDeviceMetricsOverride", {
		mobile: false,
		width,
		height,
		screenWidth: width,
		screenHeight: height,
		deviceScaleFactor: 1,
		screenOrientation: { angle: 0, type: "landscapePrimary" },
	});
	await cdp.send("Emulation.setLocaleOverride", { locale: "en-US" });
	const fonts = FONT_FAMILIES[platform()];
	if (fonts) await cdp.send("Page.setFontFamilies", fonts);
	await cdp.send("Emulation.setEmulatedMedia", {
		media: "",
		features: [
			{ name: "prefers-color-scheme", value: "light" },
			{ name: "prefers-reduced-motion", value: "no-preference" },
			{ name: "forced-colors", value: "none" },
			{ name: "prefers-contrast", value: "no-preference" },
		],
	});
}

export interface Browser {
	cdp: Cdp;
	version: string;
	close(): void;
}

// Chrome switches. These mirror what Playwright 1.63 passes to headless Chromium, on purpose: the same
// switches give the same pixels (notably, no --disable-gpu, which changes glyph rasterization, and the
// CDPScreenshotNewSurface capture path). Renders were verified bit-identical to videowright + Playwright.
const DISABLED_FEATURES = [
	"AvoidUnnecessaryBeforeUnloadCheckSync",
	"DestroyProfileOnBrowserClose",
	"DialMediaRouteProvider",
	"GlobalMediaControls",
	"HttpsUpgrades",
	"LensOverlay",
	"MediaRouter",
	"PaintHolding",
	"ThirdPartyStoragePartitioning",
	"BlockOriginHeaderModificationOnRedirect",
	"Translate",
	"AutoDeElevate",
	"OptimizationHints",
	"msForceBrowserSignIn",
	"msEdgeUpdateLaunchServicesPreferredVersion",
];

const FLAGS = [
	"--disable-field-trial-config",
	"--disable-background-networking",
	"--disable-background-timer-throttling",
	"--disable-backgrounding-occluded-windows",
	"--disable-back-forward-cache",
	"--disable-breakpad",
	"--disable-client-side-phishing-detection",
	"--disable-component-extensions-with-background-pages",
	"--disable-component-update",
	"--no-default-browser-check",
	"--disable-default-apps",
	"--disable-dev-shm-usage",
	"--disable-edgeupdater",
	"--disable-extensions",
	`--disable-features=${DISABLED_FEATURES.join(",")}`,
	"--enable-features=CDPScreenshotNewSurface",
	"--allow-pre-commit-input",
	"--disable-hang-monitor",
	"--disable-ipc-flooding-protection",
	"--disable-popup-blocking",
	"--disable-prompt-on-repost",
	"--disable-renderer-backgrounding",
	"--disable-updater-scheduler",
	"--force-color-profile=srgb",
	"--metrics-recording-only",
	"--no-first-run",
	"--password-store=basic",
	"--use-mock-keychain",
	"--no-service-autorun",
	"--export-tagged-pdf",
	"--disable-search-engine-choice-screen",
	"--unsafely-disable-devtools-self-xss-warnings",
	"--disable-infobars",
	"--disable-sync",
	"--enable-unsafe-swiftshader",
	"--headless",
	"--hide-scrollbars",
	"--mute-audio",
	"--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4",
	"--no-startup-window",
];

/**
 * Launch Chrome with a throwaway profile and attach to a fresh page. Chrome's sandbox stays on unless
 * `noSandbox` is set; if Chrome cannot start sandboxed (it cannot nest inside another sandbox or most
 * containers), retry once without it and say so. Only this tool's own localhost pages are ever loaded.
 */
export async function launchChrome(
	chromePath: string,
	width: number,
	height: number,
	opts: { noSandbox?: boolean } = {},
): Promise<Browser> {
	const runningAsRoot = typeof process.getuid === "function" && process.getuid() === 0;
	if (opts.noSandbox || runningAsRoot) return launchOnce(chromePath, width, height, true);
	try {
		return await launchOnce(chromePath, width, height, false);
	} catch (e) {
		console.warn(
			`Warning: Chrome would not start with its sandbox (${e instanceof Error ? e.message : e}); retrying with --no-sandbox. ` +
				"This tool only loads its own localhost page. Pass --no-sandbox to skip this check.",
		);
		return launchOnce(chromePath, width, height, true);
	}
}

async function launchOnce(chromePath: string, width: number, height: number, noSandbox: boolean): Promise<Browser> {
	const userDataDir = mkdtempSync(join(tmpdir(), "vw-chrome-"));
	const args = [...FLAGS, "--remote-debugging-port=0", `--user-data-dir=${userDataDir}`, `--window-size=${width},${height}`];
	if (noSandbox) args.push("--no-sandbox");

	const proc: ChildProcess = spawn(chromePath, args, { stdio: ["ignore", "ignore", "pipe"] });
	let closed = false;
	const cleanup = () => {
		if (closed) return;
		closed = true;
		try {
			proc.kill("SIGKILL");
		} catch {
			// already gone
		}
		try {
			rmSync(userDataDir, { recursive: true, force: true });
		} catch {
			// best effort
		}
	};

	try {
		const wsUrl = await new Promise<string>((resolve, reject) => {
			let buf = "";
			const timer = setTimeout(() => reject(new Error("Chrome did not start within 20s")), 20000);
			proc.stderr?.on("data", (d: Buffer) => {
				buf += d.toString();
				const m = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
				if (m) {
					clearTimeout(timer);
					resolve(m[1]);
				}
			});
			proc.on("error", (e) => {
				clearTimeout(timer);
				reject(e);
			});
			proc.on("exit", (code) => {
				clearTimeout(timer);
				reject(new Error(`Chrome exited early (code ${code}): ${buf.slice(-300)}`));
			});
		});
		const port = new URL(wsUrl).port;
		const cdp = await Cdp.connect(wsUrl);
		await cdp.attachNewPage();
		await cdp.evaluate("1"); // the page's renderer must come up; this fails if the sandbox killed it
		const version = ((await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()) as { Browser?: string }).Browser ?? "chrome";
		return { cdp, version, close: () => (cdp.close(), cleanup()) };
	} catch (e) {
		cleanup();
		throw e;
	}
}
