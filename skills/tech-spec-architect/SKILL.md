---
name: tech-spec-architect
description: Produce the Architecture section of a tech spec, either by proposing options for the user to choose between (Mode A) or by stress-testing a chosen architecture and writing it up (Mode B). Use when the user asks to "propose an architecture for X", "validate this architecture", "draft the architecture section", or as the second phase of tech-spec authoring after recon. Calls tech-spec-snippet for embedded snippets.
---

# Tech Spec Architect

Produce the **Architecture section only** of a tech spec. Two modes; the caller picks.

## When to use

After `tech-spec-recon` has been run and a PRD/feature description exists. Before `tech-spec-ui-surfaces` and `tech-spec-decompose`.

The skill produces section 2 (Architecture) and its subsections. It does **not** produce Feature Summary, UI Surfaces, Analytics, Out of Scope, or Task Breakdown. Other skills own those.

## Inputs

Required:

- **Feature context** — PRD or 1-paragraph description, including which surfaces are touched
- **Mode** — `propose` or `validate`. If the caller didn't pick one, ask. Do not infer.
- **Recon output** — path to `.specs/<feature>/recon.md` if it exists. If it doesn't, run `tech-spec-recon` first or ask the user to.

Mode-specific:

- **Mode A (propose)**: nothing extra
- **Mode B (validate)**: the user's proposed architecture, in any form (1 sentence, a sketch, a list of decisions)

## Mode A — Propose

For each major architectural decision the feature needs, ask: *is there a genuine choice here, or does the recon point to one pattern?*

- **Genuine choice** (e.g. storage layer where E2EE vs AUS vs local both fit): propose 2–3 viable options with explicit tradeoffs. Recommend one. The user picks before the section is finalised.
- **Obvious choice** (e.g. "use TanStack Query because the recon shows the team has standardised on it"): document the obvious choice with a one-line "why this and not the alternative." No false-choice theatre.

A genuine choice usually involves a stakeholder trade — data sovereignty, perf vs simplicity, lock-in to a library, sync semantics. Naming/styling/file-layout decisions are not genuine choices; pick the convention from recon and move on.

For each decision the user picks, expand into a subsection (see *Subsection shape* below).

## Mode B — Validate

The user has already chosen an architecture. Your job is to stress-test it, then write it up.

For each decision in the user's proposed architecture, before documenting it:

1. **Check recon for contradictions.** Does the convention point a different way? If yes, surface it: "Recon shows the team uses X for similar features; the user has chosen Y. Confirm this is intentional before proceeding." Don't override the user — flag the conflict.
2. **Look for missing pieces.** Did the user say *how* data is persisted but not *how* it's read back? Did they say *what* hook to use but not *what query keys*? Surface missing pieces as "Open question" callouts the user has to resolve.
3. **Identify failure modes.** What breaks under load, on a slow network, with bad input, with concurrent writes? Surface one or two — the ones a senior reviewer would catch — as inline prose in the relevant subsection.

Then expand each decision into a subsection.

## Subsection shape

Each architectural subsection (e.g. 2.1 Storage, 2.2 Client Integration, 2.3 Hooks) follows the same shape:

```markdown
### 2.X {Subsystem name}

{1-3 sentences of design decision in prose. Pin contracts: data shape, endpoint,
type, library choice. Cite stakeholders if relevant ("Discussed with @Person").}

{Optional tradeoff or concern as inline prose. Examples from real specs:
"If profiling finds this too heavy, split into 2 separate query hooks."
"We use E2EE over AUS because our boundary doesn't require backend reads."}

{Snippet placeholder — invoke tech-spec-snippet for this subsection}
```

## How to produce snippets

Do **not** write snippets inline yourself. For each subsection that needs a snippet, invoke `tech-spec-snippet` with:

- Scope: what the snippet is (e.g. "the watchlist storage path constant and helpers")
- Purpose: what role it plays in the spec (e.g. "pin the storage contract")
- Destined for: this subsection's number and name
- Fidelity hint: precise for contracts, illustrative for wiring
- Codebase pointers: from recon

If the caller is `tech-spec-synthesize` or a human in Claude Code, snippet invocations can run in parallel across subsections.

## Output format

Write to `.specs/<feature-slug>/architecture.md`. Structure:

```markdown
# Architecture: {feature name}

**Mode:** {propose | validate}

## Top-level decision

{1-2 sentences naming the chosen approach and the key building blocks it leans on.
Call out anything deliberately NOT built. Example from WatchList:
"The proposed architecture will use E2EE Encrypted Storage, and TanStack Query.
We do not need to build a custom core controller or service."}

## Decisions

### 2.1 {Subsystem name}

{Decision prose. Tradeoff/concern as inline prose if relevant.}

**Snippet:** see `.specs/<feature>/snippets/<snippet-slug>.md`

### 2.2 {Next subsystem}

{Same shape.}

## Open questions (Mode B only)

- {Things the user needs to resolve before this section is final}

## Stress-test findings (Mode B only)

- {Contradictions with recon, missing pieces, failure modes worth flagging}

## Proposed options (Mode A only, when genuine choices exist)

- {Decision area → list of options with tradeoffs → recommendation. Once
  resolved, this section is deleted and the decisions get expanded above.}
```

After writing the file, echo a brief summary inline (decisions made, open questions, snippet invocations queued).

## What this skill does not do

- It does not write the Feature Summary, UI Surfaces, Analytics, Out of Scope, or Task Breakdown.
- It does not write snippets directly. It calls `tech-spec-snippet` for them.
- It does not silently override the user in Mode B. It flags conflicts and waits.
- It does not propose 2-3 options for decisions that have an obvious answer from recon. No false-choice theatre.
- It does not modify the codebase. Read-only.
