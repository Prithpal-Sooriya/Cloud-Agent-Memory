import "./theme.css";
import type { Timeline } from "videowright";

const timeline: Timeline = {
	meta: { title: "Fixture" },
	segments: [{ id: "one" }, { id: "two", transition: "fade" }],
};

export default timeline;
