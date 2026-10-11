/**
 * Loopback static server for one render. Replaces Vite.
 *
 * - /render.html            generated page: import map + the render entry
 * - /__vw/virtual.js        generated module: fps, timeline/config URLs, segment loaders
 * - /__vw/<file>            this package's browser runtime (runtime/*.ts)
 * - /c/<path>               files of the video project (the folder holding videowright.config.ts)
 *
 * TypeScript is type-stripped per request with Node's built-in stripTypeScriptTypes, so no bundler is
 * needed. Browsers resolve the project's relative imports themselves; this server resolves extensionless
 * and `.js`-for-`.ts` requests. `.css` imports are served as a module that injects a <style> tag.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { stripTypeScriptTypes } from "node:module";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RUNTIME_DIR = join(dirname(fileURLToPath(import.meta.url)), "runtime");

const MIME: Record<string, string> = {
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".otf": "font/otf",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".mp4": "video/mp4",
};

export interface ServeOptions {
	/** Absolute folder holding videowright.config.ts. */
	projectRoot: string;
	/** Absolute path of the timeline file (inside projectRoot). */
	timelinePath: string;
	fps: number;
}

export interface RunningServer {
	url: string;
	close(): Promise<void>;
}

/** Ids of segments/<id>/index.ts, sorted. */
export function discoverSegmentIds(projectRoot: string): string[] {
	const dir = join(projectRoot, "segments");
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((name) => {
			try {
				return statSync(join(dir, name)).isDirectory() && existsSync(join(dir, name, "index.ts"));
			} catch {
				return false;
			}
		})
		.sort();
}

function urlFor(projectRoot: string, absPath: string): string {
	const rel = relative(projectRoot, absPath).split(sep).map(encodeURIComponent).join("/");
	return `/c/${rel}`;
}

function virtualModule(opts: ServeOptions): string {
	const ids = discoverSegmentIds(opts.projectRoot);
	const loaders = ids
		.map((id) => `  ${JSON.stringify(id)}: () => import(${JSON.stringify(urlFor(opts.projectRoot, join(opts.projectRoot, "segments", id, "index.ts")))})`)
		.join(",\n");
	return [
		`export const fps = ${JSON.stringify(opts.fps)};`,
		`export const timelineUrl = ${JSON.stringify(urlFor(opts.projectRoot, opts.timelinePath))};`,
		`export const configUrl = ${JSON.stringify(urlFor(opts.projectRoot, join(opts.projectRoot, "videowright.config.ts")))};`,
		`export const segmentLoaders = {\n${loaders}\n};`,
		"",
	].join("\n");
}

const RENDER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Render</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
#player-host { width: 100vw; height: 100vh; }
</style>
<script type="importmap">{"imports":{"videowright":"/__vw/index.ts"}}</script>
</head>
<body>
<div id="player-host"></div>
<script type="module" src="/__vw/entry.ts"></script>
</body>
</html>
`;

/**
 * Resolve a request path under `root` to a file, trying TS-style fallbacks. Null if it escapes the root or
 * does not exist. Containment is lexical (`..` cannot climb out), so a symlink the project owner placed
 * inside the project, such as a shared styles folder, is followed.
 */
function resolveUnder(root: string, relPath: string): string | null {
	const candidate = resolve(root, relPath);
	const inside = (p: string) => p === root || p.startsWith(root + sep);
	const candidates = [candidate];
	if (candidate.endsWith(".js")) candidates.push(`${candidate.slice(0, -3)}.ts`);
	candidates.push(`${candidate}.ts`, join(candidate, "index.ts"));
	for (const c of candidates) {
		if (!inside(c)) continue;
		try {
			if (statSync(c).isFile()) return c;
		} catch {
			// try next
		}
	}
	return null;
}

function send(res: import("node:http").ServerResponse, status: number, type: string, body: string | Buffer): void {
	res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
	res.end(body);
}

function serveFile(res: import("node:http").ServerResponse, file: string): void {
	const ext = extname(file).toLowerCase();
	const source = readFileSync(file);
	if (ext === ".ts") {
		send(res, 200, "text/javascript; charset=utf-8", stripTypeScriptTypes(source.toString("utf-8"), { mode: "strip" }));
	} else if (ext === ".js" || ext === ".mjs") {
		send(res, 200, "text/javascript; charset=utf-8", source);
	} else if (ext === ".css") {
		const css = JSON.stringify(source.toString("utf-8"));
		send(
			res,
			200,
			"text/javascript; charset=utf-8",
			`const css = ${css};\nconst el = document.createElement("style");\nel.textContent = css;\ndocument.head.appendChild(el);\nexport default css;\n`,
		);
	} else if (MIME[ext]) {
		send(res, 200, MIME[ext], source);
	} else {
		send(res, 404, "text/plain", `unsupported file type: ${ext}`);
	}
}

export async function startServer(opts: ServeOptions): Promise<RunningServer> {
	const server: Server = createServer((req, res) => {
		try {
			const host = req.headers.host ?? "";
			if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) {
				send(res, 403, "text/plain", "forbidden host");
				return;
			}
			const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
			if (path === "/render.html") {
				send(res, 200, "text/html; charset=utf-8", RENDER_HTML);
			} else if (path === "/__vw/virtual.js") {
				send(res, 200, "text/javascript; charset=utf-8", virtualModule(opts));
			} else if (path.startsWith("/__vw/")) {
				const file = resolveUnder(RUNTIME_DIR, path.slice("/__vw/".length));
				if (file) serveFile(res, file);
				else send(res, 404, "text/plain", `not found: ${path}`);
			} else if (path.startsWith("/c/")) {
				const file = resolveUnder(opts.projectRoot, path.slice("/c/".length));
				if (file) serveFile(res, file);
				else send(res, 404, "text/plain", `not found: ${path}`);
			} else {
				send(res, 404, "text/plain", "not found");
			}
		} catch (e) {
			// The browser only sees "failed to fetch module"; say why here.
			const message = e instanceof Error ? e.message : String(e);
			console.error(`[serve] ${req.url}: ${message}`);
			send(res, 500, "text/plain", message);
		}
	});
	await new Promise<void>((resolveListen, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => resolveListen());
	});
	const addr = server.address();
	if (!addr || typeof addr === "string") throw new Error("server did not bind");
	return {
		url: `http://127.0.0.1:${addr.port}`,
		close: () =>
			new Promise<void>((resolveClose) => {
				server.closeAllConnections?.();
				server.close(() => resolveClose());
			}),
	};
}
