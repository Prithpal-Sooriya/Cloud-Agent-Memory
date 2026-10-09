---
name: explain-video
description: >-
  Makes a short technical explainer or PR walkthrough video with a local Kokoro voice.
  Reads PR diffs, triages changes, chooses depth (Overview, Standard, Deep dive) and
  script style (Natural default or Strict STE100), and uses Videowright (Motion
  Engineering style) by default, with Manim as an optional alternative for math and
  equations. Keeps on-screen spelling in `display` and speech in `spoken`, runs
  local pronunciation scripts, asks for remaining facts, then asks whether to keep
  the file local or add it to a pull request description, before any render.
---

# Explain as a short video

Do not install packages, write scene files, render, commit, push, or edit a pull request until the user approves the plan in [Approval](#approval).

## Ask first

`scenes.json` in the explainer folder is the only script. Each line has `display` (real on-screen spelling) and `spoken` (what the voice says). Write `spoken` already expanded: `onAfterChange` → "on after change", `API` → "A P I", `.ts` → "dot T S", `==` → "equals equals". `spoken` must not contain camelCase, snake_case, symbols, paths, digits glued to identifiers, or all-caps tokens.

Read [lexicon.json](lexicon.json). Its entries win over [scripts/speak_prep.py](scripts/speak_prep.py). A `phonemes` field is Misaki's own symbols, written `[term](/phonemes/)`, not IPA. Misaki drops symbols it does not know. `id`, `ID`, and an `Id` suffix are the abbreviation eye-dee: Misaki `ˌIˈdi`, which is `/ˌaɪˈdiː/` (`a` and `ː` are not Misaki symbols). Listen once with [scripts/audition.py](scripts/audition.py) before keeping an override. That audition is a one-time setup check, not part of every video.

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
6. Pronunciations are not a question. Ask only about a person's name. Do not ask how to say an identifier, acronym, or id.
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
- Spoken lines, written per [script-style.md](script-style.md) (explains why and what, names file and function, never reads code aloud). `spoken` is already expanded.
- Unknowns table from `python3 scripts/speak_prep.py <scenes.json>`. Correct a row in this yes if the spoken form is wrong. Do not paste a longer list than the report.
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
   - Prepare speech, if `scenes.json` changed since approval: `python3 scripts/speak_prep.py <scenes.json>`. Read only that report.
   - Synthesize with the venv Python: `~/.venvs/explain-video/bin/python scripts/synth.py <scenes.json> --out <explainer>`. It writes audio, `durations.json`, and `audio/tracks/v1/track.ts`.
   - Videowright's track field is `length_s`, and `timing.perSegment` values are cumulative advance times (for example `[3.425, 8.225]`). Copy each segment `voiceover` and those advances into `defineSegment`. Do not keep a second script.
   - Verify with `~/.venvs/explain-video/bin/python scripts/verify_audio.py <scenes.json> --out <explainer>`. Read only its report. Captions are the `display` text in `captions.json` from that same Whisper pass.
   - For each flagged token, run `verify_audio.py --repair` once. That tries one respelling or one Misaki phoneme override and re-checks only the flagged chunks. If it is still flagged, stop and name the token. After approval, append a fix that worked to [lexicon.json](lexicon.json). Do not loop.

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

1. Run [setup.sh](setup.sh) once to prepare `~/.venvs/explain-video` with Manim, Kokoro 82M, Misaki, and Whisper.
2. In the scene, use `VoiceoverScene` and pass `KokoroService` from [kokoro_service.py](kokoro_service.py) to `set_speech_service`:
   ```python
   from manim_voiceover import VoiceoverScene
   from kokoro_service import KokoroService

   class Explainer(VoiceoverScene):
       def construct(self):
           self.set_speech_service(KokoroService())  # af_heart, local, 24 kHz
   ```
3. For code or math diffs, follow snippet limits (max 10 lines) and triage from [triage.md](triage.md). `KokoroService` runs the same normalizer as `speak_prep.py`. Verify with `scripts/verify_audio.py`; captions use `display`.
4. Render a draft: `manim render -ql scene.py`.
5. Verification: Extract a frame from each scene with `ffmpeg`. Verify that no snippet or caption overlaps or is clipped, every named file or function matches the diff, and length is within the chosen depth. Fix issues and re-render once.

---

If the user corrects a spoken form, or `--repair` clears a token, add that term to [lexicon.json](lexicon.json) after approval. Do not add a row the normalizer already speaks.

## Cost

Read script reports only. Do not paste audio, a full transcript, or an uncut token list into context. Re-run flagged chunks, not the whole video. Do not call a subagent or another model for pronunciation.

## After the render

**Local.** Give the mp4 path. Stop.

**Pull request description.** Read the current body. Put the video in an existing Screenshots/Recordings section, or add a Video section. Do not delete existing text.

Add a one-line note under the video that says the walkthrough is AI-generated. A synthetic voice can feel uncanny when the reviewer does not expect it. Use this note, or a close variant:

> 🤖 AI-generated walkthrough — script, animation, and voice made by an agent

The description plays a video from a GitHub-hosted asset URL. Upload the video directly using the GitHub CLI:
```bash
gh pr edit <pr-num> --attach <video-path>
```

`--attach` needs `gh` 2.102+, a user token (`gho_` / `ghp_` / `github_pat_`) — a GitHub App token (`ghs_`) gets a 404 from the upload endpoint — and an mp4/mov/webm file under 100 MB. The upload appends an `https://github.com/user-attachments/assets/<id>` URL to the body.

If `--attach` succeeds, format the PR body to place the video URL under the `## Video Walkthrough` section with the AI disclosure note.

If `gh` does not support `--attach` (older than 2.102) or the upload fails, stop. Give the local path and ask the user to drop the file into the pull request description. When they send the attachment URL, add it with `gh pr edit`. Do not commit the mp4 to get a URL.

A description edit is not a commit. If any step needs a commit, stop and ask the user to sign it. Do not push an unsigned commit. Do not pass `--no-gpg-sign`.
