# render: the bundled video renderer

Renders a Videowright-style project (segments written as TypeScript that drive the DOM with Web Animations) to an MP4 by stepping a virtual clock one frame at a time, screenshotting Chrome, and piping the frames to ffmpeg. For agents only. Derived from [videowright](https://github.com/scosman/videowright) 0.1.1 (MIT), cut down to rendering: see [UPSTREAM.md](UPSTREAM.md) for what was kept, changed, and verified.

This folder is a vendored copy of the standalone repo <https://github.com/Prithpal-Sooriya/tiny-video-renderer>, which has the same files at its root plus a runnable example. Fix bugs in one place and copy the change to the other: the renderer files (`*.ts`, `runtime/`, `test/`) are identical.

**No npm.** There is no `package.json`, no install, and no `node_modules`. It uses Node's built-ins, a Chrome you already have, and ffmpeg.

## Requirements

- Node with built-in TypeScript type stripping, `module.stripTypeScriptTypes` and a global `WebSocket`: 22.18 or newer should work. Verified on 24.21 only.
- Chrome or Chromium. Found automatically: `--chrome`, `$CHROME_BIN`, Playwright's cached `chrome-headless-shell`, then system Chrome. Chrome's sandbox stays on; if it cannot start (inside another sandbox or a container) the renderer retries without it and says so. `--no-sandbox` skips the first attempt.
- ffmpeg on `PATH`.

## Run

```bash
node render/vw.ts render <timeline.ts> [--output out.mp4] [--fps N] [--width N] [--height N]
                         [--audio-track none] [--chrome PATH] [--no-sandbox] [--dry-run] [--verbose]
```

- Run `--dry-run` first. It boots the page, loads every segment, validates the timeline and advances, prints the frame count, and exits in about a second.
- For layout checks render at low fps (`--fps 6`), look at frames, then render the final at full fps. Throughput is about 15 frames per second at 1080p on a laptop, so a five-minute 1080p30 video takes about 10 minutes and the same video at 60 fps about 20.
- Exit code 0 on success. On failure it prints `Error: <message>` and usually `Hint: <what to do>`, with no stack trace, and exits 1. A segment that throws during `play()` fails the render at once with the segment id and message.
- `Warning:` lines on stderr are real. The common one is `a scheduled beat had no pending waitForNext()`: the segment's `advances` has more entries than it has `waitForNext()` calls, so a visual change you expected at that time did not happen.

## Project layout it expects

```
<project>/                       the folder holding videowright.config.ts (searched upward from the timeline)
  videowright.config.ts          export default defineConfig({ projectStructure: "v1", defaults: { resolution: [1920,1080], fps: 60 } })
  timeline.ts                    export default { meta: { title }, segments: [{ id: "a" }, { id: "b", transition: "fade" }], default_audio_track }
  segments/<id>/index.ts         export default defineSegment({ id, advances, mount, play, unmount })
  segments/*.ts, styles/, audio/ anything else, imported relatively
```

`import { defineSegment, defineConfig, fade } from "videowright"` resolves to the bundled [runtime](runtime/index.ts) in Node and in the browser. Types: `import type { Timeline, Config, Segment } from "videowright"`.

## Writing segments

- **Erasable TypeScript only.** Node strips types, it does not compile. Do not use `enum`, `namespace`, class parameter properties (`constructor(private x)`), decorators, or `import x = require()`. Use `import type` for types. A violation fails with `[serve] <file>: ... is not supported in strip-only mode`.
- **Imports are relative, or `"videowright"`.** There is no bundler and no node_modules, so a bare package import fails. Extensionless (`"../shared"`) and `.js`-for-`.ts` (`"./track.js"`) imports work. CSS imports (`import "./tokens.css"`) are injected as a `<style>` tag. Images, fonts and audio are served as files from the project.
- **Animate with the Web Animations API** (`el.animate(keyframes, { duration, fill: "forwards" })`) and `ctx.hold(ms)`. Both run on the virtual clock. Never use `iterations: Infinity`, CSS `animation`/`transition`, or wall-clock time (`Date.now()` is virtualized, but real network or timers are not).
- **`advances`** are segment-relative seconds, positive and strictly increasing. The last value is the segment's total length; every earlier value releases one `await ctx.waitForNext()`. So `advances: [3, 8]` pairs with one `waitForNext()`.
- `ctx` has `waitForNext()`, `hold(ms)`, `signal` (aborted on unmount), `clock()` and `mode` (always `"render"`).
- Transitions on a timeline entry: `"cut"` (default), `"fade"`, `"slideLeft"`, `"slideRight"`, `"slideUp"`, `"slideDown"`, or `{ type: "fade", duration: 600 }`; more can be registered in `config.transitions`.
- Audio comes from `timeline.default_audio_track` (`{ audio_file, length_s, timing }`, path relative to `timeline.ts`). Its `timing.perSegment` overrides each segment's `advances`. `--audio-track none` renders silent video.

## Safety model

The renderer serves one project folder on `127.0.0.1` on a random port, only for the length of the render. Requests must carry a loopback `Host`, `..` cannot climb out of the project, and only the project's files and this folder's `runtime/` are served. Chrome runs headless with a throwaway profile deleted afterwards. A render needs no network: it has been run with all outbound traffic blocked and produced identical frames.

## Tests

```bash
node --test test/render.test.ts
```

Unit tests cover timing, the Node loader and the server's path rules. Integration tests render a tiny fixture project and are skipped when Chrome or ffmpeg is missing.
