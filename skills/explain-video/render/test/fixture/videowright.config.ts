import { defineConfig } from "videowright";

export default defineConfig({
	projectStructure: "v1",
	defaults: { resolution: [320, 180], fps: 10, aspectRatio: "16:9" },
});
