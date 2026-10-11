/**
 * Render driver: serve the project, open it in Chrome, step the virtual clock frame by frame, pipe PNG
 * frames to ffmpeg. Derived from videowright 0.1.1 `render` (MIT), see UPSTREAM.md.
 */

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Cdp, applyPageDefaults, findChrome, launchChrome } from "./cdp.ts";
import type { Browser } from "./cdp.ts";
import { UserError } from "./errors.ts";
import { buildFfmpegArgs, findFfmpeg, spawnFfmpeg, writeWithBackpressure } from "./ffmpeg.ts";
import { loadModule } from "./loader.ts";
import { startServer } from "./serve.ts";
import { TIME_SHIM_SOURCE } from "./time_shim.ts";
import { applyMetaDefaults, buildFrameSchedule, resolveTiming, validateSegmentAdvances, validateTiming } from "./runtime/timeline.ts";
import type { AudioTrack, Config, Timeline } from "./runtime/types.ts";

export interface RenderOptions {
	timeline: string;
	noSandbox?: boolean;
	output: string;
	fps?: number;
	width?: number;
	height?: number;
	audioTrackNone?: boolean;
	chrome?: string;
	verbose?: boolean;
	dryRun?: boolean;
}

export interface RenderResult {
	outputPath?: string;
	frames: number;
	duration: number;
}

/** The project root is the nearest folder at or above the timeline that holds videowright.config.ts. */
function findProjectRoot(timelinePath: string): string {
	let dir = dirname(timelinePath);
	for (;;) {
		if (existsSync(join(dir, "videowright.config.ts"))) return dir;
		const parent = dirname(dir);
		if (parent === dir) {
			throw new UserError(
				`No videowright.config.ts found at or above ${dirname(timelinePath)}`,
				"Create one with: export default defineConfig({ projectStructure: 'v1' }) importing defineConfig from 'videowright'.",
			);
		}
		dir = parent;
	}
}

