# Lineage and verification

This folder is a vendored copy of <https://github.com/Prithpal-Sooriya/tiny-video-renderer> (same renderer files, plus an example and a README written for general use). It is a cut-down renderer derived from **videowright 0.1.1**, <https://github.com/scosman/videowright>, MIT licensed (copy in `LICENSE.videowright`). Based on repository commit `b2edc7d` (the commit 79 seconds before the npm publish; the published tarball's `dist/` rebuilds byte-for-byte from it).

## What came from where

| Here | From upstream | Status |
|---|---|---|
| `time_shim.ts` | `src/cli/time_shim.ts` | **Verbatim.** Virtualizes `Date`, `performance.now`, timers, `requestAnimationFrame` and WAAPI so frames are deterministic. |
| `runtime/segment.ts`, `runtime/transitions.ts`, `runtime/types.ts` | `src/segment/*`, `src/player/transitions/*`, `src/types.ts` | Same logic; trimmed (no interactive mode, no voiceover types). |
| `runtime/timeline.ts` | `src/timeline/*`, `buildFrameSchedule` from `src/cli/render.ts` | Same logic, fused into one browser-safe file. |
| `runtime/player.ts` | `src/player/index.ts` | **Render-only rewrite** of the player: two slots, segment lifecycle, transitions. No HUD, keyboard, hash routing or audio playback. |
| `render.ts`, `ffmpeg.ts` | `src/cli/render.ts`, `src/cli/ffmpeg.ts` | Same capture loop and ffmpeg arguments; Playwright and Vite replaced. |
| `cdp.ts` | (new) | ~120 lines of DevTools client on Node's global `WebSocket`, replacing Playwright. The Chrome switch list and per-platform font-family tables are copied from Playwright 1.63 (Apache-2.0, Copyright Microsoft Corporation) so pixels match. |
| `serve.ts`, `loader.ts` | (new) | Replace Vite (type stripping per request, import map, CSS wrapper) and tsx (Node resolve hook). |
| `../styles/motion-engineering/` | `skill/assets/styles/motion-engineering/` | STYLE, brand and tokens verbatim; `fonts.css` is new (self-hosted Space Grotesk and JetBrains Mono, SIL OFL). |

Dropped: the dev server and player UI, the homepage, the download modal, `script`, `create-videowright`, slug discovery and prompts, voiceover loading, `--audio-track <id>`, the agent skill docs, and all dependencies (`vite`, `tsx`, `playwright`).

## Deliberate behavior differences

1. **A segment that throws in `play()` fails the render** immediately with its id and message. Upstream logs it and keeps rendering.
2. **Virtual time is engaged by the page** in the same task as `player.start()`, not by the driver after polling. Upstream's driver does it within a few milliseconds; ours cannot race, and renders are deterministic.
3. **Surplus beats are reported** (`Warning: ... no pending waitForNext()`). Upstream writes a `console.debug` nobody sees.
4. Source errors are explained: a file Node cannot strip prints the reason, not just "failed to fetch module".

## Verified

Each project below was rendered with upstream (`videowright` 0.1.1 + Playwright 1.63) and with this renderer, using the same Chrome binary, then compared frame by frame and on the decoded audio.

| Project | Frames compared | Result |
|---|---|---|
| MetaMask theme test (fade transitions, fox) | 266 | bit-identical video and audio |
| MetaMask Developer, design-tokens (code blocks, clip-path reveal) | 321 | bit-identical |
| MetaMask, Geist to Inter (diff blocks, fox assemble) | 321 | bit-identical |
| Deep dive (331 s, 10 scenes, 9 fades) | 663 | bit-identical |
| GitHub Lite (Motion Engineering, older layout) | 565 | 564 identical; frame 501, a fade boundary, differs in 46 pixels by at most 3 levels out of 255 (92 dB) |

Both renderers are deterministic against themselves (two runs bit-identical). A real render also completes, bit-identical, with all outbound network blocked.

Three things made the difference between "close" and "bit-identical", worth knowing if this is ever changed: use Playwright's `Page.setFontFamilies` table (generic `monospace`/`sans-serif` change fallback glyphs), engage virtual time inside the page, and flush layout and await `document.fonts.ready` before each screenshot.

## Re-verifying

Render a project both ways at low fps, then compare:

```bash
npx videowright render timeline.ts --fps 4 --output up.mp4        # needs videowright + playwright in the project
node render/vw.ts render timeline.ts --fps 4 --output dist.mp4
ffmpeg -i up.mp4 -i dist.mp4 -lavfi "[0:v][1:v]psnr=stats_file=psnr.log" -f null -   # "inf" on every line = identical
```

## Known limits

macOS and Linux font tables are present; Windows is untested. Chrome versions can differ by a few pixels, so compare renders using the same browser. Anything upstream adds after 0.1.1 is not picked up; re-derive from a new tag and re-run the gate above.
