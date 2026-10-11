/**
 * Tests for the distilled renderer. Run from this folder:  node --test test/
 * Integration tests need Chrome and ffmpeg and are skipped when either is missing.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { request } from "node:http";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { findChrome } from "../cdp.ts";
import { buildFfmpegArgs, findFfmpeg } from "../ffmpeg.ts";
import { loadModule } from "../loader.ts";
import { startServer } from "../serve.ts";
import {
	applyMetaDefaults,
	buildFrameSchedule,
	resolveTiming,
	validateSegmentAdvances,
	validateTiming,
} from "../runtime/timeline.ts";
import type { Timeline } from "../runtime/types.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "fixture");
const VW = join(HERE, "..", "vw.ts");

function tempCopyOfFixture(): string {
	const dir = mkdtempSync(join(tmpdir(), "vw-test-"));
	cpSync(FIXTURE, dir, { recursive: true });
	return dir;
}

const have = (fn: () => unknown) => {
	try {
		fn();
		return true;
	} catch {
		return false;
	}
};
const canRender = have(() => findChrome()) && have(() => findFfmpeg());

// ---- timeline logic (pure) ----

const timeline: Timeline = { meta: { title: "t" }, segments: [{ id: "a" }, { id: "b" }] };

test("frame schedule: beats land on rounded global frames and segments accumulate", () => {
	const schedule = buildFrameSchedule(timeline, new Map([["a", [1.0, 2.5]], ["b", [1.0]]]), 10);
	assert.deepEqual(
		schedule.map((s) => [s.globalFrame, s.segmentId, s.isLast]),
		[[10, "a", false], [25, "a", true], [35, "b", true]],
	);
});

test("timing precedence: audio track beats default_timing beats segment advances", () => {
	const segments = [{ id: "a", advances: [1, 2] }, { id: "b", advances: [3] }];
	const track = { audio_file: "x.mp3", length_s: 9, timing: { perSegment: { a: [5, 6] } } };
	assert.equal(resolveTiming({ segments }).source, "segments");
	assert.deepEqual(resolveTiming({ segments, defaultTiming: { perSegment: { b: [4] } } }).perSegment, { a: [1, 2], b: [4] });
	const withTrack = resolveTiming({ segments, defaultAudioTrack: track });
	assert.equal(withTrack.source, "audio_track");
	assert.deepEqual(withTrack.perSegment, { a: [5, 6], b: [3] });
	assert.equal(resolveTiming({ segments, defaultAudioTrack: track, audioTrackNone: true }).source, "segments");
});

test("advances must be present, positive and strictly increasing", () => {
	assert.equal(validateSegmentAdvances(timeline, { a: [1, 2], b: [1] }).ok, true);
	const bad = validateSegmentAdvances(timeline, { a: [2, 1], b: [] });
	assert.equal(bad.ok, false);
	assert.match(JSON.stringify(bad), /monotonically increasing/);
	assert.match(JSON.stringify(bad), /missing or empty/);
});

test("audio track timing: unknown segment warns, bad value errors", () => {
	const warn = validateTiming({ perSegment: { ghost: [1] } }, ["a"]);
	assert.equal(warn.ok, true);
	assert.match(warn.warnings[0], /ghost/);
	assert.equal(validateTiming({ perSegment: { a: [0] } }, ["a"]).ok, false);
});

test("meta defaults: timeline > config > 1920x1080 @ 60", () => {
	assert.deepEqual(applyMetaDefaults(timeline, { projectStructure: "v1" }).meta.resolution, [1920, 1080]);
	assert.equal(applyMetaDefaults(timeline, { projectStructure: "v1", defaults: { fps: 30 } }).meta.fps, 30);
	assert.equal(applyMetaDefaults({ ...timeline, meta: { title: "t", fps: 24 } }, { projectStructure: "v1", defaults: { fps: 30 } }).meta.fps, 24);
});

test("ffmpeg args: audio is padded and clipped to the video length", () => {
	const noAudio = buildFfmpegArgs({ fps: 30, outputPath: "o.mp4" });
	assert.ok(!noAudio.includes("-shortest"));
	const withAudio = buildFfmpegArgs({ fps: 30, outputPath: "o.mp4", audioFilePath: "a.mp3" });
	assert.ok(withAudio.includes("apad") && withAudio.includes("-shortest"));
	assert.equal(withAudio.at(-1), "o.mp4");
});

// ---- Node loader hook ----

test("loader: bare 'videowright', CSS imports and .js-for-.ts imports all resolve", async () => {
	const dir = tempCopyOfFixture();
	const config = (await loadModule(join(dir, "videowright.config.ts"))).default as { projectStructure: string };
	assert.equal(config.projectStructure, "v1");
	const tl = (await loadModule(join(dir, "timeline.ts"))).default as Timeline; // imports ./theme.css
	assert.deepEqual(tl.segments.map((s) => s.id), ["one", "two"]);
	mkdirSync(join(dir, "audio"));
	writeFileSync(join(dir, "audio", "track.ts"), "export default { n: 1 };\n");
	writeFileSync(join(dir, "uses_js.ts"), 'import t from "./audio/track.js";\nexport default t;\n');
	assert.deepEqual((await loadModule(join(dir, "uses_js.ts"))).default, { n: 1 });
});

// ---- static server ----

test("server: serves, strips types, resolves extensionless, wraps CSS, guards paths", async () => {
	const dir = tempCopyOfFixture();
	const outside = mkdtempSync(join(tmpdir(), "vw-outside-"));
	writeFileSync(join(outside, "shared.css"), "a{color:red}");
	symlinkSync(outside, join(dir, "linked")); // a symlink the project owner placed inside the project
	writeFileSync(join(dir, "segments", "bad.ts"), "enum E { A }\nexport const e = E.A;\n");
	const server = await startServer({ projectRoot: dir, timelinePath: join(dir, "timeline.ts"), fps: 10 });
	const get = (path: string) => fetch(server.url + path);
	try {
		const page = await (await get("/render.html")).text();
		assert.match(page, /"videowright":"\/__vw\/index\.ts"/);

		const virt = await (await get("/__vw/virtual.js")).text();
		assert.match(virt, /"one": \(\) => import\("\/c\/segments\/one\/index\.ts"\)/);
		assert.match(virt, /export const fps = 10/);

		const stripped = await (await get("/c/segments/label")).text(); // extensionless -> label.ts
		assert.match(stripped, /export function label\(text\s*\)\s*\{/); // types become spaces, so line numbers stay accurate
		assert.ok(!stripped.includes(": string"), "types must be stripped");

		const css = await get("/c/theme.css");
		assert.match(css.headers.get("content-type") ?? "", /javascript/);
		assert.match(await css.text(), /document\.head\.appendChild/);

		assert.equal((await get("/c/linked/shared.css")).status, 200, "in-project symlinks are followed");
		assert.equal((await get("/c/../../../etc/hosts")).status, 404, "dot-dot traversal is blocked");
		assert.equal((await get("/c/%2e%2e/%2e%2e/etc/hosts")).status, 404, "encoded traversal is blocked");
		// fetch() ignores a custom Host header, so send this one with node:http.
		const foreign = await new Promise<number>((resolve, reject) => {
			const u = new URL(server.url);
			request({ host: u.hostname, port: u.port, path: "/render.html", headers: { Host: "evil.example:80" } }, (res) => {
				res.resume();
				resolve(res.statusCode ?? 0);
			}).on("error", reject).end();
		});
		assert.equal(foreign, 403, "foreign Host is refused");
		const bad = await get("/c/segments/bad.ts");
		assert.equal(bad.status, 500);
		assert.match(await bad.text(), /enum/i);
	} finally {
		await server.close();
	}
});

// ---- real renders ----

function run(args: string[]) {
	return spawnSync("node", [VW, "render", ...args], { encoding: "utf-8", timeout: 120000 });
}

test("render: dry run reports the frame count without rendering", { skip: !canRender }, () => {
	const r = run([join(FIXTURE, "timeline.ts"), "--dry-run"]);
	assert.equal(r.status, 0, r.stderr);
	assert.match(r.stdout, /total frames: 30 \(3\.0s\) at 320x180 10fps/);
});

test("render: produces an mp4 of the expected length", { skip: !canRender }, () => {
	const out = join(mkdtempSync(join(tmpdir(), "vw-out-")), "o.mp4");
	const r = run([join(FIXTURE, "timeline.ts"), "--output", out]);
	assert.equal(r.status, 0, r.stderr);
	assert.match(r.stdout, /Rendered 30 frames/);
	assert.ok(existsSync(out) && statSync(out).size > 1000);
	assert.ok(readFileSync(out).subarray(4, 8).toString() === "ftyp");
});

test("render: a segment that throws fails the render with its message", { skip: !canRender }, () => {
	const dir = tempCopyOfFixture();
	const file = join(dir, "segments", "one", "index.ts");
	writeFileSync(file, readFileSync(file, "utf-8").replace("await ctx.hold(500);", 'throw new Error("boom in play");'));
	const r = run([join(dir, "timeline.ts"), "--output", join(dir, "o.mp4")]);
	assert.notEqual(r.status, 0);
	assert.match(r.stderr, /boom in play/);
});

test("render: a missing segment is named in the error", { skip: !canRender }, () => {
	const dir = tempCopyOfFixture();
	const file = join(dir, "timeline.ts");
	writeFileSync(file, readFileSync(file, "utf-8").replace('{ id: "two", transition: "fade" }', '{ id: "two", transition: "fade" }, { id: "ghost" }'));
	const r = run([join(dir, "timeline.ts"), "--dry-run"]);
	assert.notEqual(r.status, 0);
	assert.match(r.stderr, /Missing segment "ghost"/);
});

test("render: more advances than waitForNext() calls renders but warns", { skip: !canRender }, () => {
	const dir = tempCopyOfFixture();
	const file = join(dir, "segments", "one", "index.ts");
	writeFileSync(file, readFileSync(file, "utf-8").replace("advances: [1, 2]", "advances: [1, 2, 3]"));
	const r = run([join(dir, "timeline.ts"), "--output", join(dir, "o.mp4")]);
	assert.equal(r.status, 0, r.stderr);
	assert.match(r.stderr, /Warning: segment "one": a scheduled beat had no pending waitForNext/);
});
