# Snippets

Generate tech-spec-quality code snippets, grounded in the actual codebase and any provided docs. Each snippet is destined for a `<details>` block inside the spec — not for execution.

One snippet per file. Generate every queued request in this phase.

## Inputs per snippet

At minimum:

- **Scope** — what the snippet is. Examples: "the storage path constant", "the add mutation hook", "the toggle handler for the star icon in Token Details".
- **Purpose** — what role it plays in the spec. Examples: "pin the storage contract", "show how optimistic updates work", "illustrate the wiring, not full styling".

Optionally:

- **Reference docs** — OpenAPI spec URL or path, PRD excerpts, design notes
- **Codebase pointers** — "follow the pattern in `src/features/foo/`" or "this should look like `useTrendingRequest`"
- **Fidelity hint** — "precise" (pin every type) vs "illustrative" (use `...` and comments for non-essential parts)

If fidelity wasn't specified, infer it from the scope: contracts (types, paths, keys, schemas) → precise. Wiring and handlers → illustrative.

## How to produce each snippet

1. **Explore the codebase, read-only.** Use `Grep`, `Glob`, `Read` (or equivalents). Look for:
   - Hooks/components/modules with similar shape to what's being requested
   - Existing conventions: import paths, naming, type aliases, query key patterns, error handling style
   - The specific files pointed at, if any

   Read at least 2 similar examples before writing. One example is anecdote, two is a pattern.

2. **Read the provided docs.** If an OpenAPI spec is given, look up the actual response shape for the endpoint. If a PRD excerpt is given, extract the UI requirements that constrain the data shape. Don't invent shapes that aren't in the docs.

3. **Write the snippet at the right fidelity.**
   - **Precise mode**: every type pinned, no `...`, imports complete. The reader should be able to copy-paste and have it compile (modulo the surrounding context).
   - **Illustrative mode**: `// ...` placeholders for non-essential logic, comments naming abstractions ("Show toast — abstract away complexity"), `...` for spread-rest where details don't matter.
   - **Either mode**: include comments that explain *why*, not *what*. The code shows what; the comments justify decisions.

4. **Surface concerns as inline prose, not a separate field.** If the snippet has a tradeoff worth flagging ("If profiling finds this too heavy, split into 2 separate query hooks"), add it as a short prose sentence above or below the code block, not as a structured field.

5. **Cite what you leaned on.** At the end of the snippet doc, list:
   - File paths you read for the pattern
   - Doc URLs you consulted
   - Similar prior implementations you mirrored

## Output format

Write to `.specs/<feature-slug>/snippets/<snippet-slug>.md`. Shape:

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

Echo the snippet inline after writing the file.

## Do not

- Write tests for the snippet.
- Commit code to the codebase.
- Put multiple snippets in one file.
- Invent API shapes or types when docs are available.
- "Complete" illustrative snippets into full implementations.