export async function runRender(opts: RenderOptions): Promise<RenderResult> {
	const log = (msg: string) => opts.verbose && console.log(msg);

	const timelinePath = resolve(opts.timeline);
	if (!existsSync(timelinePath)) throw new UserError(`Timeline not found: ${timelinePath}`);
	const projectRoot = findProjectRoot(timelinePath);
	if (!timelinePath.startsWith(projectRoot)) throw new UserError("Timeline must be inside the project root");

	const ffmpegPath = opts.dryRun ? "" : findFfmpeg();
	const chromePath = findChrome(opts.chrome);
	log(`chrome: ${chromePath}`);

	// Config and timeline are loaded in Node only for settings and audio. Segments load in the browser.
	const config = (await loadModule(join(projectRoot, "videowright.config.ts"))).default as Config | undefined;
	if (!config) throw new UserError("videowright.config.ts has no default export");
	const timeline = (await loadModule(timelinePath)).default as Timeline | undefined;
	if (!timeline) throw new UserError("timeline.ts has no default export");

	const meta = applyMetaDefaults(timeline, config).meta;
	const width = opts.width ?? meta.resolution[0];
	const height = opts.height ?? meta.resolution[1];
	const fps = opts.fps ?? meta.fps;
	const frameMs = 1000 / fps;

	// Audio: the timeline's default_audio_track, unless suppressed.
	const videoFolder = dirname(timelinePath);
	const track: AudioTrack | undefined = opts.audioTrackNone ? undefined : timeline.default_audio_track;
	let audioFilePath: string | undefined;
	if (track) {
		audioFilePath = resolve(videoFolder, track.audio_file);
		if (!existsSync(audioFilePath)) {
			throw new UserError(`Audio file not found: ${audioFilePath}`, "Check audio_file in default_audio_track.");
		}
		const check = validateTiming(track.timing, timeline.segments.map((s) => s.id));
		if (!check.ok) throw new UserError(`Audio track timing validation failed:\n${check.errors.join("\n")}`);
		for (const w of check.warnings) console.warn(`Warning: ${w}`);
	}
	log(`timeline: ${timelinePath} (${timeline.segments.length} segments), ${width}x${height} @ ${fps}fps`);

	const server = await startServer({ projectRoot, timelinePath, fps });
	let browser: Browser | null = null;
	let ffmpegProc: ReturnType<typeof spawnFfmpeg>["process"] | null = null;
	const cleanup = async () => {
		try {
			ffmpegProc?.kill();
		} catch {}
		try {
			browser?.close();
		} catch {}
		await server.close();
	};
	const onSignal = () => {
		cleanup().finally(() => process.exit(1));
	};
	process.on("SIGINT", onSignal);
	process.on("SIGTERM", onSignal);

	try {
		browser = await launchChrome(chromePath, width, height, { noSandbox: opts.noSandbox });
		log(`browser: ${browser.version}`);
		const cdp: Cdp = browser.cdp;

		const pageErrors: string[] = [];
		await cdp.send("Page.enable");
		await cdp.send("Runtime.enable");
		cdp.on("Runtime.exceptionThrown", (p) => {
			const d = p.exceptionDetails;
			const msg = d?.exception?.description ?? d?.text ?? "unknown page error";
			pageErrors.push(msg);
			if (opts.verbose) console.error(`[page error] ${msg}`);
		});
		cdp.on("Runtime.consoleAPICalled", (p) => {
			if (p.type === "error") {
				const text = (p.args ?? []).map((a: any) => a.value ?? a.description ?? "").join(" ");
				console.error(`[page console.error] ${text}`);
			}
		});
		await applyPageDefaults(cdp, width, height);
		// The time shim must run before any page script.
		await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: TIME_SHIM_SOURCE });
		await cdp.send("Page.navigate", { url: `${server.url}/render.html` });

		await cdp.waitForFunction("window.__VW_RENDER_READY__ === true", 30000);
		const bootError = await cdp.evaluate<string | null>("window.__VW_RENDER_ERROR__");
		if (bootError) throw new UserError(`Render boot failed: ${bootError}`);

		// The page already engaged virtual time when it finished booting (see runtime/entry.ts); this is a
		// no-op safety net.
		await cdp.evaluate("window.__VW_ENGAGE_VIRTUAL_TIME__()");

		const advancesMap = (await cdp.evaluate<Record<string, number[]>>("window.__VW_SEGMENT_ADVANCES__")) ?? {};
		const advResult = validateSegmentAdvances(timeline, advancesMap);
		if (!advResult.ok) {
			throw new UserError(`Advances validation failed:\n${advResult.errors.join("\n")}`, "Every segment must declare a valid 'advances' array.");
		}
		const resolved = resolveTiming({
			segments: timeline.segments.map((e) => ({ id: e.id, advances: advancesMap[e.id] ?? [] })),
			defaultTiming: timeline.default_timing,
			defaultAudioTrack: timeline.default_audio_track,
			audioTrackNone: opts.audioTrackNone,
		});
		log(`timing source: ${resolved.source}`);

		const segmentAdvances = new Map<string, number[]>();
		for (const entry of timeline.segments) {
			const adv = resolved.perSegment[entry.id];
			if (adv) segmentAdvances.set(entry.id, adv);
		}
		const schedule = buildFrameSchedule(timeline, segmentAdvances, fps);
		let totalFrames = 0;
		for (const entry of timeline.segments) {
			const adv = segmentAdvances.get(entry.id);
			if (adv && adv.length > 0) totalFrames += Math.round(adv[adv.length - 1] * fps);
		}
		console.log(`total frames: ${totalFrames} (${(totalFrames / fps).toFixed(1)}s) at ${width}x${height} ${fps}fps`);
		if (opts.dryRun) return { frames: totalFrames, duration: totalFrames / fps };

		const outputPath = resolve(opts.output);
		const { process: proc, done } = spawnFfmpeg(ffmpegPath, buildFfmpegArgs({ fps, outputPath, audioFilePath }));
		ffmpegProc = proc;
		const ffmpegErrors: Error[] = [];
		proc.stdin?.on("error", (err) => ffmpegErrors.push(err));

		let frameCount = 0;
		let scheduleIdx = 0;
		const progressEvery = Math.round(10 * fps); // every 10s of video
		let lastProgress = 0;

		try {
			while (frameCount < totalFrames) {
				if (ffmpegErrors.length > 0) throw new UserError(`ffmpeg stdin error: ${ffmpegErrors[0].message}`);
				if (pageErrors.length > 0) {
					throw new UserError(`Page error during rendering: ${pageErrors[pageErrors.length - 1]}`, "Check segment play() or mount() for runtime errors.");
				}

				while (scheduleIdx < schedule.length && schedule[scheduleIdx].globalFrame <= frameCount) {
					const entry = schedule[scheduleIdx];
					const hasMore = await cdp.evaluate<boolean>(`window.__VW_RENDER_ADVANCE__(${entry.isLast})`);
					const renderError = await cdp.evaluate<string | null>("window.__VW_RENDER_ERROR__");
					if (renderError) throw new UserError(`Render error: ${renderError}`);

					const currentSegment = await cdp.evaluate<string>("document.body.dataset.vwSegment");
					if (!entry.isLast && currentSegment !== entry.segmentId) {
						throw new UserError(
							`Segment "${entry.segmentId}" transitioned at advance index ${entry.advanceIndex} but advances array has more entries. Remove unused entries from the advances array.`,
						);
					}
					if (entry.isLast && !hasMore && scheduleIdx < schedule.length - 1) {
						console.warn(`Warning: renderAdvance returned false at segment "${entry.segmentId}" advance ${entry.advanceIndex}`);
					}
					scheduleIdx++;
				}

				// One frame of virtual time: fires due timers and RAF callbacks, steps WAAPI animations.
				await cdp.evaluate(`window.__VW_ADVANCE_CLOCK__(${frameMs})`);
				const png = await cdp.screenshot();
				if (!proc.stdin?.writable) break;
				await writeWithBackpressure(proc.stdin, png);
				frameCount++;

				if (frameCount - lastProgress >= progressEvery) {
					console.log(`Rendered ${(frameCount / fps).toFixed(1)}s / ${(totalFrames / fps).toFixed(1)}s`);
					lastProgress = frameCount;
				}
			}
		} finally {
			proc.stdin?.end();
		}

		const warnings = (await cdp.evaluate<string[] | undefined>("window.__VW_WARNINGS__")) ?? [];
		for (const w of [...new Set(warnings)]) console.warn(`Warning: ${w}`);

		const result = await done;
		if (result.code !== 0) {
			if (opts.verbose) console.error(`ffmpeg stderr:\n${result.stderr}`);
			throw new UserError(`ffmpeg exited with code ${result.code}`, "Run with --verbose to see ffmpeg's output.");
		}
		return { outputPath, frames: frameCount, duration: frameCount / fps };
	} finally {
		process.removeListener("SIGINT", onSignal);
		process.removeListener("SIGTERM", onSignal);
		await cleanup();
	}
}
