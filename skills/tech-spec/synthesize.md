# Synthesize

Assemble a tech spec from prepared inputs into one Markdown file that follows the fixed template.

## Inputs

Each is a file under `.specs/<feature>/` (or pasted content):

- Feature summary prose (from intake / PRD — write it now if it doesn't exist as a file)
- Architecture (`.specs/<feature>/architecture.md`) with snippet references
- UI surface files (`.specs/<feature>/ui-surfaces/*.md`)
- Snippet files (`.specs/<feature>/snippets/*.md`)
- Analytics events list (from surfaces + intake)
- Out-of-scope items
- Task breakdown (`.specs/<feature>/task-breakdown.md`)

Do **not** invent any of that. If a section is missing, go back to the phase that owns it.

## How to assemble

1. **Read `template.md`** next to this file. That is the authoritative shape. Section numbering, heading levels, and the snippet `<details>` pattern are all fixed.

2. **Place each input into its section.** Do not rephrase the user's snippets, decisions, or analytics payloads — copy them verbatim. Light prose smoothing between sections is fine; rewriting content is not.

3. **Strip upstream metadata.** Intermediate files include sections meant for review and traceability, not for the final spec. Remove them during assembly:

   - `## Grounding` sections from UI surface and snippet files
   - `**Destined for:**` header lines from UI surface and snippet files
   - `**Mode:**`, `## Open questions`, `## Stress-test findings`, `## Proposed options`, and `## Notes` sections from architecture files (working notes; only the decision content is destined for the final spec)
   - `## Sanity check` section from the task-breakdown file (signal for the author, not for the committable spec)

   When in doubt: if a section has no analog in the template, it's likely metadata and should be stripped.

4. **Resolve snippet references.** Architecture and UI surface files contain `**Snippet:** see .specs/<feature>/snippets/<slug>.md` references. For each reference:

   a. Read the snippet file.
   b. Extract the code block (between the first fenced block and its matching close).
   c. Extract the framing prose (anything between the metadata header lines and the code block).
   d. Replace the `**Snippet:** see ...` line with a `<details>` block:

   ```html
   <details>
   <summary>{Snippet name — from the snippet file's H1, dropping the "Snippet: " prefix}</summary>

   {framing prose, if any}

   ```{lang}
   {code block}
   ```

   </details>
   ```

   Leave one blank line after `</summary>` — GitHub-flavored Markdown needs it for the fenced block inside to render. Strip the snippet file's `## Grounding` section before extraction; it does not appear in the final spec.

   If a referenced snippet file is missing, leave the `**Snippet:** see ...` line in place rather than inventing code.

5. **Number sections at assembly time.** UI surface files do not declare section numbers. Assign them in the order the user specifies, or following the template's conventional order:
   - 3.1 = Feature Flags (always first under UI Surfaces, if the feature has an FF)
   - 3.2+ = remaining surfaces in the order the user lists them

   Architecture subsections (`2.1`, `2.2`, ...) come pre-numbered from architecture — keep them as is.

6. **Call out parallelizability explicitly in Task Breakdown phase headings.** Example: `### Phase 2 — UI (parallelisable after phase 1)`. Preserve it verbatim from the decompose output.

7. **Additive deviations only.** If the feature genuinely needs a section the template doesn't have (Migration Plan, Backward Compatibility, Rollout Plan, Performance Budget, Security Considerations), add it **after Out of Scope and before Task Breakdown**. Never rearrange or rename the locked sections. If you're adding a section, tell the user why in one sentence.

8. **Output one file.** Name it `tech-spec-{feature-slug}.md` (kebab-case feature name). Write it to the workspace root or wherever the user indicates.

## Snippet fidelity rule

Some snippets pin contracts precisely (types, query keys, storage paths, schemas). Others are illustrative scaffolds with `// ...` comments standing in for full logic. Preserve whichever fidelity the input snippet has — do not "complete" illustrative snippets, and do not strip detail from precise ones.

## Do not

- Write architecture, generate snippets, or invent task breakdowns.
- Validate technical correctness — that happened at the gates.
- Split output across files. One spec, one Markdown file.
- Preserve upstream metadata (Grounding, Mode, Open questions, Sanity check, etc.) in the final spec.
- Edit snippet contents — only wrap them in `<details>` and resolve the reference.
