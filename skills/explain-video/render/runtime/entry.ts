/**
 * Browser entry for a render. Loaded by render.html. Boots the player and exposes the globals the
 * Node driver calls over the DevTools protocol.
 */

import { fps, segmentLoaders as segmentLoaderObject, timelineUrl, configUrl } from "/__vw/virtual.js";
import { Player } from "./player.ts";
import { applyMetaDefaults, buildTransitionLoaderMap, describeTimelineError, validateTimeline } from "./timeline.ts";
import type { SegmentLoaderMap } from "./timeline.ts";
import type { Config, Timeline } from "./types.ts";

const w = window as any;
w.__VW_RENDER_READY__ = false;
w.__VW_RENDER_ERROR__ = null;
w.__VW_SEGMENT_ADVANCES__ = {};

async function boot() {
	const segmentLoaders: SegmentLoaderMap = new Map(Object.entries(segmentLoaderObject as Record<string, any>));

	const timeline = ((await import(timelineUrl)) as { default: Timeline }).default;
	const config = ((await import(configUrl)) as { default: Config }).default;

	const transitionLoaders = buildTransitionLoaderMap(config);
	const finalTimeline = applyMetaDefaults(timeline, config);

	const result = validateTimeline(finalTimeline, segmentLoaders, transitionLoaders);
	if (!result.ok) {
		throw new Error(`Timeline validation failed:\n${result.errors.map(describeTimelineError).join("\n")}`);
	}

	// The driver needs each segment's own `advances` before it can build the frame schedule.
	const advancesMap: Record<string, number[]> = {};
	for (const entry of finalTimeline.segments) {
		const loader = segmentLoaders.get(entry.id);
		if (!loader) continue;
		const seg = (await loader()).default;
		if (seg && Array.isArray(seg.advances)) advancesMap[entry.id] = seg.advances;
	}
	w.__VW_SEGMENT_ADVANCES__ = advancesMap;

	const host = document.getElementById("player-host");
	if (!host) throw new Error("No #player-host element found");
	const player = new Player(host);
	await player.load(finalTimeline, segmentLoaders, transitionLoaders);
	await player.start();

	// Hand over from real to virtual time right now, in the same task as player.start(). Animations started
	// during boot are frozen at their real elapsed time, so waiting for the driver to notice we are ready
	// (a poll plus a round trip) would start the first segment a run-dependent amount of time late.
	w.__VW_ENGAGE_VIRTUAL_TIME__();

	w.__VW_RENDER_FPS__ = fps;
	w.__VW_RENDER_ADVANCE__ = async (isLast: boolean) => {
		try {
			return await player.renderAdvance(isLast);
		} catch (e) {
			w.__VW_RENDER_ERROR__ = e instanceof Error ? e.message : String(e);
			return false;
		}
	};
	w.__VW_RENDER_READY__ = true;
}

boot().catch((e) => {
	console.error("Render boot error:", e);
	w.__VW_RENDER_ERROR__ = e instanceof Error ? e.message : String(e);
	w.__VW_RENDER_READY__ = true; // still "ready" so the driver can read the error
});
