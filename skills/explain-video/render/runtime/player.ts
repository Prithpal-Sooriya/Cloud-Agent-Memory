/**
 * Render-only player: two slots, segment lifecycle, transitions. Browser-side.
 * Derived from videowright 0.1.1 (MIT), see ../UPSTREAM.md. The interactive player (HUD, keyboard,
 * hash routing, audio playback) is intentionally not included.
 */

import { SegmentRunner } from "./segment.ts";
import type { SegmentLoaderMap, TransitionLoaderMap } from "./timeline.ts";
import type { Timeline, TimelineEntry, Transition } from "./types.ts";

type PlayerState = "idle" | "loading" | "playing" | "transitioning" | "ended" | "errored";

interface SlotEntry {
	el: HTMLDivElement;
	runner: SegmentRunner | null;
	timelineIndex: number;
}

const SLOT_STYLES = "position:absolute;inset:0;overflow:hidden;";
const CONTENT_STYLES = "width:100%;height:100%;position:relative;";

function createSlot(label: string): HTMLDivElement {
	const el = document.createElement("div");
	el.className = "vw-slot";
	el.dataset.slot = label;
	el.setAttribute("style", SLOT_STYLES);
	const content = document.createElement("div");
	content.className = "vw-slot-content";
	content.setAttribute("style", CONTENT_STYLES);
	el.appendChild(content);
	return el;
}

function getSlotContent(slot: HTMLDivElement): HTMLDivElement {
	return slot.querySelector(".vw-slot-content") as HTMLDivElement;
}

/** Transitions use fill:"forwards"; cancel before reusing a slot so stale transforms do not linger. */
function clearSlotAnimations(slot: HTMLDivElement): void {
	if (typeof slot.getAnimations !== "function") return;
	for (const anim of slot.getAnimations()) anim.cancel();
}

export class Player {
	private state: PlayerState = "idle";
	private timeline: Timeline | null = null;
	private segmentLoaders: SegmentLoaderMap | null = null;
	private transitionLoaders: TransitionLoaderMap | null = null;
	private slotA: SlotEntry;
	private slotB: SlotEntry;
	private currentSlot: "a" | "b" = "a";
	private started = false;
	private transitioning = false;

	constructor(host: HTMLElement) {
		const wrapper = document.createElement("div");
		wrapper.className = "vw-host";
		wrapper.setAttribute("style", "position:relative;width:100%;height:100%;overflow:hidden;");
		const slotElA = createSlot("a");
		const slotElB = createSlot("b");
		slotElB.style.visibility = "hidden";
		this.slotA = { el: slotElA, runner: null, timelineIndex: -1 };
		this.slotB = { el: slotElB, runner: null, timelineIndex: -1 };
		wrapper.appendChild(slotElA);
		wrapper.appendChild(slotElB);
		host.appendChild(wrapper);
	}

	async load(
		timeline: Timeline,
		segmentLoaders: SegmentLoaderMap,
		transitionLoaders: TransitionLoaderMap,
	): Promise<void> {
		this.state = "loading";
		this.timeline = timeline;
		this.segmentLoaders = segmentLoaders;
		this.transitionLoaders = transitionLoaders;
		for (const entry of timeline.segments) {
			if (!segmentLoaders.has(entry.id)) {
				const err = new Error(`Timeline "${timeline.meta.title}" references unknown segment "${entry.id}"`);
				err.name = "TimelineError";
				this.fail(entry.id, err);
				throw err;
			}
		}
	}

	async start(): Promise<void> {
		if (this.started) return;
		this.started = true;
		if (!this.timeline || !this.segmentLoaders) throw new Error("Player: call load() before start()");
		try {
			await this.mountSegmentAt(0);
			this.state = "playing";
			this.broadcastState();
		} catch (e) {
			this.fail(this.timeline.segments[0]?.id ?? "unknown", e);
		}
	}

	/**
	 * Fire one scheduled beat. Not-last beats resolve a pending waitForNext(); the last beat starts the
	 * transition to the next segment WITHOUT awaiting it (WAAPI transitions only finish when the driver
	 * advances the virtual clock, so awaiting here would deadlock). Returns false when the timeline ended.
	 */
	async renderAdvance(isLast: boolean): Promise<boolean> {
		if (this.state === "ended" || this.state === "errored") return false;
		const slot = this.getCurrentSlot();
		if (!slot.runner) return false;

		const drained = slot.runner.triggerNext();
		if (!isLast) {
			if (!drained) {
				// The driver prints these at the end: the segment's advances[] has more beats than it has
				// waitForNext() calls, so the visual change the author expected at this time did not happen.
				const segId = this.timeline?.segments[slot.timelineIndex]?.id ?? "unknown";
				const w = window as any;
				(w.__VW_WARNINGS__ ??= []).push(`segment "${segId}": a scheduled beat had no pending waitForNext() (advances has more entries than waitForNext() calls)`);
			}
			return true;
		}

		const nextIndex = slot.timelineIndex + 1;
		if (!this.timeline || nextIndex >= this.timeline.segments.length) {
			this.state = "ended";
			this.broadcastState();
			return false;
		}
		this.transitionTo(nextIndex).catch((e) => {
			this.fail(this.timeline?.segments[nextIndex]?.id ?? "unknown", e);
		});
		return true;
	}

