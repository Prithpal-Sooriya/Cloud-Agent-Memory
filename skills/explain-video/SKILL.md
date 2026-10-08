---
name: explain-video
description: >-
  Makes a short Manim explainer with a computer voice. Use when the user asks
  for a short video, an explainer video, Manim, or manim-voiceover. Asks for
  facts and pronunciations, then asks whether to keep the file local or add it
  to a pull request description, before any render.
---

# Explain as a short video

Do not install packages, write scene files, render, commit, push, or edit a pull request until the user approves the plan in [Approval](#approval).

## Ask first

Read [pronunciations.md](pronunciations.md) before asking. Ask only what is still unknown. One round of questions, then the plan.

1. Topic, who it is for, and the one thing they should understand at the end.
2. Facts that must be exact: names, numbers, paths, ticket ids. Do not invent these. If a fact is missing, ask. Do not guess.
3. How many ideas. One scene per idea. A short video is 4 to 6 scenes unless the user sets another count.
4. Pronunciations for words that are not already in [pronunciations.md](pronunciations.md): names, acronyms, symbols, and ticket ids. Ask for the spoken form. On-screen labels keep the real spelling. The voice uses the spoken form.
5. Where the finished file goes:
   - **Keep local.** Ask for a folder. Default `~/Videos/explainers/<topic-slug>/`. Do not `git add` the video.
   - **Pull request description.** Ask which pull request. Do not commit the mp4. Do not push.

## Approval

Show this and wait for a yes:

- Scene list: one idea per scene, diagram only, no paragraph on screen
- Spoken lines, written with [ste100.md](ste100.md)
- Pronunciations you will add to [pronunciations.md](pronunciations.md)
- Destination: local path, or the pull request you will edit

## Production

After approval, follow these steps in this order. Do not skip or reorder them.

```
Explain [TOPIC] to me as a short video.
Write the script in ASD-STE100 Simplified English.
Show each idea as a diagram, not as long text.
Animate it with Manim. Use one scene per idea.
Add a computer voice with manim-voiceover.
Render a draft, check the frames, fix the layout.
```

Use a synthetic computer voice already available to `manim-voiceover`. Do not pick a cloned or neural voice.

Render a low-quality draft. Read one frame from each scene. Fix overlap, clipped text, and labels that sit on the diagram. Render the draft again once. If the layout is still wrong, stop and show the frames. Do not keep looping.

Append each approved pronunciation to [pronunciations.md](pronunciations.md).

## After the render

**Local.** Give the mp4 path. Stop.

**Pull request description.** Read the current body. Put the video in an existing Screenshots/Recordings section, or add a Video section. Do not delete existing text.

Add a one-line note under the video that says the walkthrough is AI-generated. A synthetic voice can feel uncanny when the reviewer does not expect it. Use this note, or a close variant:

> 🤖 AI-generated walkthrough — script, animation, and voice made by an agent

The description can play a video only from a GitHub-hosted URL. Do not invent that URL. Do not commit the mp4 to get one. If you cannot upload the file from the shell, stop. Give the local path and ask the user to drop the file into the pull request description. When they send the attachment URL, add it with `gh pr edit`.

A description edit is not a commit. If any step needs a commit, stop and ask the user to sign it. Do not push an unsigned commit. Do not pass `--no-gpg-sign`.
