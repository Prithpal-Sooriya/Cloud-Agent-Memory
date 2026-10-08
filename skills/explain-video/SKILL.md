---
name: explain-video
description: >-
  Makes a short technical explainer or PR walkthrough video with a local Kokoro voice.
  Reads PR diffs, triages changes, chooses depth (Overview, Standard, Deep dive) and
  script style (Natural default or Strict STE100), and uses Videowright (Motion
  Engineering style) by default, with Manim as an optional alternative for math and
  equations. Asks for facts and pronunciations, then asks whether to keep the file local
  or add it to a pull request description, before any render.
---

# Explain as a short video

Do not install packages, write scene files, render, commit, push, or edit a pull request until the user approves the plan in [Approval](#approval).

## Ask first

Read [pronunciations.md](pronunciations.md) before asking.

For pull request walkthroughs, read the PR first:
- Run `gh pr view <n> --json title,body,commits,files` and `gh pr diff <n>`.
- Filter out noisy and generated files: lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `bun.lock`), changelogs, snapshots, API reports (`**/api-report.md`, `**/*.api.json`), generated reference docs, and anything marked `DO NOT EDIT`.
- Note the problem, approach, and key mechanisms. Ask only about what the PR cannot tell you, such as the audience or exact business facts.

Ask only what is still unknown. One round of questions, then the plan:

1. Topic, who it is for, and the one thing they should understand at the end (for PRs, infer topic and mechanisms from the diff; ask who the audience is if unknown).
2. Facts that must be exact: names, numbers, paths, ticket ids. Do not invent these. If a fact is missing, ask. Do not guess.
3. Depth choice (default inferred from PR size; scene count and length follow depth rather than a fixed count):
   - **Overview:** diagrams only, no code, ~60–90 seconds, 3–5 scenes. For a high-level picture.
   - **Standard (default):** diagrams plus 2–4 short code snippets, ~2–3 minutes.
   - **Deep dive:** annotated diffs, ~4–5 minutes, 8–10 scenes. Only when asked.
4. Script style: **Natural (default)** or **Strict STE100** (see [script-style.md](script-style.md)).
5. Engine selection:
   - **Videowright (default)** — HTML/TypeScript/WAAPI with the **Motion Engineering** design language (aerospace HUD, blueprint CAD, crisp systems diagrams, code terminals, telemetry).
   - **Manim (optional alternative)** — Python/Cairo for mathematical formulas, calculus, coordinate geometry, or LaTeX animations.
6. Pronunciations for words that are not already in [pronunciations.md](pronunciations.md): names, acronyms, symbols, and ticket ids. Ask for the spoken form. On-screen labels keep the real spelling. The voice uses the spoken form.
7. Where the finished file goes:
   - **Keep local.** Ask for a folder. Default `~/Videos/explainers/<topic-slug>/`. Do not `git add` the video.
   - **Pull request description.** Ask which pull request. Do not commit the mp4. Do not push.

## Approval

Before writing the plan, run importance triage per [triage.md](triage.md) to rank each change into **Covered**, **Mentioned**, or **Skipped**. Group many similar changes into one scene instead of one scene each. Order scenes to build understanding (define types before usage), not by file order.

Show this and wait for a yes:

- Engine & Style: Videowright (Motion Engineering) [default] or Manim
- Depth & estimated length (e.g. Standard, ~2–3 minutes)
- Script style: Natural (default) or Strict STE100
- Triage table (user can correct before anything renders):
  - **Covered:** scene number, file, function, and snippet excerpt
  - **Mentioned in one line:** changes collapsed into one spoken line (e.g. "the rest is renames and test updates")
  - **Skipped:** files omitted and why (e.g. lockfiles, generated docs)
- On-screen snippets: exact code hunks and source files (max 10 lines per snippet, ~4 snippets in Standard; Overview shows no code)
- Scene list: one idea per scene, diagrams and code snippets only, no paragraphs on screen
- Spoken lines, written per [script-style.md](script-style.md) (explains why and what, names file and function, never reads code aloud)
- Pronunciations you will add to [pronunciations.md](pronunciations.md)
- Destination: local path, or the pull request you will edit

## Production

After approval, follow these steps in this order. Do not skip or reorder them.

Always use the **local Kokoro 82M voice** (`af_heart`, 24 kHz). The voice runs on your machine. Do not use a cloud voice. Do not clone a person's voice.

### Option A: Videowright (Default)

Use Videowright for technical architecture, system flowcharts, software pipelines, HUD-styled explainers, and code walkthroughs.

