/** ffmpeg discovery and invocation. Derived from videowright 0.1.1 (MIT), see UPSTREAM.md. */

import { execFileSync, spawn } from "node:child_process";
import { platform } from "node:os";
import { UserError } from "./errors.ts";

/** Find ffmpeg on PATH. */
export function findFfmpeg(): string {
	const whichCmd = platform() === "win32" ? "where" : "which";
	try {
		const result = execFileSync(whichCmd, ["ffmpeg"], { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
		const path = result.trim().split("\n")[0].trim();
		if (path) return path;
	} catch {
		// not found
	}
	throw new UserError(
		"ffmpeg not found on PATH",
		platform() === "darwin" ? "Install it with: brew install ffmpeg" : "Install ffmpeg with your package manager",
	);
}

/** Write to a stream, waiting for 'drain' when the pipe is full. */
export function writeWithBackpressure(stream: NodeJS.WritableStream, data: Buffer): Promise<void> {
	return new Promise((resolve, reject) => {
		if (stream.write(data)) {
			resolve();
			return;
		}
		const onDrain = () => {
			stream.removeListener("error", onError);
			resolve();
		};
		const onError = (err: Error) => {
			stream.removeListener("drain", onDrain);
			reject(err);
		};
		stream.once("drain", onDrain);
		stream.once("error", onError);
	});
}

/**
 * Arguments for one render pass: PNG frames on stdin, optional audio file.
 * Video length is canonical: `apad` extends the audio with silence and `-shortest` clips at the video end.
 */
export function buildFfmpegArgs(opts: { fps: number; outputPath: string; audioFilePath?: string }): string[] {
	const { fps, outputPath, audioFilePath } = opts;
	const args: string[] = ["-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "pipe:0"];
	if (audioFilePath) args.push("-i", audioFilePath);
	args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "18");
	if (audioFilePath) {
		args.push("-c:a", "aac", "-b:a", "192k", "-map", "0:v:0", "-map", "1:a:0", "-af", "apad", "-shortest");
	}
	args.push("-r", String(fps), outputPath);
	return args;
}

export interface FfmpegResult {
	code: number;
	stderr: string;
}

export function spawnFfmpeg(ffmpegPath: string, args: string[]) {
	const proc = spawn(ffmpegPath, args, { stdio: ["pipe", "pipe", "pipe"] });
	let stderr = "";
	proc.stderr?.on("data", (chunk: Buffer) => {
		stderr += chunk.toString();
	});
	const done = new Promise<FfmpegResult>((resolve, reject) => {
		proc.on("close", (code) => resolve({ code: code ?? 1, stderr }));
		proc.on("error", reject);
	});
	return { process: proc, done };
}