	private async mountSegmentAt(index: number): Promise<void> {
		if (!this.timeline || !this.segmentLoaders) return;
		const entry = this.timeline.segments[index];
		const loader = this.segmentLoaders.get(entry.id);
		if (!loader) throw new Error(`No loader for segment "${entry.id}"`);
		const segment = (await loader()).default;

		const runner = new SegmentRunner(segment);
		const slot = this.getCurrentSlot();
		slot.runner = runner;
		slot.timelineIndex = index;
		const content = getSlotContent(slot.el);
		content.innerHTML = "";
		slot.el.style.visibility = "visible";
		await runner.mount(content);
		runner.startPlay().catch((e) => this.fail(entry.id, e));
	}

	private async resolveTransition(entry: TimelineEntry): Promise<Transition | null> {
		if (!this.transitionLoaders) return null;
		const cutLoader = this.transitionLoaders.get("cut");
		const fallback = async () => (cutLoader ? (await cutLoader()).default : null);
		if (!entry.transition) return fallback();
		const name = typeof entry.transition === "string" ? entry.transition : entry.transition.type;
		const loader = this.transitionLoaders.get(name);
		if (!loader) {
			console.warn(`Transition "${name}" not found, falling back to cut`);
			return fallback();
		}
		return (await loader()).default;
	}

	private getTransitionDuration(entry: TimelineEntry): number | undefined {
		if (!entry.transition || typeof entry.transition === "string") return undefined;
		return typeof entry.transition.duration === "number" ? entry.transition.duration : undefined;
	}

	private async transitionTo(targetIndex: number): Promise<void> {
		if (!this.timeline || !this.segmentLoaders || this.transitioning) return;
		this.transitioning = true;
		this.state = "transitioning";
		this.broadcastState();

		const outgoingSlot = this.getCurrentSlot();
		const incomingSlot = this.getOtherSlot();
		const entry = this.timeline.segments[targetIndex];

		// Same segment module twice in a row: unmount the outgoing first, or its unmount() would
		// clobber module-level state (e.g. `host = el`) that the incoming mount() just set.
		const outgoingEntryId = this.timeline.segments[outgoingSlot.timelineIndex]?.id;
		const isSameSegment = outgoingSlot.runner != null && outgoingEntryId === entry.id;

		try {
			const loader = this.segmentLoaders.get(entry.id);
			if (!loader) throw new Error(`No loader for segment "${entry.id}"`);
			const segment = (await loader()).default;
			const outgoingRunner = outgoingSlot.runner;

			if (isSameSegment && outgoingRunner) {
				outgoingRunner.unmount();
				outgoingSlot.runner = null;
				if (outgoingRunner.playPromise) await outgoingRunner.playPromise;
			}

			const runner = new SegmentRunner(segment);
			incomingSlot.runner = runner;
			incomingSlot.timelineIndex = targetIndex;
			clearSlotAnimations(incomingSlot.el);
			const incomingContent = getSlotContent(incomingSlot.el);
			incomingContent.innerHTML = "";
			incomingSlot.el.style.visibility = "visible";
			await runner.mount(incomingContent);
			const incomingPlayPromise = runner.startPlay();

			// Different segments: unmount the outgoing AFTER mounting the incoming (dual-slot crossfade order).
			if (!isSameSegment && outgoingRunner) {
				outgoingRunner.unmount();
				outgoingSlot.runner = null;
				if (outgoingRunner.playPromise) await outgoingRunner.playPromise;
			}

			if (!isSameSegment) {
				const transitionFn = await this.resolveTransition(entry);
				if (transitionFn && outgoingRunner) {
					await transitionFn(outgoingSlot.el, incomingSlot.el, {
						direction: "forward",
						duration: this.getTransitionDuration(entry),
					});
				}
			}

			clearSlotAnimations(outgoingSlot.el);
			clearSlotAnimations(incomingSlot.el);
			outgoingSlot.el.style.visibility = "hidden";
			getSlotContent(outgoingSlot.el).innerHTML = "";

			this.currentSlot = this.currentSlot === "a" ? "b" : "a";
			this.state = "playing";
			this.transitioning = false;
			this.broadcastState();

			incomingPlayPromise.catch((e) => this.fail(entry.id, e));
		} catch (e) {
			this.transitioning = false;
			this.fail(entry.id, e);
		}
	}

	/**
	 * A segment threw. Upstream only logs this; here it also sets window.__VW_RENDER_ERROR__ so the
	 * driver stops at the next beat instead of rendering a broken video to the end.
	 */
	private fail(segmentId: string, e: unknown): void {
		const error = e instanceof Error ? e : new Error(String(e));
		console.error(`Player: segment "${segmentId}" errored:`, error);
		this.state = "errored";
		this.transitioning = false;
		(window as any).__VW_RENDER_ERROR__ = `segment "${segmentId}": ${error.message}`;
		this.broadcastState();
	}

	/** The driver reads document.body.dataset.vwSegment to check beats and transitions line up. */
	private broadcastState(): void {
		try {
			if (document.body) {
				document.body.dataset.vwState = this.state;
				document.body.dataset.vwSegment = this.getCurrentSlot().runner?.segment.id ?? "";
			}
		} catch {
			// ignore
		}
	}

	private getCurrentSlot(): SlotEntry {
		return this.currentSlot === "a" ? this.slotA : this.slotB;
	}

	private getOtherSlot(): SlotEntry {
		return this.currentSlot === "a" ? this.slotB : this.slotA;
	}
}