1. **Project structure & Config:**
   In the explainer folder (e.g. `~/Videos/explainers/<topic-slug>/`):
   - Set `defaultStyle: 'motion-engineering'` in `videowright.config.ts`.
   - Create `timeline.ts` importing `styles/motion-engineering/tokens.css` and `styles/fonts.css`.
   - Organize segments under `segments/<segment-id>/index.ts`.

2. **Audio, Beat Timestamps & Captions:**
   - Synthesize the spoken lines using Kokoro-82M locally.
   - Measure timestamps for each spoken beat.
   - Configure the audio track in `audio/tracks/v1/track.ts` with `duration` and `perSegment` advance arrays (e.g. `[3.425, 8.225]`).
   - Generate captions using local Whisper word-level timings, grouped into 5–7 word chunks and broken on pauses (>450 ms).
   - Apply a substitution table so code names and symbols appear with real on-screen spelling (e.g. `onAfterChange`, not `on after change`).

3. **Motion Engineering Visual Standards & Code Scenes:**
   - **Canvas & Palette:** 1920×1080 canvas. Charcoal background (`var(--color-bg)`: `#0e141a`), 64px blueprint grid lines, slate borders (`#1e2a36`).
   - **Type:** Space Grotesk (display & body) and JetBrains Mono (telemetry, coordinates, code terminals). Sized for 1080p display (display titles 72–96px, subheadings 32–38px, body 24–28px, mono readouts 12–16px).
   - **HUD Elements:** Use corner brackets (ticks), reticle crosshairs, dimension lines with centered pixel callouts, and bottom telemetry bars.
   - **Layout Discipline:** Containers must fill 80–90% of the canvas. Keep generous padding and distinct modular cards to prevent text overlapping.
   - **Code Scenes (Standard & Deep dive):**
     - Show a real diff hunk or code excerpt only when narration is about that code.
     - Maximum 10 lines per snippet and about 4 snippets per video in Standard. Trim the hunk to relevant lines and highlight changed lines.
     - The narration explains why the change was made and what it does. It never reads code aloud, but names the file and function.
     - Overview mode shows no code at all.

4. **Segment Authoring & Render-Safety Rules:**
   - Define segments with `defineSegment({ id, advances, voiceover, mount, play, unmount })`.
   - Use WAAPI (`element.animate(...)`) with `fill: "forwards"` and `cubic-bezier(0.2, 0.8, 0.2, 1)`.
   - **Never use `iterations: Infinity`** in WAAPI animations; looping animations freeze under headless Puppeteer rendering. Use finite durations matching the beat window.
   - Synchronize visual reveals with audio beats using `await ctx.waitForNext()`.
   - Ensure clean unmount: clear host references and cancel active timers.

5. **Render & Verification:**
   - Render headless to MP4: `npx videowright render <timeline-path> --output <output-path>.mp4`.
   - Extract a frame from each scene with `ffmpeg`.
   - Verify that:
     - No snippet, caption, or label overlaps or is clipped.
     - Every file or function named in the narration matches the diff.
     - Total duration is within the target range for the chosen depth.
   - Fix layout clipping or discrepancies and re-render once.

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
3. For code or math diffs, follow snippet limits (max 10 lines) and triage from [triage.md](triage.md). Generate Whisper captions with real-spelling substitutions.
4. Render a draft: `manim render -ql scene.py`.
5. Verification: Extract a frame from each scene with `ffmpeg`. Verify that no snippet or caption overlaps or is clipped, every named file or function matches the diff, and length is within the chosen depth. Fix issues and re-render once.

---

Append each approved pronunciation to [pronunciations.md](pronunciations.md).

## After the render

**Local.** Give the mp4 path. Stop.

**Pull request description.** Read the current body. Put the video in an existing Screenshots/Recordings section, or add a Video section. Do not delete existing text.

Add a one-line note under the video that says the walkthrough is AI-generated. A synthetic voice can feel uncanny when the reviewer does not expect it. Use this note, or a close variant:

> 🤖 AI-generated walkthrough — script, animation, and voice made by an agent

The description plays a video from a GitHub-hosted asset URL. Upload the video directly using the GitHub CLI:
```bash
gh pr edit <pr-num> --attach <video-path>
```
If `--attach` succeeds, format the PR body to place the video URL under the `## Video Walkthrough` section with the AI disclosure note.

If `gh` does not support `--attach` (older than v2.99.0) or the upload fails, stop. Give the local path and ask the user to drop the file into the pull request description. When they send the attachment URL, add it with `gh pr edit`. Do not commit the mp4 to get a URL.

A description edit is not a commit. If any step needs a commit, stop and ask the user to sign it. Do not push an unsigned commit. Do not pass `--no-gpg-sign`.
