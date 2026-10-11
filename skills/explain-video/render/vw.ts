/**
 * Command line entry for agents:
 *
 *   node vw.ts render <timeline.ts> [--output out.mp4] [--fps N] [--width N] [--height N]
 *                     [--audio-track none] [--chrome PATH] [--no-sandbox] [--dry-run] [--verbose]
 *
 * Exit code 0 on success. Errors print a one-line message and a hint, with no stack trace.
 */

// stripTypeScriptTypes prints an ExperimentalWarning on every run; keep any other warning.
process.removeAllListeners("warning");
process.on("warning", (w) => {
	if (w.name !== "ExperimentalWarning") console.error(`${w.name}: ${w.message}`);
});

import { UserError } from "./errors.ts";
import { runRender } from "./render.ts";

const USAGE =
	"Usage: node vw.ts render <timeline.ts> [--output out.mp4] [--fps N] [--width N] [--height N] [--audio-track none] [--chrome PATH] [--no-sandbox] [--dry-run] [--verbose]";

function parseArgs(argv: string[]) {
	const [command, ...rest] = argv;
	if (command !== "render") throw new UserError(`Unknown command "${command ?? ""}"`, USAGE);
	const opts: Record<string, string | boolean> = {};
	const positional: string[] = [];
	const flagsWithValue = new Set(["output", "o", "fps", "width", "height", "audio-track", "chrome"]);
	for (let i = 0; i < rest.length; i++) {
		const arg = rest[i];
		if (!arg.startsWith("-")) {
			positional.push(arg);
			continue;
		}
		const key = arg.replace(/^-+/, "");
		if (flagsWithValue.has(key)) {
			const value = rest[++i];
			if (value === undefined) throw new UserError(`--${key} needs a value`, USAGE);
			opts[key] = value;
		} else if (key === "verbose" || key === "dry-run" || key === "no-sandbox") {
			opts[key] = true;
		} else {
			throw new UserError(`Unknown option ${arg}`, USAGE);
		}
	}
	if (positional.length !== 1) throw new UserError("Pass exactly one timeline path", USAGE);
	const num = (name: string): number | undefined => {
		if (opts[name] === undefined) return undefined;
		const n = Number(opts[name]);
		if (!Number.isFinite(n) || n <= 0) throw new UserError(`--${name} must be a positive number`);
		return n;
	};
	const audio = opts["audio-track"];
	if (audio !== undefined && audio !== "none") {
		throw new UserError(`--audio-track ${audio} is not supported`, "This renderer only supports --audio-track none; other tracks come from timeline default_audio_track.");
	}
	return {
		timeline: positional[0],
		output: String(opts.output ?? opts.o ?? "output.mp4"),
		fps: num("fps"),
		width: num("width"),
		height: num("height"),
		audioTrackNone: audio === "none",
		chrome: opts.chrome as string | undefined,
		noSandbox: opts["no-sandbox"] === true,
		verbose: opts.verbose === true,
		dryRun: opts["dry-run"] === true,
	};
}

try {
	const result = await runRender(parseArgs(process.argv.slice(2)));
	if (result.outputPath) {
		console.log(`Rendered ${result.frames} frames (${result.duration.toFixed(1)}s) to ${result.outputPath}`);
	}
} catch (e) {
	if (e instanceof UserError) {
		console.error(`Error: ${e.message}`);
		if (e.hint) console.error(`Hint: ${e.hint}`);
	} else {
		console.error(`Error: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
	}
	process.exit(1);
}
