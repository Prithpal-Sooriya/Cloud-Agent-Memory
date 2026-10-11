/**
 * What `import ... from "videowright"` resolves to, both in Node (loading config/timeline) and in the
 * browser (loading segments). Safe to import in Node: no DOM access at module load.
 */

export { SEGMENT_BRAND } from "./types.ts";
export type {
	AudioTrack,
	Config,
	PlayerContext,
	Segment,
	SegmentSpec,
	Timeline,
	TimelineEntry,
	TimelineMeta,
	Timing,
	Transition,
	TransitionContext,
} from "./types.ts";
export { defineConfig, defineSegment } from "./segment.ts";
export { cut, fade, slideDown, slideLeft, slideRight, slideUp } from "./transitions.ts";
