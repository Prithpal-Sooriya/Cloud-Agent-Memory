/**
 * defineSegment, defineConfig and the per-mount SegmentRunner.
 * Derived from videowright 0.1.1 (MIT), see ../UPSTREAM.md.
 */

import { SEGMENT_BRAND } from "./types.ts";
import type { Config, PlayerContext, Segment, SegmentSpec } from "./types.ts";

/** Author a segment with strict validation of `advances`. */
export function defineSegment(spec: SegmentSpec): Segment {
	if (!spec.id) throw new TypeError("defineSegment: id is required");
	if (!spec.play) throw new TypeError("defineSegment: play is required");
	if (!spec.advances || !Array.isArray(spec.advances) || spec.advances.length === 0) {
		throw new TypeError(
			`defineSegment: advances is required and must be a non-empty array (segment "${spec.id}")`,
		);
	}
	for (let i = 0; i < spec.advances.length; i++) {
		const v = spec.advances[i];
		if (typeof v !== "number" || v <= 0 || !Number.isFinite(v)) {
			throw new TypeError(
				`defineSegment: advances[${i}] must be a positive number (segment "${spec.id}", got ${v})`,
			);
		}
		if (i > 0 && v <= spec.advances[i - 1]) {
			throw new TypeError(
				`defineSegment: advances must be monotonically increasing (segment "${spec.id}", advances[${i}]=${v} <= advances[${i - 1}]=${spec.advances[i - 1]})`,
			);
		}
	}
	return Object.freeze({ ...spec, [SEGMENT_BRAND]: true as const });
}

/** Identity helper for typed videowright.config.ts. */
export function defineConfig(config: Config): Config {
	return config;
}

/** Thrown inside play() when the segment is unmounted. */
export class SegmentAbortError extends DOMException {
	constructor() {
		super("Segment aborted", "AbortError");
	}
}

export function isAbortError(e: unknown): boolean {
	return e instanceof DOMException && e.name === "AbortError";
}

type RunnerState = "created" | "mounted" | "playing" | "done" | "unmounted";

/** Per-mount wrapper: beat counter, waitForNext resolver queue, abort controller, context. */
export class SegmentRunner {
	readonly segment: Segment;

	private resolvers: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];
	private beatCounter = 0;
	private abortCtrl = new AbortController();
	private mountedAt = 0;
	private _playPromise: Promise<void> | null = null;
	private state: RunnerState = "created";

	constructor(segment: Segment) {
		this.segment = segment;
	}

	async mount(el: HTMLElement): Promise<void> {
		if (this.state !== "created") throw new Error("SegmentRunner: already mounted");
		this.mountedAt = performance.now();
		if (this.segment.mount) {
			await this.segment.mount(el, this.makeContext());
		}
		this.state = "mounted";
	}

	startPlay(): Promise<void> {
		if (this.state !== "mounted") throw new Error("SegmentRunner: not mounted");
		this.state = "playing";
		this._playPromise = this.segment
			.play(this.makeContext())
			.catch((e) => {
				// Swallow AbortError so play() resolves cleanly on unmount-triggered teardown.
				if (!isAbortError(e)) throw e;
			})
			.finally(() => {
				if (this.state !== "unmounted") this.state = "done";
			});
		return this._playPromise;
	}

	/** Fire the next beat. Returns true if a waitForNext() was pending (or segment.next consumed it). */
	triggerNext(): boolean {
		if (this.segment.next) {
			const consumed = this.segment.next();
			if (consumed === true) {
				this.beatCounter++;
				return true;
			}
			if (consumed === false) return false;
		}
		if (this.resolvers.length === 0) return false;
		const r = this.resolvers.shift();
		if (r) {
			this.beatCounter++;
			r.resolve();
		}
		return true;
	}

	unmount(): void {
		if (this.state === "unmounted") return;
		this.abortCtrl.abort();
		if (this.segment.unmount) {
			try {
				this.segment.unmount();
			} catch (e) {
				console.error("unmount() threw", e);
			}
		}
		const abortErr = new SegmentAbortError();
		while (this.resolvers.length) {
			const r = this.resolvers.shift();
			if (r) r.reject(abortErr);
		}
		this.state = "unmounted";
	}

	get playPromise(): Promise<void> | null {
		return this._playPromise;
	}

	private makeContext(): PlayerContext {
		return {
			waitForNext: () =>
				new Promise<void>((resolve, reject) => {
					if (this.state === "unmounted") {
						reject(new SegmentAbortError());
						return;
					}
					this.resolvers.push({ resolve, reject });
				}),
			hold: (ms: number) =>
				// The time shim virtualizes setTimeout, so this fires as the driver advances the clock.
				new Promise<void>((resolve, reject) => {
					if (this.abortCtrl.signal.aborted) {
						reject(new SegmentAbortError());
						return;
					}
					const onAbort = () => {
						clearTimeout(t);
						reject(new SegmentAbortError());
					};
					const t = setTimeout(() => {
						this.abortCtrl.signal.removeEventListener("abort", onAbort);
						resolve();
					}, ms);
					this.abortCtrl.signal.addEventListener("abort", onAbort, { once: true });
				}),
			signal: this.abortCtrl.signal,
			mode: "render",
			// performance.now() is virtualized by the time shim.
			clock: () => performance.now() - this.mountedAt,
		};
	}
}
