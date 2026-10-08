---
name: explain-video
description: >-
  Makes a short technical explainer video with a local Kokoro voice. Uses Videowright
  (Motion Engineering style) by default, with Manim as an optional alternative for
  math and equations. Asks for facts and pronunciations, then asks whether to keep
  the file local or add it to a pull request description, before any render.
---

# Explain as a short video

Do not install packages, write scene files, render, commit, push, or edit a pull request until the user approves the plan in [Approval](#approval).

## Ask first

Read [pronunciations.md](pronunciations.md) before asking. Ask only what is still unknown. One round of questions, then the plan.

1. Topic, who it is for, and the one thing they should understand at the end.
2. Facts that must be exact: names, numbers, paths, ticket ids. Do not invent these. If a fact is missing, ask. Do not guess.
3. How many ideas. One scene per idea. A short video is 4 to 6 scenes unless the user sets another count.
4. Engine selection:
   - **Videowright (default)** — HTML/TypeScript/WAAPI with the **Motion Engineering** design language (aerospace HUD, blueprint CAD, crisp systems diagrams, code terminals, telemetry).
   - **Manim (optional alternative)** — Python/Cairo for mathematical formulas, calculus, coordinate geometry, or LaTeX animations.
5. Pronunciations for words that are not already in [pronunciations.md](pronunciations.md): names, acronyms, symbols, and ticket ids. Ask for the spoken form. On-screen labels keep the real spelling. The voice uses the spoken form.
6. Where the finished file goes:
   - **Keep local.** Ask for a folder. Default `~/Videos/explainers/<topic-slug>/`. Do not `git add` the video.
   - **Pull request description.** Ask which pull request. Do not commit the mp4. Do not push.

## Approval

Show this and wait for a yes:

- Engine & Style: Videowright (Motion Engineering) [default] or Manim
- Scene list: one idea per scene, diagram only, no paragraph on screen
- Spoken lines, written with [ste100.md](ste100.md)
- Pronunciations you will add to [pronunciations.md](pronunciations.md)
- Destination: local path, or the pull request you will edit

## Production

After approval, follow these steps in this order. Do not skip or reorder them.

Always use the **local Kokoro 82M voice** (`af_heart`, 24 kHz). The voice runs on your machine. Do not use a cloud voice. Do not clone a person's voice.

### Option A: Videowright (Default)

Use Videowright for technical architecture, system flowcharts, software pipelines, and HUD-styled explainers.

1. **Project structure & Config:**
   In the explainer folder (e.g. `~/Videos/explainers/<topic-slug>/`):
   - Set `defaultStyle: 'motion-engineering'` in `videowright.config.ts`.
   - Create `timeline.ts` importing `styles/motion-engineering/tokens.css` and `styles/fonts.css`.
   - Organize segments under `segments/<segment-id>/index.ts`.

2. **Audio & Beat Timestamps:**
   - Synthesize the spoken lines using Kokoro-82M locally.
   - Measure timestamps for each spoken beat.
   - Configure the audio track in `audio/tracks/v1/track.ts` with `duration` and `perSegment` advance arrays (e.g. `[3.425, 8.225]`).

3. **Motion Engineering Visual Standards:**
   - **Canvas & Palette:** 1920×1080 canvas. Charcoal background (`var(--color-bg)`: `#0e141a`), 64px blueprint grid lines, slate borders (`#1e2a36`).
   - **Type:** Space Grotesk (display & body) and JetBrains Mono (telemetry, coordinates, code terminals). Sized for 1080p display (display titles 72–96px, subheadings 32–38px, body 24–28px, mono readouts 12–16px).
   - **HUD Elements:** Use corner brackets (ticks), reticle crosshairs, dimension lines with centered pixel callouts, and bottom telemetry bars.
   - **Layout Discipline:** Containers must fill 80–90% of the canvas. Keep generous padding and distinct modular cards to prevent text overlapping.

4. **Segment Authoring & Render-Safety Rules:**
   - Define segments with `defineSegment({ id, advances, voiceover, mount, play, unmount })`.
   - Use WAAPI (`element.animate(...)`) with `fill: "forwards"` and `cubic-bezier(0.2, 0.8, 0.2, 1)`.
   - **Never use `iterations: Infinity`** in WAAPI animations; looping animations freeze under headless Puppeteer rendering. Use finite durations matching the beat window.
   - Synchronize visual reveals with audio beats using `await ctx.waitForNext()`.
   - Ensure clean unmount: clear host references and cancel active timers.

5. **Render & Inspect:**
   - Render headless to MP4: `npx videowright render <timeline-path> --output <output-path>.mp4`.
   - Extract sample frames from each segment with `ffmpeg` and verify there are no overlapping labels or clipped elements.

---

### Option B: Manim (Alternative for Math/Geometry)

Use Manim when the user requests mathematical proofs, LaTeX equations, or coordinate geometry.

1. Run [setup.sh](setup.sh) once to prepare `~/.venvs/explain-video` with Manim and Kokoro 82M.
2. In the scene, use `VoiceoverScene` and pass `KokoroService` from [kokoro_service.py](kokoro_service.py) to `set_speech_service`:
   ```python
   from manim_voiceover import VoiceoverScene
   from kokoro_service import KokoroService

   class Explainer(VoiceoverScene):
       def construct(self):
           self.set_speech_service(KokoroService())  # af_heart, local, 24 kHz
   ```
3. Render a draft: `manim render -ql scene.py`.
4. Inspect one frame from each scene. Fix any overlap or clipped labels. Re-render once.

---

Append each approved pronunciation to [pronunciations.md](pronunciations.md).

## After the render

**Local.** Give the mp4 path. Stop.

**Pull request description.** Read the current body. Put the video in an existing Screenshots/Recordings section, or add a Video section. Do not delete existing text.

Add a one-line note under the video that says the walkthrough is AI-generated. A synthetic voice can feel uncanny when the reviewer does not expect it. Use this note, or a close variant:

> 🤖 AI-generated walkthrough — script, animation, and voice made by an agent

The description can play a video only from a GitHub-hosted URL. Do not invent that URL. Do not commit the mp4 to get one. If you cannot upload the file from the shell, stop. Give the local path and ask the user to drop the file into the pull request description. When they send the attachment URL, add it with `gh pr edit`.

A description edit is not a commit. If any step needs a commit, stop and ask the user to sign it. Do not push an unsigned commit. Do not pass `--no-gpg-sign`.
