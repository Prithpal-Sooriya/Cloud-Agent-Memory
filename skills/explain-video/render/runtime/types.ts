/**
 * Public types for authoring videos. Derived from videowright 0.1.1 (MIT), see ../UPSTREAM.md.
 * Only `SEGMENT_BRAND` exists at runtime; everything else is erased by type stripping.
 */

export const SEGMENT_BRAND: unique symbol = Symbol.for("videowright.segment");

/** Runtime context passed to segment lifecycle methods. */
export interface PlayerContext {
	/** Pauses play() until the next scheduled beat. */
	waitForNext(): Promise<void>;
	/** Pauses play() for the given duration in milliseconds (virtual time while rendering). */
	hold(ms: number): Promise<void>;
	/** Aborted when the segment is unmounted. */
	signal: AbortSignal;
	/** Always "render" in this renderer. */
	mode: "interactive" | "render";
	/** Milliseconds since this segment instance was mounted (virtual time while rendering). */
	clock(): number;
}

/** User-facing spec passed to defineSegment. */
export interface SegmentSpec {
	/** Unique id matching the segment's folder name under segments/. */
	id: string;
	/**
	 * Segment-relative seconds at which each beat advance fires. Positive, strictly increasing.
	 * Length = number of waitForNext() calls + 1 (the last value is the segment's total length).
	 */
	advances: number[];
	voiceover?: string;
	notes?: string;
	mount?(el: HTMLElement, ctx: PlayerContext): void | Promise<void>;
	play(ctx: PlayerContext): Promise<void>;
	unmount?(): void;
	next?(): boolean;
	prev?(): boolean;
}

export interface Segment extends SegmentSpec {
	readonly [SEGMENT_BRAND]: true;
}

export interface TimelineEntry {
	/** Segment id (maps to segments/<id>/index.ts). */
	id: string;
	/** Transition used when entering this segment: a built-in name or `{ type, duration }`. */
	transition?: string | { type: string; [k: string]: unknown };
}

export interface TimelineMeta {
	title: string;
	style?: string;
	aspectRatio?: string;
	resolution?: [number, number];
	fps?: number;
}

export type ResolvedTimelineMeta = TimelineMeta &
	Required<Pick<TimelineMeta, "resolution" | "fps" | "aspectRatio">>;

export interface Timeline {
	meta: TimelineMeta;
	segments: TimelineEntry[];
	default_timing?: Timing;
	default_audio_track?: AudioTrack;
}

/** Per-segment advance overrides, keyed by segment id. */
export type Timing = {
	perSegment: Partial<Record<string, number[]>>;
};

export type AudioTrack = {
	/** Path to the audio file, relative to the folder containing timeline.ts. */
	audio_file: string;
	length_s: number;
	timing: Timing;
	audio_plan_path?: string;
	plan_snapshot_path?: string;
	created_at?: string;
	notes?: string;
};

export interface TransitionContext {
	direction: "forward" | "backward";
	duration?: number;
}

export type Transition = (
	outgoing: HTMLElement,
	incoming: HTMLElement,
	ctx: TransitionContext,
) => Promise<void>;

export interface Config {
	projectStructure: "v1";
	defaultStyle?: string;
	defaults?: {
		resolution?: [number, number];
		fps?: number;
		aspectRatio?: string;
	};
	transitions?: Record<string, () => Promise<{ default: Transition }>>;
}
