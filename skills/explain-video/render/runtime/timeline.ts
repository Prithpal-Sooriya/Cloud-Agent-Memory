/**
 * Timeline validation, meta defaults and timing resolution (pure functions, no DOM, no fs).
 * Derived from videowright 0.1.1 (MIT), see ../UPSTREAM.md.
 */

import { cut, fade, slideDown, slideLeft, slideRight, slideUp } from "./transitions.ts";
import type {
	AudioTrack,
	Config,
	ResolvedTimelineMeta,
	Segment,
	SegmentSpec,
	Timeline,
	Timing,
	Transition,
} from "./types.ts";

export type SegmentLoaderMap = Map<string, () => Promise<{ default: Segment }>>;
export type TransitionLoaderMap = Map<string, () => Promise<{ default: Transition }>>;

/** Built-in transitions plus any registered in config.transitions. */
export function buildTransitionLoaderMap(config: Config): TransitionLoaderMap {
	const map: TransitionLoaderMap = new Map();
	const builtin: Record<string, Transition> = { cut, fade, slideLeft, slideRight, slideUp, slideDown };
	for (const [name, fn] of Object.entries(builtin)) {
		map.set(name, () => Promise.resolve({ default: fn }));
	}
	for (const [name, loader] of Object.entries(config.transitions ?? {})) {
		if (map.has(name)) console.warn(`Custom transition "${name}" shadows a built-in.`);
		map.set(name, loader);
	}
	return map;
}

export type TimelineError =
	| { kind: "missing-segment"; segmentId: string; timelineTitle: string }
	| { kind: "missing-transition"; transitionName: string; segmentId: string }
	| { kind: "missing-title" };

export type TimelineValidationResult = { ok: true } | { ok: false; errors: TimelineError[] };

export function validateTimeline(
	timeline: Timeline,
	segmentLoaders: SegmentLoaderMap,
	transitionLoaders: TransitionLoaderMap,
): TimelineValidationResult {
	const errors: TimelineError[] = [];
	if (!timeline.meta.title || timeline.meta.title.trim() === "") errors.push({ kind: "missing-title" });
	const title = timeline.meta.title && timeline.meta.title.trim() !== "" ? timeline.meta.title : "(untitled)";
	for (const entry of timeline.segments) {
		if (!segmentLoaders.has(entry.id)) {
			errors.push({ kind: "missing-segment", segmentId: entry.id, timelineTitle: title });
		}
		if (entry.transition) {
			const name = typeof entry.transition === "string" ? entry.transition : entry.transition.type;
			if (!transitionLoaders.has(name)) {
				errors.push({ kind: "missing-transition", transitionName: name, segmentId: entry.id });
			}
		}
	}
	return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function describeTimelineError(e: TimelineError): string {
	switch (e.kind) {
		case "missing-segment":
			return `Missing segment "${e.segmentId}" in timeline "${e.timelineTitle}" (expected segments/${e.segmentId}/index.ts)`;
		case "missing-transition":
			return `Missing transition "${e.transitionName}" on segment "${e.segmentId}"`;
		case "missing-title":
			return "Timeline is missing a title";
	}
}

export type ValidationResult = { ok: true; warnings: string[] } | { ok: false; errors: string[]; warnings: string[] };

/** Every timeline segment must declare a non-empty, positive, strictly increasing `advances` array. */
export function validateSegmentAdvances(
	timeline: Timeline,
	advancesMap: Record<string, number[]>,
): { ok: true } | { ok: false; errors: string[] } {
	const errors: string[] = [];
	for (const entry of timeline.segments) {
		const advances = advancesMap[entry.id];
		if (!advances || !Array.isArray(advances) || advances.length === 0) {
			errors.push(`Segment "${entry.id}": missing or empty 'advances' array. Every segment must declare advances for render timing.`);
			continue;
		}
		for (let i = 0; i < advances.length; i++) {
			const v = advances[i];
			if (typeof v !== "number" || v <= 0 || !Number.isFinite(v)) {
				errors.push(`Segment "${entry.id}": advances[${i}] must be a positive number (got ${v})`);
			}
			if (i > 0 && v <= advances[i - 1]) {
				errors.push(
					`Segment "${entry.id}": advances must be monotonically increasing (advances[${i}]=${v} <= advances[${i - 1}]=${advances[i - 1]})`,
				);
			}
		}
	}
	return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

/** Validate an audio track's timing object against the timeline's segment ids. */
export function validateTiming(timing: Timing, segmentIds: string[]): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const known = new Set(segmentIds);
	for (const [segId, advances] of Object.entries(timing.perSegment)) {
		if (!known.has(segId)) {
			warnings.push(`Timing references unknown segment "${segId}" -- possible typo or renamed segment.`);
		}
		if (!advances) continue;
		if (!Array.isArray(advances)) {
			errors.push(`Timing for segment "${segId}": expected an array of numbers.`);
			continue;
		}
		if (advances.length === 0) {
			errors.push(`Timing for segment "${segId}": advances array must not be empty.`);
			continue;
		}
		for (let i = 0; i < advances.length; i++) {
			const v = advances[i];
			if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) {
				errors.push(`Timing for segment "${segId}": advances[${i}] must be a positive finite number (got ${v}).`);
			}
		}
	}
	return errors.length > 0 ? { ok: false, errors, warnings } : { ok: true, warnings };
}

