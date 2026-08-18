---
name: tech-spec
description: Author a full technical specification from a PRD or feature description — grill unresolved decisions, recon the codebase, propose or validate architecture, write grounded snippets and UI surfaces, decompose into phased tasks, and assemble one committable Markdown spec. Use when the user asks for a tech spec, implementation plan, technical breakdown, to spec out a feature, or mentions recon, architecture, grill me, task breakdown, or synthesizing a spec.
---

# Tech Spec

Run the full authoring pipeline in **one skill session**: intake + grill, then recon → architecture → snippets → UI surfaces → decompose → synthesize. Intermediate artifacts land in `.specs/<feature-slug>/`; the final deliverable is one `tech-spec-<feature-slug>.md`.

Do **not** dump every phase file into context up front. Read the next reference only when you enter that phase.

## Hard rules

- Never skip recon. Downstream phases ground claims in recon's file-path citations.
- Treat any repo playbook / `AGENTS.md` / engineering conventions the user points at (or that already live in the repo) as authoritative for recon.
- Architect Mode A vs Mode B is explicit. If the user didn't pick, ask — do not infer.
- If decompose flags borderline or too-big, stop and raise the split before synthesizing.
- Read-only on the codebase. Write only into `.specs/` and the final spec file.
- If a question can be answered by exploring the codebase, explore instead of asking.

## Workspace

```
.specs/<feature-slug>/
  recon.md
  architecture.md
  snippets/<snippet-slug>.md
  ui-surfaces/<surface-slug>.md
  task-breakdown.md
tech-spec-<feature-slug>.md          ← final assembled spec
```

Create the `.specs/<feature-slug>/` directory at intake. Derive the slug from the feature name (kebab-case). Resume from the first missing artifact if this directory already exists.

## Intake

Do not start recon until you have:

- **Feature context** — PRD link, recording, or a paragraph describing what is being built
- **Surfaces touched** — screens, regions, controls, or plumbing that will get UI subsections
- **Mode** — `A` (propose architecture) or `B` (validate a chosen architecture)
- **Mode B only:** the user's proposed architecture, in any form

Also collect if known; otherwise grill for them (see below):

- Out of Scope / v1 cuts
- Stakeholders (analytics review owner, storage/platform owners)
- Figma links, feature-flag plan, repo playbook path

Without feature context, ask for it. Do not explore.

## Grill protocol

Used at every gate. Goal is shared understanding, not a questionnaire.

- Ask **one question at a time**.
- For each question, give your **recommended answer** and why.
- Walk one branch of the decision tree at a time; resolve dependencies before opening a new branch.
- Prefer codebase evidence over the user's memory.
- Stop grilling a topic once it is resolved or explicitly deferred (deferrals become Out of Scope or Open questions).

Do not interrogate things recon can settle. Intake grill is for product/architecture forks the code cannot answer.

## Pipeline

Copy this checklist and keep it updated in your working notes:

```
Tech spec progress:
- [ ] Intake
- [ ] Intake grill
- [ ] Recon
- [ ] Recon gate
- [ ] Architecture
- [ ] Architecture gate
- [ ] Snippets
- [ ] UI surfaces
- [ ] Surfaces gate
- [ ] Decompose
- [ ] Size gate
- [ ] Synthesize
```

### 1. Intake grill

Ask only what is still missing or genuinely forked. Typical high-leverage questions:

- Mode A or B?
- What is deliberately out of scope for v1?
- Who owns analytics / storage / platform review?
- Any architecture already decided (storage class, new vs reuse, FF strategy)?

Once required intake is filled and the important forks are named, proceed. Do not block on Figma links or nice-to-have notes.

### 2. Recon

Read [recon.md](recon.md). Write `.specs/<feature-slug>/recon.md`. Echo a brief summary (1–2 sentences per bucket, no file paths).

**Recon gate.** Challenge anything thin: missing citations, one-example "conventions", gaps that are really "didn't look". 1–3 questions max. Then proceed unless the user wants another pass.

### 3. Architecture

Read [architect.md](architect.md). Write `.specs/<feature-slug>/architecture.md`. Queue snippet requests; do not write snippet bodies here.

**Architecture gate.**

- Mode A: stop until the user picks every genuine choice. Then expand the chosen options into subsections (rewrite `architecture.md`).
- Mode B: stop if open questions or recon contradictions are unresolved.
- Either mode: confirm the top-level decision sentence before snippets.

### 4. Snippets

Read [snippets.md](snippets.md). One file per queued snippet under `.specs/<feature-slug>/snippets/`. Generate all of them in this phase (explore similar patterns in parallel). Echo each snippet inline after writing the file.

### 5. UI surfaces

Read [ui-surfaces.md](ui-surfaces.md). One file per surface under `.specs/<feature-slug>/ui-surfaces/`. Write all surfaces in this phase. Queue extra snippet requests only for non-obvious wiring; generate those snippets before leaving this phase.

**Surfaces gate.** Brief: reuse vs build-new, V1 cuts, analytics event names. Then proceed unless the user objects.

### 6. Decompose

Read [decompose.md](decompose.md). Write `.specs/<feature-slug>/task-breakdown.md`. Echo phase counts, weighted total, verdict.

**Size gate.** If the verdict is borderline or too-big, **stop**. Raise the split recommendation. Do not synthesize until the user accepts the size or cuts scope.

### 7. Synthesize

Read [synthesize.md](synthesize.md) and [template.md](template.md). Assemble `tech-spec-<feature-slug>.md`. Do not invent missing sections — go back to the phase that owns them.

## What this skill does not do

- It does not modify application code or write tests.
- It does not estimate hours, days, or story points.
- It does not silently include Out of Scope work.
- It does not skip gates that would poison downstream artifacts (unresolved Mode A choices, Mode B open questions, red/borderline size).
