# {Feature Name} Tech Spec — Technical Breakdown & Tasks

<!--
  Template for technical specifications.
  Section structure is FIXED. Snippet style is FIXED (collapsed <details>).
  You may ADD sections (e.g. Migration Plan, Backward Compatibility) AFTER
  "Out of Scope (v1)" and BEFORE "Task Breakdown" if the feature requires it.
  Do not rearrange or rename the locked sections.

  Snippet rule: every code block lives inside a <details> with a <summary>
  that names it. Leave one blank line after </summary> for the fenced block
  to render. Indent code inside <details> consistently.
-->

> **Initial Raw Recording:** {loom or other link, optional}
> **PRD:** {link to PRD if separate, optional}
> **Related PR / branch:** {link if exists, optional}

## 1. Feature Summary

{2–5 sentences of prose. What does the user get? Which surfaces does it touch?
Who owns it long-term? No snippets in this section.}

## 2. Architecture

{1–2 sentences naming the chosen approach and the key building blocks
it leans on (existing controllers, libraries, services). Call out anything
deliberately NOT built — e.g. "We do not need a custom core controller."}

### 2.1 {Subsystem name — e.g. Storage}

{Prose explaining the design decision. Cite who it was discussed with if
relevant. Pin down the contract: data shape, endpoint, type.}

<details>
<summary>{Snippet title — e.g. "Example Blob" or "Storage Schema"}</summary>

```ts
// snippet content — interface-pinning where contracts matter,
// illustrative where they don't
```

</details>

### 2.2 {Next subsystem}

{Same pattern. Add as many subsections as the architecture has natural
boundaries. Typical: storage, client integration, hooks/state, hydration.}

<details>
<summary>{Snippet title}</summary>

```ts
// ...
```

</details>

## 3. UI Surfaces

### 3.1 Feature Flags

{Brief — how the feature is gated. One snippet showing the selector
or flag key pattern.}

<details>
<summary>Feature Flag Selector</summary>

```ts
// ...
```

</details>

### 3.2 {Surface name — e.g. Token Details Page}

{1–2 sentences of context. Link to Figma.}

**Figma:** {link}

**Hooks:**
- `{hookName}` — {what it does on this surface}

**Components:**
- {Component reused or built — e.g. "Reuse TrendingTokenRowItem"}
- {Conditional rendering note — e.g. "Hide star icon when FF is disabled"}

**Interactions:**
- `{handlerName}`
  - {Step 1 — e.g. "Update blob"}
  - {Step 2 — e.g. "Show toast"}
  - {Step 3 — e.g. "Send analytics"}

<details>
<summary>{Snippet title — wiring or handler shape, optional}</summary>

```tsx
// ...
```

</details>

### 3.3 {Next surface}

{Repeat the Figma / Hooks / Components / Interactions block per surface.}

## 4. Analytics

{Brief — when in doubt list events and their payloads. Mark MVP vs nice-to-have.}

<details>
<summary>Analytics Events</summary>

```
Must have for MVP:
• {Event Name} — {payload fields}
• ...

Also update existing events:
• {Existing event} — add {field/enum value}
```

</details>

## 5. Out of Scope (v1)

- {Thing deliberately deferred — with one-line reason}
- {Another}
- {Edge case explicitly not handled in v1}

<!-- ADDITIONAL SECTIONS (optional, additive) go here.
     Examples: Migration Plan, Backward Compatibility, Rollout Plan,
     Performance Budget, Security Considerations. Add only if the feature
     genuinely needs them. -->

## Task Breakdown

### Phase 0 — {Foundation, e.g. Feature Flag Creation}

- {Task — usually a single concrete thing}

### Phase 1 — {Business Logic, e.g. TanStack Query Hooks}

- `{hookOrModuleName}`
- `{another}`

### Phase 2 — {UI (parallelisable after phase 1)}

- {Surface 1}
- {Surface 2}
- {Surface 3}

<!-- Call out parallelizability EXPLICITLY in the phase heading,
     e.g. "Phase 2 - UI (parallelisable after phase 1)".
     This is the cut-line signal for downstream agents and reviewers. -->

### Phase 3 — QA / Analytics / Polish

- Analytics schema review with {owner}
- Component / view tests
- QA testing sheet
- FF rollout plan & runbook
