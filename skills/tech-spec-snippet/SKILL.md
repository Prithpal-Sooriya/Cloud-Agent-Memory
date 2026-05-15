---
name: tech-spec-snippet
description: Generate a single grounded code snippet for a technical specification by exploring the codebase for similar patterns and consulting any provided docs (OpenAPI specs, PRDs, recon notes). Use when the user asks for "a snippet for X", "show me how Y should look", "draft the code for Z in the spec", or when another tech-spec skill (architect, ui-surfaces) needs a snippet for its section. Returns one snippet per invocation; for multiple snippets, invoke in parallel.
---

# Tech Spec Snippet

Generate one tech-spec-quality code snippet, grounded in the actual codebase and any provided docs. The output is destined for a `<details>` block inside a tech spec — not for execution.

## When to use

The user (or an upstream tech-spec skill) needs one snippet that:

- Demonstrates a pattern, contract, or wiring
- Mirrors existing codebase conventions (existing hooks, controllers, selectors)
- Optionally consumes an API contract (OpenAPI spec, type definition, PRD)

Use one invocation per snippet. For multiple snippets, the caller invokes this skill multiple times — possibly in parallel.

## Inputs the caller should provide

At minimum:

- **Scope** — what the snippet is. Examples: "the storage path constant", "the add mutation hook", "the toggle handler for the star icon in Token Details".
- **Purpose** — what role it plays in the spec. Examples: "pin the storage contract", "show how optimistic updates work", "illustrate the wiring, not full styling".

Optionally:

- **Reference docs** — OpenAPI spec URL or path, PRD excerpts, design notes
- **Codebase pointers** — "follow the pattern in `src/features/foo/`" or "this should look like `useTrendingRequest`"
- **Fidelity hint** — "precise" (pin every type) vs "illustrative" (use `...` and comments for non-essential parts)

If the caller didn't specify fidelity, infer it from the scope: contracts (types, paths, keys, schemas) → precise. Wiring and handlers → illustrative.

## How to produce the snippet

1. **Explore the codebase, read-only.** Use `Grep`, `Glob`, `Read` (or equivalents). Look for:
   - Hooks/components/modules with similar shape to what's being requested
   - Existing conventions: import paths, naming, type aliases, query key patterns, error handling style
   - The specific files the caller pointed at, if any

   Read at least 2 similar examples before writing. One example is anecdote, two is a pattern.

2. **Read the provided docs.** If an OpenAPI spec is given, look up the actual response shape for the endpoint. If a PRD excerpt is given, extract the UI requirements that constrain the data shape. Don't invent shapes that aren't in the docs.

3. **Write the snippet at the right fidelity.**
   - **Precise mode**: every type pinned, no `...`, imports complete. The reader should be able to copy-paste and have it compile (modulo the surrounding context).
   - **Illustrative mode**: `// ...` placeholders for non-essential logic, comments naming abstractions ("Show toast — abstract away complexity"), `...` for spread-rest where details don't matter.
   - **Either mode**: include comments that explain *why*, not *what*. The code shows what; the comments justify decisions.

4. **Surface concerns as inline prose, not a separate field.** If the snippet has a tradeoff worth flagging ("If profiling finds this too heavy, split into 2 separate query hooks"), add it as a short prose sentence above or below the code block, not as a structured field.

5. **Cite what you leaned on.** At the end of the snippet doc, list:
   - File paths you read for the pattern (e.g. `src/hooks/useTrendingRequest.ts`)
   - Doc URLs you consulted (e.g. OpenAPI spec URL)
   - Similar prior implementations you mirrored

   Citations help reviewers verify the snippet matches reality and help downstream agents follow the same paths.

## Output format

Write to a file at `.specs/<feature-slug>/snippets/<snippet-slug>.md` (or wherever the caller indicates). The file follows this shape:

```markdown
# Snippet: {snippet name}

**Scope:** {1-line description}
**Fidelity:** {precise | illustrative}
**Destined for:** {section of the spec — e.g. "2.2 Client Integration"}

{Optional 1-2 sentence framing prose. Include any concern callouts here.}

\`\`\`{lang}
// the snippet
\`\`\`

{Optional follow-up prose: tradeoffs, deviations from the referenced pattern, integration notes.}

## Grounding

- **Codebase patterns referenced:**
  - `path/to/file.ts` — {what this contributed}
- **Docs consulted:**
  - {URL or path} — {what was extracted}
- **Similar prior implementations:**
  - `path/to/similar.ts` — {why this is similar}
```

Then echo the snippet inline in the response so the caller can read it without opening the file.

## What this skill does not do

- It does not write tests for the snippet.
- It does not commit code to the codebase. Read-only exploration; write-only into the spec workspace.
- It does not return multiple snippets per invocation. One scope, one snippet, one file.
- It does not invent API shapes or types when docs are available — read the docs.
- It does not "complete" illustrative snippets into full implementations. Fidelity stays where the caller asked.