/** Fill resolution, fps and aspectRatio: timeline meta > config.defaults > 1920x1080 @ 60 fps. */
export function applyMetaDefaults(
	timeline: Timeline,
	config: Config,
): Timeline & { meta: ResolvedTimelineMeta } {
	const d = config.defaults ?? {};
	return {
		...timeline,
		meta: {
			...timeline.meta,
			resolution: timeline.meta.resolution ?? d.resolution ?? [1920, 1080],
			fps: timeline.meta.fps ?? d.fps ?? 60,
			aspectRatio: timeline.meta.aspectRatio ?? d.aspectRatio ?? "16:9",
		},
	};
}

export type TimingSegment = Pick<SegmentSpec, "id" | "advances">;

export type ResolvedTiming = {
	source: "audio_track" | "default_timing" | "segments";
	audioTrack?: AudioTrack;
	perSegment: Record<string, number[]>;
};

/**
 * Active per-segment advances. Precedence: default_audio_track timing, then default_timing,
 * then the segments' own `advances`. `audioTrackNone` suppresses the audio track layer.
 */
export function resolveTiming(args: {
	segments: TimingSegment[];
	defaultTiming?: Timing;
	defaultAudioTrack?: AudioTrack;
	audioTrackNone?: boolean;
}): ResolvedTiming {
	const base: Record<string, number[]> = {};
	for (const seg of args.segments) base[seg.id] = seg.advances;
	const overlay = (timing: Timing): Record<string, number[]> => {
		const result = { ...base };
		for (const [segId, advances] of Object.entries(timing.perSegment)) {
			if (advances) result[segId] = advances;
		}
		return result;
	};
	if (!args.audioTrackNone && args.defaultAudioTrack) {
		return { source: "audio_track", audioTrack: args.defaultAudioTrack, perSegment: overlay(args.defaultAudioTrack.timing) };
	}
	if (args.defaultTiming) {
		return { source: "default_timing", perSegment: overlay(args.defaultTiming) };
	}
	return { source: "segments", perSegment: base };
}

/** Flat schedule of the global frame at which each beat advance fires. */
export function buildFrameSchedule(
	timeline: Timeline,
	segmentAdvances: Map<string, number[]>,
	fps: number,
): Array<{ globalFrame: number; segmentId: string; advanceIndex: number; isLast: boolean }> {
	const schedule: Array<{ globalFrame: number; segmentId: string; advanceIndex: number; isLast: boolean }> = [];
	let cumulativeFrames = 0;
	for (const entry of timeline.segments) {
		const advances = segmentAdvances.get(entry.id);
		if (!advances) continue;
		for (let i = 0; i < advances.length; i++) {
			schedule.push({
				globalFrame: cumulativeFrames + Math.round(advances[i] * fps),
				segmentId: entry.id,
				advanceIndex: i,
				isLast: i === advances.length - 1,
			});
		}
		cumulativeFrames += Math.round(advances[advances.length - 1] * fps);
	}
	return schedule;
}
