/** Built-in transitions. Derived from videowright 0.1.1 (MIT), see ../UPSTREAM.md. */

import type { Transition, TransitionContext } from "./types.ts";

/** Instantaneous: hide outgoing, show incoming. */
export const cut: Transition = async (outgoing, incoming) => {
	outgoing.style.visibility = "hidden";
	incoming.style.visibility = "visible";
};

/** Crossfade over `ctx.duration` ms (default 400). */
export const fade: Transition = async (outgoing, incoming, ctx) => {
	const duration = ctx.duration ?? 400;
	const outAnim = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration, fill: "forwards" });
	const inAnim = incoming.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: "forwards" });
	await Promise.all([outAnim.finished, inAnim.finished]);
};

type SlideDirection = "left" | "right" | "up" | "down";

const OPPOSITE: Record<SlideDirection, SlideDirection> = {
	left: "right",
	right: "left",
	up: "down",
	down: "up",
};

function translateValue(dir: SlideDirection): string {
	switch (dir) {
		case "left":
			return "-100%,0";
		case "right":
			return "100%,0";
		case "up":
			return "0,-100%";
		case "down":
			return "0,100%";
	}
}

function createSlide(slideDir: SlideDirection): Transition {
	return async (outgoing: HTMLElement, incoming: HTMLElement, ctx: TransitionContext) => {
		const effectiveDir = ctx.direction === "backward" ? OPPOSITE[slideDir] : slideDir;
		const duration = ctx.duration ?? 500;
		const outTarget = translateValue(effectiveDir);
		const inSource = translateValue(OPPOSITE[effectiveDir]);
		const outAnim = outgoing.animate(
			[{ transform: "translate(0,0)" }, { transform: `translate(${outTarget})` }],
			{ duration, fill: "forwards" },
		);
		const inAnim = incoming.animate(
			[{ transform: `translate(${inSource})` }, { transform: "translate(0,0)" }],
			{ duration, fill: "forwards" },
		);
		await Promise.all([outAnim.finished, inAnim.finished]);
	};
}

export const slideLeft = createSlide("left");
export const slideRight = createSlide("right");
export const slideUp = createSlide("up");
export const slideDown = createSlide("down");
