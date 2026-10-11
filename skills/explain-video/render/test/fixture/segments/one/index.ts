import { defineSegment } from "videowright";
import { label } from "../label";

let host: HTMLElement | null = null;

export default defineSegment({
	id: "one",
	advances: [1, 2],
	mount(el) {
		host = el;
		el.innerHTML = `<div id="box" style="width:100%;height:100%;background:#fa4b00;color:#000;font-size:40px">${label("one")}</div>`;
	},
	async play(ctx) {
		host?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: "forwards" });
		await ctx.waitForNext();
		await ctx.hold(500);
	},
	unmount() {
		host = null;
	},
});
