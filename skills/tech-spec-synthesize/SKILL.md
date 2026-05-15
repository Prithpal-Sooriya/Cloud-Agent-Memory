---
name: tech-spec-synthesize
description: Assemble a final technical specification document in GitHub-flavored Markdown from provided inputs (feature summary, architecture, UI surfaces, analytics, out-of-scope, task breakdown). Use when the user has the pieces of a tech spec ready and wants them combined into a single committable document, or asks to "write up", "synthesize", "assemble", or "draft" a tech spec from prepared inputs.
---

# Tech Spec Synthesize

Assemble a tech spec from prepared inputs into one Markdown file that follows the fixed template.

## When to use

The user has produced (typically by running the upstream skills) the section content — either as files in `.specs/<feature>/` or pasted into the conversation. This skill assembles those pieces into one committable Markdown file.

Expected inputs (each is either a file path or pasted content):

- Feature summary prose
- Architecture (`.specs/<feature>/architecture.md`) with snippet references
- UI surface files (`.specs/<feature>/ui-surfaces/*.md`)
- Snippet files (`.specs/<feature>/snippets/*.md`)
- Analytics events list
- Out-of-scope items
- Task breakdown (`.specs/<feature>/task-breakdown.md`)

This skill does **not** invent any of that. If a section is missing, ask the user for it or tell them which upstream skill to run (`tech-spec-recon`, `tech-spec-architect`, `tech-spec-ui-surfaces`, `tech-spec-snippet`, `tech-spec-decompose`).

## How to assemble

1. **Read `template.md`** next to this file. That is the authoritative shape. Section numbering, heading levels, and the snippet `<details>` pattern are all fixed.

2. **Place each input into its section.** Do not rephrase the user's snippets, decisions, or analytics payloads — copy them verbatim. Light prose smoothing between sections is fine; rewriting content is not.

3. **Strip upstream-skill metadata.** Upstream skill output files include sections meant for review and traceability, not for the final spec. Remove them during assembly:

   - `## Grounding` sections from UI surface files
   - `**Destined for:**` header lines from UI surface and snippet files
   - `**Mode:**`, `## Open questions`, `## Stress-test findings`, `## Proposed options`, and `## Notes` sections from architecture files (these are the architect's working notes; only the decision content is destined for the final spec)
   - `## Sanity check` section from the task-breakdown file (it's a signal for the author, not for the final committable spec)
   - Any `## Grounding` section from snippet files (the framing prose and the code block survive; the citations don't)

   When in doubt: if a section has no analog in the template, it's likely metadata and should be stripped.

4. **Resolve snippet references.** Architecture and UI surface files contain `**Snippet:** see .specs/<feature>/snippets/<slug>.md` references. For each reference:

   a. Read the snippet file.
   b. Extract the code block (between the first `` ``` `` fence and its matching close).
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

5. **Number sections at assembly time.** UI surface files do not declare section numbers (`tech-spec-ui-surfaces` deliberately leaves them out). Assign them in the order the user specifies, or following the template's conventional order:
   - 3.1 = Feature Flags (always first under UI Surfaces, if the feature has an FF)
   - 3.2+ = remaining surfaces in the order the user lists them

   Architecture subsections (`2.1`, `2.2`, ...) come pre-numbered from the architect — keep them as is.

6. **Call out parallelizability explicitly in Task Breakdown phase headings.** Example: `### Phase 2 — UI (parallelisable after phase 1)`. The reader (and downstream agents) needs this signal. Preserve it verbatim from the decompose output.

7. **Additive deviations only.** If the feature genuinely needs a section the template doesn't have (Migration Plan, Backward Compatibility, Rollout Plan, Performance Budget, Security Considerations), add it **after Out of Scope and before Task Breakdown**. Never rearrange or rename the locked sections. If you're adding a section, tell the user why in one sentence.

8. **Output one file.** Name it `tech-spec-{feature-slug}.md` (kebab-case feature name). Write it to the workspace root or wherever the user indicates.

## Snippet fidelity rule

Some snippets pin contracts precisely (types, query keys, storage paths, schemas). Others are illustrative scaffolds with `// ...` comments standing in for full logic. Preserve whichever fidelity the input snippet has — do not "complete" illustrative snippets, and do not strip detail from precise ones.

## What this skill does not do

- It does not write the architecture, generate snippets, or invent task breakdowns. Use the upstream skills for that.
- It does not validate technical correctness. The user (and `grill-me` between phases) does that.
- It does not split output across files. One spec, one Markdown file.
- It does not preserve upstream-skill metadata (Grounding, Mode, Open questions, Sanity check, etc.) in the final spec. Strip them.
- It does not edit snippet contents — only wraps them in `<details>` and resolves the reference. Fidelity of the snippet's code and framing prose is preserved verbatim.
