# Decompose

Produce the Task Breakdown section: dependency-ordered phases, items named (not estimated), parallelizability called out in the heading, and a 2-week sanity check at the end.

## Inputs

Required:

- Architecture output — `.specs/<feature>/architecture.md` (for Phase 1: business logic items)
- UI surface files — `.specs/<feature>/ui-surfaces/*.md` (for Phase 2: one item per surface)
- Out of Scope list — explicit list of items NOT to include in phases

Optional:

- Stakeholders — for Phase 3 review items (e.g. "analytics schema review with @Person")
- Feature flag plan — if Phase 0 needs anything beyond standard FF setup
- Foundation work specific to this feature — schema migrations, new infrastructure, etc.

If architecture or UI surfaces are missing, go back to those phases. Don't invent phases without grounded inputs.

## Phase convention

Four phases by default, in dependency order. Drop a phase if the feature genuinely doesn't need it; don't shift numbering when dropping.

- **Phase 0 — Foundation.** Feature flag setup, schema migrations, new infrastructure pieces that everything else depends on.
- **Phase 1 — Business logic.** Hooks, controllers, selectors, services. The data layer the UI consumes. One item per named hook/module.
- **Phase 2 — UI.** One item per surface. **Parallelizable after Phase 1.** Call this out in the phase heading verbatim: `Phase 2 — UI (parallelisable after phase 1)`.
- **Phase 3 — QA / Analytics / Polish.** Standard close-out items.

## How to decompose

### 1. Phase 0 — Foundation

Default item: feature flag setup. Add foundation items only if architecture explicitly calls them out (e.g. "new schema needed in UserStorageController", "new analytics event category"). When in doubt, leave foundation thin — most features only need the FF.

### 2. Phase 1 — Business logic

Walk through architecture's hook/module list and create one item per named entity. Items are the entity name as written in architecture, e.g. `useTokenWatchlistQuery`, not "build the watchlist query hook."

If the convenience hook (e.g. `useTokenWatchlist`) wraps the others, list it last in the same phase — it's a thin layer on top.

### 3. Phase 2 — UI

One item per UI surface file. Item is the surface name (the H1 from each `ui-surfaces/<surface>.md`). Heading **must** include `(parallelisable after phase 1)` — that callout is the cut-line signal for downstream readers and agents.

If the user has constraints that limit parallelism (e.g. "do Token Details first to validate the convenience hook"), surface that as a note under the phase heading, not by changing the parallelizability claim.

### 4. Phase 3 — QA / Analytics / Polish

Default template:

- Analytics schema review with `{stakeholder name}` *(omit if no new analytics events)*
- Component / view tests
- QA testing sheet
- FF rollout plan & runbook *(omit if Phase 0 has no FF)*

Adjust based on architecture (e.g. add "Integration tests against UserStorageController" if the architecture introduces a new storage path). Don't bloat — Phase 3 stays under 6 items in almost all cases.

### 5. Honour Out of Scope

For each Out of Scope item, verify it's NOT in any phase. If a phase item conflicts (e.g. "Per-item historical price chart" is OOS but Phase 2's surface says "render price chart"), flag the contradiction and ask the user to resolve.

## The 2-week sanity check

Count the items across all phases. Apply this rough heuristic:

- **≤ 12 items** — fits in 2 weeks for a small team. ✓
- **13–18 items** — borderline. Note this in the verdict; suggest the user think about whether anything is splittable.
- **19+ items** — too big. The spec should split. Suggest concrete split lines based on the phases: "Hooks-only ticket as v1.0, UI as v1.1," or "Split UI surfaces across two specs by user value."

Phase 2 items count as **1.5** each (surfaces are heavier than hooks). Other phases count as **1**. This is a smell test, not an estimate. The point is to flag when the spec is too big to stay coherent.

Write the verdict as one short paragraph at the bottom of the output, explaining the count and the recommendation.

## Output format

Write to `.specs/<feature-slug>/task-breakdown.md`. Structure:

```markdown
# Task Breakdown: {feature name}

## Phase 0 — {Foundation phase name, e.g. "LD Feature Flag Creation"}

- {Item — concrete deliverable, terse}
- ...

## Phase 1 — {Business logic phase name, e.g. "Business Logic (TanStack Query Hooks)"}

- `{hookOrModuleName}`
- `{another}`
- ...

## Phase 2 — UI (parallelisable after phase 1)

- {Surface 1 name}
- {Surface 2 name}
- ...

## Phase 3 — QA / Analytics / Polish

- Analytics schema review with {stakeholder} *(omit if N/A)*
- Component / view tests
- QA testing sheet
- FF rollout plan & runbook *(omit if N/A)*

## Sanity check

**Item count:** {N (weighted)} — {verdict, one short paragraph explaining count and any recommended splits}
```

After writing the file, echo a brief inline summary: phase counts, weighted total, verdict.

## Do not

- Estimate effort in hours, days, or story points. Items are named work units; estimation is for the team that picks up the spec.
- Invent items that aren't in architecture or UI surfaces. If architecture has 4 hooks, Phase 1 has 4 items.
- Silently include Out of Scope work in phases. Flag conflicts instead.
- Assign owners to tasks. That's the team's call during sprint planning.
