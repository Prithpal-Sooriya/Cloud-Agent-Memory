import { defineSegment } from "videowright";

export default defineSegment({
	id: "two",
	advances: [1],
	mount(el) {
		el.innerHTML = `<div style="width:100%;height:100%;background:#8b99ff"></div>`;
	},
	async play(ctx) {
		await ctx.hold(1000);
	},
});
