---
name: tech-spec-ui-surfaces
description: Produce one UI surface subsection for a tech spec — the templated Figma / Hooks / Components / Interactions block, optionally with a wiring snippet. Use when the user asks to "draft the UI section for X", "write up the Token Details surface", "spec out the Homepage section", or as a phase of tech-spec authoring after architecture is settled. Produces one surface per invocation; for multiple surfaces, invoke in parallel.
---

# Tech Spec UI Surfaces

Produce one UI surface subsection of a tech spec, following the templated shape. One surface per invocation — fan out for multiple surfaces.

## When to use

After `tech-spec-recon` and `tech-spec-architect` have run. Once architecture is settled, each UI surface gets its own subsection describing how it consumes the architecture's hooks and which components it reuses or builds.

A surface is anything that gets its own section in the spec's UI Surfaces region: a screen, a screen region (e.g. a homepage section), a control (e.g. a star icon), or a piece of UI plumbing (e.g. feature flag gating). One invocation = one surface.

## Inputs

Required:

- **Surface name** — e.g. "Token Details Page", "Homepage Watchlist Section", "Swap/Bridge Pill"
- **Feature context** — PRD or 1-paragraph feature description
- **Recon output** — `.specs/<feature>/recon.md` (for reuse candidates and conventions)
- **Architecture output** — `.specs/<feature>/architecture.md` (for the hooks the surface will consume)

Optional:

- **Figma link** for this surface
- **V1 constraints** — e.g. "Homepage doesn't use the Historical Charts view in V1, falls back to existing row UI"
- **Surface-specific data scope** — e.g. "this surface needs balance data" or "this surface needs explore data only"
- **Caller's notes** about this surface (specific reuse callouts, design constraints)

If recon or architecture are missing, ask the user to run those first. Don't invent reuse candidates or hooks that aren't grounded in the upstream documents.

## How to produce the subsection

### 1. Identify what the surface needs

From the caller's notes and the architecture document, figure out:

- Which hooks from architecture this surface consumes
- What data the hooks should return for this surface (explore data, balance data, blob only, etc.)
- What interactions the surface supports (taps, toggles, navigations)
- What analytics this surface fires

### 2. Match reuse candidates from recon

For each piece of UI on this surface, check recon's *Reuse* section. Default to reusing — only call out "build new" if recon has no match.

If recon shows a candidate but it doesn't quite fit, document the gap: "Reuse `TrendingTokenRowItem` with a new prop for the star slot — confirm with design that the prop variant is acceptable." Don't invent a new component without flagging it.

### 3. List interactions as named handlers with steps

Each interaction gets a handler name and a 2–4 step bulleted breakdown. Each step is a verb phrase: "Update blob", "Show toast", "Send analytics", "Navigate to X". This matches the WatchList spec's style — terse, scan-friendly, exhaustive enough to map to code.

Analytics steps name the event and the source value, e.g. "Analytics for `TokenDetailsScreenOpened` with `source: 'watchlist_home'`."

### 4. Decide whether the surface needs a snippet

Invoke `tech-spec-snippet` for this surface if **and only if** there's a non-obvious wiring detail to pin. Examples that warrant a snippet:

- A handler that combines a hook, a toast, and analytics in a specific order (star toggle on Token Details)
- A selector with version gating logic (feature flag selectors)
- A non-obvious data-flow path the implementer might get wrong

Examples that do **not** warrant a snippet:

- "Reuse X and Y" with no new wiring
- Standard list rendering with reused row components
- Navigation that follows existing app patterns

If unsure, lean towards no snippet. Surfaces with too many snippets bloat the spec; the architecture section is where snippets live by default.

### 5. Write the subsection

Use the structure in *Output format* below. Keep it scannable. The whole point is that a reviewer can read 8 surfaces in under 5 minutes.

## Output format

Write to `.specs/<feature-slug>/ui-surfaces/<surface-slug>.md`. Use kebab-case for the slug. Structure:

```markdown
# UI Surface: {surface name}

**Destined for:** section 3.X of the spec (number assigned by tech-spec-synthesize)

{1–2 sentences of context — what this surface is and what the feature adds to it.}

**Figma:** {link or "Watchlist" if linked elsewhere in the doc}

{Optional blockquote callout for V1 cuts or constraints, e.g.
"> V1 will not use the Historical Charts view, instead we'll use the existing TrendingTokenRowItem UI."}

**Hooks:**
- `{hookName}` — {what it does for this surface, e.g. "Explore Data & Select top 3"}

**Components:**
- {Reuse callout or new component — match recon's reuse candidates by default}
- {Conditional rendering note, e.g. "Hide/Show section depending on FF"}

**Interactions:**
- `{handlerName}`
  - {Step 1 — verb phrase}
  - {Step 2 — verb phrase}
  - {Step 3 — verb phrase}

**Snippet:** see `.specs/<feature>/snippets/<snippet-slug>.md` *(only if a wiring snippet was warranted)*

## Grounding

- **Recon references:** {list of recon entries this surface leans on}
- **Architecture references:** {list of hooks/decisions consumed}
```

After writing the file, echo a brief inline summary: which hooks, which components, which interactions, whether a snippet was invoked.

## What this skill does not do

- It does not produce multiple surfaces per invocation. One scope, one surface, one file.
- It does not invent reuse candidates or hooks not in recon or architecture. Ask first.
- It does not write snippets directly. Calls `tech-spec-snippet` if needed.
- It does not write tests, build runbooks, or modify code. Subsection only.
- It does not assign section numbers. `tech-spec-synthesize` does that during assembly.
