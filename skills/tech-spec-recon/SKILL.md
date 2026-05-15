---
name: tech-spec-recon
description: Read-only codebase exploration that produces grounded notes for a tech spec. Hunts for reusable components, established conventions, existing infrastructure to lean on, and gaps the feature will need to fill. Use when starting a tech spec for a new feature, when the user asks to "explore the codebase for X", "find existing patterns for Y", "what can we reuse for Z", or as the first phase of tech-spec authoring before architecture or UI decisions are made.
---

# Tech Spec Recon

Produce a grounded codebase reconnaissance report scoped to a specific feature. Every claim cites at least one file path. Output is structured so downstream skills (`tech-spec-architect`, `tech-spec-snippet`, `tech-spec-ui-surfaces`) can find what they need.

## When to use

Use at the start of tech-spec authoring, after the PRD/feature description exists but before architecture decisions are locked. Also use mid-spec when a new question surfaces ("does the codebase already have a toast-with-buttons component?").

Inputs required:

- **Feature context** — PRD doc, recording transcript, or at minimum a paragraph describing what's being built and which surfaces it touches
- **Codebase access** — Read, Grep, Glob (or equivalents). Read-only

Without feature context, do not start exploring. Ask the user for it.

## How to do the recon

### 1. Scope yourself

Before reading anything, list the 3–6 areas of the codebase the feature is likely to touch. Write them down. Examples for a watchlist feature: storage layer, query/state hooks, feature flag plumbing, the surfaces named in the PRD (Token Details page, Homepage, Swap/Bridge picker), and analytics events. Do not map outside these areas. Recon scope creep is the main failure mode.

### 2. Explore in the four buckets

For each area in scope, find evidence in four buckets. Some areas will have findings in all four; others won't.

- **Reuse** — concrete components, hooks, controllers, selectors, utilities that the feature can use as-is or with minimal wiring. Each entry needs a file path and a one-line description of what it does.
- **Conventions** — patterns the team consistently follows that the feature should match. Examples: "query keys live in a sibling `.keys.ts` file with `as const`", "feature flags use `createSelector(selectRemoteFeatureFlags, ...)`", "testIDs are kebab-case scoped to the feature." Each convention needs **at least two** example file paths backing it. One example is anecdote, two is a pattern.
- **Existing infrastructure** — services, controllers, libraries, APIs already wired into the app that the feature can call into. Examples: `UserStorageController.performGetStorage`, the TanStack Query client, an existing OpenAPI-typed client. Each entry names the entry point (class/method/function) and at least one file path showing it in use.
- **Gaps** — things the feature seems to need that the codebase doesn't have yet. Examples: "no batch endpoint for hydrating multiple asset IDs", "toast component doesn't support buttons", "no shared kebab-style empty-state CTA component." Gaps usually become OOS items, follow-up tickets, or new infrastructure tasks in the spec.

### 3. Read at least two examples per convention

A convention isn't a convention until you've seen it twice. If you can only find one example of a pattern, downgrade it: report it as a *reusable thing* (a one-off example to mirror) rather than a *convention* (a rule the team follows). Be honest about which is which.

### 4. Cite everything

Every claim needs at least one file path. No exceptions. "The team uses TanStack Query" → name two files where it's used. "We have a storage controller" → name the controller's source file and one consumer.

If you can't cite a claim, drop the claim. Do not paraphrase from memory of similar codebases.

### 5. Stay focused

Recon is not a codebase tour. If you find an interesting unrelated thing, ignore it. If you find a refactoring opportunity tangential to the feature, ignore it. The spec only needs what the feature touches.

## Output format

Write to `.specs/<feature-slug>/recon.md`. Structure:

```markdown
# Recon: {feature name}

**Scope:** {1 sentence — what the feature does}
**Areas explored:** {list of 3-6 areas}

## Reuse

### {Area, e.g. "UI components"}

- `{ComponentOrHookName}` — `path/to/file.ts` — {1-line description of what it does and why the feature can reuse it}
- ...

### {Next area}

- ...

## Conventions

- **{Convention name, e.g. "Query keys in sibling `.keys.ts` files"}**
  - Examples: `path/to/example1.ts`, `path/to/example2.ts`
  - Pattern: {1-2 sentence description of the rule}

- **{Next convention}**
  - ...

## Existing infrastructure

- **{Entry point name, e.g. "UserStorageController"}** — `path/to/source.ts`
  - Methods/exports the feature will use: `performGetStorage`, `performSetStorage`
  - Example consumer: `path/to/consumer.ts`
  - {1-2 sentences on how it works and what it's for}

## Gaps

- **{Gap, e.g. "No batch token-metadata endpoint"}** — {why this matters for the feature, where it surfaced during exploration}
- ...

## Notes & observations

{Optional. Anything important that doesn't fit the buckets — e.g. "two parallel toast implementations exist, the new one in `src/components/Toast/v2` should be preferred." Keep terse.}
```

After writing the file, echo a brief summary inline (1–2 sentences per bucket, no file paths) so the user can decide whether to drill in or move on.

## What this skill does not do

- It does not propose architecture. That's `tech-spec-architect`'s job.
- It does not write snippets. That's `tech-spec-snippet`'s job, which consumes recon output.
- It does not refactor or modify code. Read-only.
- It does not exhaustively catalogue the codebase. Stay scoped to what the feature touches.
- It does not invent file paths. Every citation must be a real path that was read.
