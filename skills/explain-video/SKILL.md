---
name: explain-video
description: >-
  Turns a PR, branch, technical doc, ADR, PRD, strategy doc, or a Jira, Confluence, or
  Google Doc into a short narrated explainer video with a local Kokoro voice. Infers the
  content profile from the source (code-change, technical-doc, product-doc), then picks
  depth (Overview, Standard, Deep dive), script style (Natural default or Strict STE100),
  and theme (Motion Engineering, MetaMask, or MetaMask Developer) on Videowright, with
  Manim as an optional alternative for math. Traces every on-screen number, date, and
  name to the source in a facts ledger and checks it, keeps on-screen spelling in
  `display` and speech in `spoken`, runs local pronunciation scripts, asks for missing
  facts, shows the plan for approval, and keeps the file local until the user names a
  destination. For engineers, PMs, EMs, designers, and leaders.
---

# Explain as a short video

Do not install packages, write scene files, render, commit, push, upload, or edit a pull request until the user approves the plan in [Approval](#approval).

## How this skill is organized

`SKILL.md` is the router and the shared pipeline. What changes with the *kind of source* lives in a profile:

| Profile | For | Read |
|---|---|---|
| **code-change** | PR, branch, diff, code | [profiles/code-change.md](profiles/code-change.md) |
| **technical-doc** | ADR, RFC, design doc, API/SDK docs, runbook, postmortem | [profiles/technical-doc.md](profiles/technical-doc.md) |
| **product-doc** | PRD, strategy, roadmap, readout, brief, Jira epic, Google Doc | [profiles/product-doc.md](profiles/product-doc.md) |

Shared by all: [facts.md](facts.md) (nothing is invented), [script-style.md](script-style.md), [lexicon.json](lexicon.json), the themes under [styles/](styles/), and the production steps below. Depth (Overview / Standard / Deep dive) is a separate axis from profile; each profile says what each depth means for its material.

## Pick the profile

Infer it from the source. Do not ask the user to choose a persona; the author's role does not predict the source or the audience.

| Signal | Profile |
|---|---|
| PR URL or number, branch, commit range, diff, a path in a repo | code-change |
| ADR, RFC, design doc, tech spec, API/SDK docs, runbook, postmortem; or a doc that describes how a system works or why a technical option was chosen | technical-doc |
| PRD, one-pager, strategy, roadmap, research readout, brief, epic, or a Google Doc / Confluence / Notion page about product intent, users, metrics, or timing | product-doc |
| Several sources | The one that carries the most of the story is primary; the others supply evidence. Say so in the plan |
| Unclear, or a topic with no source | Ask one question: "Is this mainly about a code change, how a system works, or a product plan?" |

State the inference in the plan as one correctable line: `Reading this as: <profile> · for <audience> · <depth> · <theme>`. If the user corrects it, switch profiles.

## Ask first

`scenes.json` in the explainer folder is the only script. Each line has `display` (real on-screen spelling) and `spoken` (what the voice says). Write `spoken` already expanded: `onAfterChange` → "on after change", `API` → "A P I", `.ts` → "dot T S", `==` → "equals equals". `spoken` must not contain camelCase, snake_case, symbols, paths, digits glued to identifiers, or all-caps tokens. Give each scene two spoken lines of about 20 words or more; very short lines are merged into one chunk and lose a visual beat. Captions are the `display` text timed to the voice, so `display` and `spoken` must carry the same words and differ only in spelling (`V1` vs "version one", `$62.85M` vs "sixty two point eight five million dollars"). Do not drop or add words in one of them (for example a leading "Meanwhile," that is spoken but not shown); the caption for that phrase will start early or late.

Read [lexicon.json](lexicon.json). Its entries win over [scripts/speak_prep.py](scripts/speak_prep.py). A `phonemes` field is Misaki's own symbols, written `[term](/phonemes/)`, not IPA. Misaki drops symbols it does not know. `id`, `ID`, and an `Id` suffix are the abbreviation eye-dee: Misaki `ˌIˈdi`, which is `/ˌaɪˈdiː/` (`a` and `ː` are not Misaki symbols). Listen once with [scripts/audition.py](scripts/audition.py) before keeping an override. That audition is a one-time setup check, not part of every video.

Read the source first, as the profile says. Ask only what is still unknown. One round of questions, then the plan:

1. Topic, who it is for, and the one thing they should understand at the end. Infer topic from the source; ask for the audience if it is not obvious (the profile lists its audience options).
2. Facts that must be exact: names, numbers, dates, paths, ticket ids. Do not invent these. If a fact is missing, ask. Do not guess. Follow [facts.md](facts.md) and write `facts.json`.
3. Depth, with the default from the profile and the source size: **Overview**, **Standard**, or **Deep dive**. Scene count and length follow depth, not a fixed count.
4. Script style: **Natural (default)** or **Strict STE100** (see [script-style.md](script-style.md)).
5. Engine and theme:
   - **Videowright (default)** — HTML/TypeScript/WAAPI. Pick a theme (the profile suggests one):
     - **Motion Engineering (default)** — aerospace HUD, blueprint CAD, crisp systems diagrams, code terminals, telemetry. Ships with Videowright.
     - **MetaMask** — OLED black, Inter, fox-orange accent, rounded cards. Bundled at [styles/metamask/](styles/metamask/STYLE.md). Use for MetaMask product topics and any audience wider than engineers.
     - **MetaMask Developer** — `#0A0A0A` canvas, wireframe four-colour fox, horizontal "MetaMask Developer" lockup, code-first and mono-led. Bundled at [styles/metamask-developer/](styles/metamask-developer/STYLE.md). Prefer it for SDK, API, docs, tooling, token, or code-heavy topics aimed at engineers.
   - **Manim (optional alternative)** — Python/Cairo for mathematical formulas, calculus, coordinate geometry, or LaTeX animations.
6. Pronunciations are not a question. Ask only about a person's name. Do not ask how to say an identifier, acronym, or id.
7. Where the finished file goes:
   - **Keep local (default).** Ask for a folder. Default `~/Videos/explainers/<topic-slug>/`. Do not `git add` the video or the source material.
   - **A pull request description,** a chat message, or another place the user names. Ask which. Do not commit the mp4. Do not push.

## Approval

Prepare the plan in this order: read the source per the profile, build the facts ledger, run `python3 scripts/verify_facts.py <scenes.json> --facts <facts.json>` on the draft script, and fix what it reports. Then show this and wait for a yes:

- **Reading this as:** profile · audience · depth and estimated length · theme · script style · engine
- **Source stamp:** what you read (title, owner, status, as-of date, how much of it) — for documents
- **The profile's plan contents** (triage table for code; narrative outline, omitted sections, and confidential-content list for docs)
- **Scene list:** one idea per scene
- **Facts ledger** and **discrepancies** from [facts.md](facts.md): every number, date, and name that will appear, its source, and any conflict with the proposed resolution. Ask the user to confirm or correct. A discrepancy with no resolution blocks the render.
- **Spoken lines**, written per [script-style.md](script-style.md). `spoken` is already expanded.
- **Unknowns table** from `python3 scripts/speak_prep.py <scenes.json>`. Correct a row in this yes if the spoken form is wrong. Do not paste a longer list than the report.
- **Destination:** local path (default), or the place the user named

## Production

After approval, follow these steps in this order. Do not skip or reorder them.

Always use the **local Kokoro 82M voice** (`af_heart`, 24 kHz). The voice runs on your machine. Do not use a cloud voice. Do not clone a person's voice.

### Option A: Videowright (Default)

Use Videowright for technical architecture, system flowcharts, software pipelines, HUD-styled explainers, and code walkthroughs.

1. **Project structure & Config:**
   In the explainer folder (e.g. `~/Videos/explainers/<topic-slug>/`):
   - Set `defaultStyle` in `videowright.config.ts` to the chosen theme slug: `'motion-engineering'` or `'metamask'`.
   - **MetaMask Developer:** copy [styles/metamask-developer/](styles/metamask-developer/) to `<explainer>/styles/metamask-developer/` **and** [styles/metamask/fonts.css](styles/metamask/fonts.css) to `<explainer>/styles/metamask/fonts.css` (the variants share fonts). Import `styles/metamask-developer/tokens.css` and `styles/metamask/fonts.css`, set `defaultStyle` and `meta.style` to `'metamask-developer'`, and read `styles/metamask-developer/STYLE.md` (it lists only what differs from MetaMask, so read `styles/metamask/STYLE.md` too). Lockup: `foxDeveloperMark` + `developerWordmark` from `styles/metamask-developer/developer.ts`; hero: `revealDeveloperFox` on the first and last scene.
   - **Motion Engineering:** `timeline.ts` imports `styles/motion-engineering/tokens.css` and `styles/fonts.css`.
   - **MetaMask:** copy [styles/metamask/](styles/metamask/) (including `fox.ts`, `fox.svg`, `wordmark.ts`, `wordmark-white.svg`) to `<explainer>/styles/metamask/` and import `styles/metamask/tokens.css` and `styles/metamask/fonts.css` in `timeline.ts`. Read `styles/metamask/STYLE.md` and `brand.md` before authoring segments, and follow them instead of the Motion Engineering HUD rules below (same for MetaMask Developer). Set `meta.style: 'metamask'`. Show the lockup (fox + official wordmark via `foxMark` and `wordmark`) on every scene, and assemble the hero fox (`assembleFox` from `styles/metamask/fox.ts`) on the first and last scene.
   - Organize segments under `segments/<segment-id>/index.ts`.

2. **Audio, Beat Timestamps & Captions:**
   - Prepare speech, if `scenes.json` changed since approval: `python3 scripts/speak_prep.py <scenes.json>`. Read only that report.
   - Synthesize with the venv Python: `~/.venvs/explain-video/bin/python scripts/synth.py <scenes.json> --out <explainer>`. It writes audio, `durations.json`, and `audio/tracks/v1/track.ts`.
   - Videowright's track field is `length_s`, and `timing.perSegment` values are cumulative advance times (for example `[3.425, 8.225]`). Copy each segment `voiceover` and those advances into `defineSegment`. Do not keep a second script.
   - Generate the segment data with `python3 scripts/build_segment_data.py <explainer>`. It writes `timing.ts` (`advances`, `voiceover`) and `captions.ts` (`cues`, scene-relative) from `durations.json` and `captions.json`. Import them in the segments instead of copying numbers by hand.
   - Verify with `~/.venvs/explain-video/bin/python scripts/verify_audio.py <scenes.json> --out <explainer>`. Read only its report. Captions are the `display` text in `captions.json` from that same Whisper pass. Each display word is aligned to the words Whisper heard (numbers and hyphenated words expand to several spoken words), then grouped by pauses, so caption text follows the voice even on long deep-dive lines.
   - For each flagged token, run `verify_audio.py --repair` once. That tries one respelling or one Misaki phoneme override and re-checks only the flagged chunks. If it is still flagged, stop and name the token. After approval, append a fix that worked to [lexicon.json](lexicon.json). Do not loop.

3. **Visual Standards & Code Scenes** (the canvas, type, and HUD bullets below are for Motion Engineering; with the MetaMask themes follow `styles/metamask/STYLE.md` or `styles/metamask-developer/STYLE.md` for those and keep Layout Discipline. The code-scene rules apply to profiles that show code; product-doc scenes show no code, see the profile's scene list):
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
     - Every fact on screen or in the narration matches the ledger; run `scripts/verify_facts.py <scenes.json> --facts <facts.json> --also segments/*/index.ts` and fix every error. For code, every file or function named matches the diff.
     - Nothing says more than its fact's kind allows (a hypothesis is not shown as a result).
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
3. For code or math diffs, follow snippet limits (max 10 lines) and the triage in [triage.md](triage.md) (see [profiles/code-change.md](profiles/code-change.md)). `KokoroService` runs the same normalizer as `speak_prep.py`. Verify with `scripts/verify_audio.py`; captions use `display`.
4. Render a draft: `manim render -ql scene.py`.
5. Verification: Extract a frame from each scene with `ffmpeg`. Verify that no snippet or caption overlaps or is clipped, every named file or function matches the diff, and length is within the chosen depth. Fix issues and re-render once.

---

If the user corrects a spoken form, or `--repair` clears a token, add that term to [lexicon.json](lexicon.json) after approval. Do not add a row the normalizer already speaks.

## Cost

Read script reports only. Do not paste audio, a full transcript, or an uncut token list into context. Re-run flagged chunks, not the whole video. Do not call a subagent or another model for pronunciation.

## After the render

**Local (default).** Give the mp4 path. Stop. Do not upload, attach, or paste the video, the source text, or the ledger anywhere the user has not named.

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
