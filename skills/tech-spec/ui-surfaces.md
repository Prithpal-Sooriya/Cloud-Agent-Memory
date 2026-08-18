# UI Surfaces

Produce one UI surface subsection per surface, following the templated shape. Write all surfaces in this phase — one file each.

A surface is anything that gets its own section in the spec's UI Surfaces region: a screen, a screen region (e.g. a homepage section), a control (e.g. a star icon), or a piece of UI plumbing (e.g. feature flag gating).

## Inputs

Required:

- Surface names (from intake)
- Feature context
- Recon output — `.specs/<feature>/recon.md`
- Architecture output — `.specs/<feature>/architecture.md`

Optional per surface: Figma link, V1 constraints, surface-specific data scope, caller notes.

If recon or architecture are missing, go back to those phases. Don't invent reuse candidates or hooks that aren't grounded in the upstream documents.

## How to produce each subsection

### 1. Identify what the surface needs

From caller notes and the architecture document, figure out:

- Which hooks from architecture this surface consumes
- What data the hooks should return for this surface (explore data, balance data, blob only, etc.)
- What interactions the surface supports (taps, toggles, navigations)
- What analytics this surface fires

### 2. Match reuse candidates from recon

For each piece of UI on this surface, check recon's *Reuse* section. Default to reusing — only call out "build new" if recon has no match.

If recon shows a candidate but it doesn't quite fit, document the gap: "Reuse `TrendingTokenRowItem` with a new prop for the star slot — confirm with design that the prop variant is acceptable." Don't invent a new component without flagging it.

### 3. List interactions as named handlers with steps

Each interaction gets a handler name and a 2–4 step bulleted breakdown. Each step is a verb phrase: "Update blob", "Show toast", "Send analytics", "Navigate to X". Terse, scan-friendly, exhaustive enough to map to code.

Analytics steps name the event and the source value, e.g. "Analytics for `TokenDetailsScreenOpened` with `source: 'watchlist_home'`."

### 4. Decide whether the surface needs a snippet

Queue a snippet (then generate it via [snippets.md](snippets.md)) if **and only if** there's a non-obvious wiring detail to pin. Examples that warrant a snippet:

- A handler that combines a hook, a toast, and analytics in a specific order
- A selector with version gating logic (feature flag selectors)
- A non-obvious data-flow path the implementer might get wrong

Examples that do **not** warrant a snippet:

- "Reuse X and Y" with no new wiring
- Standard list rendering with reused row components
- Navigation that follows existing app patterns

If unsure, lean towards no snippet. Surfaces with too many snippets bloat the spec; the architecture section is where snippets live by default.

### 5. Write the subsection

Keep it scannable. A reviewer should be able to read 8 surfaces in under 5 minutes.

## Output format

Write to `.specs/<feature-slug>/ui-surfaces/<surface-slug>.md`. Use kebab-case for the slug. Structure:

```markdown
# UI Surface: {surface name}

**Destined for:** section 3.X of the spec (number assigned at synthesize)

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

After writing each file, echo a brief inline summary: which hooks, which components, which interactions, whether a snippet was queued.

## Do not

- Invent reuse candidates or hooks not in recon or architecture.
- Write snippet bodies here — queue them and generate via snippets.md.
- Write tests, build runbooks, or modify code.
- Assign section numbers. Synthesize does that during assembly.
