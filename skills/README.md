# Tech Spec Skill

One skill that takes a PRD/feature description through to a final committable Markdown spec. Teammates run **one** skill session; the agent grills unresolved decisions, then walks the pipeline.

`react-compiler-migration` is separate and unrelated.

## Install

1. Copy `skills/tech-spec/` into your skills directory:
   - **Claude Code**: `~/.claude/skills/tech-spec/` (or `.claude/skills/tech-spec/` in a project)
   - **Cursor / others**: wherever your tool reads skills from
2. Verify `tech-spec/SKILL.md` is detected (skill picker or skill list)
3. No additional dependencies — markdown instructions plus phase reference files

The skill is read-only on the codebase and write-only into `.specs/` plus the final spec file.

## How to use

Point the agent at a PRD or a paragraph describing the feature (and the surfaces it touches), then ask it to write a tech spec / implementation plan.

> "Write a tech spec for Watchlist. PRD: [link]. Surfaces: Token Details, Homepage, Swap/Bridge picker."

That's enough. The skill will grill anything still forked (Mode A vs B, v1 cuts, stakeholders), then run the rest.

```
PRD / feature description
        ↓
┌──────────────────────────────────────┐
│  Intake grill                        │  One question at a time; recommend answers
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│  Recon                               │  Explore codebase → recon.md
└──────────────────────────────────────┘
        ↓ (gate: anything missing?)
┌──────────────────────────────────────┐
│  Architecture (Mode A or B)          │  Decisions → architecture.md
└──────────────────────────────────────┘
        ↓ (gate: genuine choices / open questions resolved)
┌──────────────────────────────────────┐
│  Snippets                            │  Hooks/contracts → snippets/*.md
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│  UI Surfaces                         │  Each surface → ui-surfaces/*.md
└──────────────────────────────────────┘
        ↓ (gate: reuse vs build-new, V1 cuts)
┌──────────────────────────────────────┐
│  Decompose                           │  Task breakdown → task-breakdown.md
└──────────────────────────────────────┘
        ↓ (gate: if borderline/too-big, stop and split)
┌──────────────────────────────────────┐
│  Synthesize                          │  Final assembly → tech-spec-<feature>.md
└──────────────────────────────────────┘
```

Intermediate files live under `.specs/<feature-slug>/` so you can inspect a phase, resume later, or ask the agent to redo one step without restarting.

### Resume / redo

If `.specs/<feature-slug>/` already has artifacts, the skill resumes from the first missing phase. To redo a phase, delete (or ask the agent to rewrite) that artifact and continue.

## What to pass in

Minimum:

- A PRD, recording, or 1-paragraph feature description
- Surfaces touched

Helpful if you have them (otherwise the intake grill will ask):

- Mode A (propose architecture) or Mode B (validate yours)
- Out of Scope / v1 cuts
- Stakeholders (analytics review owner, storage/platform)
- Repo playbook / `AGENTS.md` — conventions there are authoritative for recon

**Hard rules baked into the skill:**

- Never skip recon
- Always pick Mode A or Mode B explicitly — the agent must not infer
- If decompose flags borderline or too-big, raise the split before synthesizing

## Checklist

Use this while reviewing the run, not as a second skill to invoke.

### Before you start

- [ ] You have a PRD or a 1-paragraph feature description that names the surfaces touched
- [ ] You know which team / stakeholders own this feature (for analytics review, storage decisions, etc.)
- [ ] You're working in a codebase your agent can read (Read/Grep/Glob access)

### Intake grill

- [ ] Mode A or B was chosen explicitly
- [ ] v1 Out of Scope named (or explicitly "none yet")
- [ ] Architecture forks the code cannot answer were named (storage class, new vs reuse, FF strategy)

### Recon

- [ ] Output has all four buckets: Reuse, Conventions, Existing Infrastructure, Gaps
- [ ] Every claim has at least one file-path citation
- [ ] Conventions section has at least two examples each (one example = not a convention)
- [ ] Gaps section names things genuinely missing — not things the agent didn't look for
- [ ] You've spot-checked 2-3 cited file paths to confirm recon read real code

### Architecture

- [ ] If Mode A: each genuine choice was picked before snippets
- [ ] If Mode B: contradictions with recon were surfaced (not silently overridden) — open questions resolved
- [ ] Architecture has the "Top-level decision" sentence naming the main building blocks
- [ ] Each numbered subsection has a clear contract pin (data shape / endpoint / type / library choice)
- [ ] No snippets generated for unresolved decisions

### Snippets

- [ ] Each snippet's fidelity matches its purpose:
  - Contract-pinning snippets (types, query keys, paths, schemas) are precise
  - Wiring/handler snippets are illustrative with `// ...` placeholders
- [ ] Each snippet has a `## Grounding` section citing the files it leaned on
- [ ] Hypothetical or invented file paths flagged and replaced with real ones

### UI Surfaces

- [ ] Each surface file has Hooks / Components / Interactions sections populated
- [ ] Reuse callouts match real entries in recon's *Reuse* bucket
- [ ] Snippets only where there's non-obvious wiring (toggle handlers, FF selectors with version gating)
- [ ] Analytics events name the event and the source value explicitly

### Decompose

- [ ] Four phases (drop one only if the feature genuinely doesn't need it)
- [ ] Phase 1 item count matches the number of hooks/modules in architecture
- [ ] Phase 2 item count matches the number of UI surface files
- [ ] Phase 2 heading includes "(parallelisable after phase 1)" — preserve this exact phrasing
- [ ] Phase 3 mentions the analytics review owner by name
- [ ] Sanity check read carefully: green / borderline / red
- [ ] If borderline or red: discussed split recommendations before synthesizing
- [ ] No Out-of-Scope items leaked into phases

### Synthesize

- [ ] Produced one `tech-spec-<feature>.md` file
- [ ] Section ordering matches the template: Summary → Architecture → UI Surfaces → Analytics → Out of Scope → (optional additive sections) → Task Breakdown
- [ ] All snippet references resolved into inline `<details>` blocks (no leftover `**Snippet:** see ...` lines)
- [ ] Upstream metadata stripped: no `## Grounding`, no `## Open questions`, no `## Sanity check`, no `**Destined for:**`, no `**Mode:**`
- [ ] `<details>` blocks have one blank line after `</summary>` (required for GitHub-flavored Markdown rendering)
- [ ] Previewed the final file in GitHub (or your platform's Markdown renderer)

### Before opening the PR

- [ ] Skimmed the whole document top to bottom — does it read like a spec a human wrote?
- [ ] Stakeholders mentioned by name in the doc have been notified or are ready to review
- [ ] Any "build new" components or new infrastructure are flagged for design / platform team awareness
- [ ] Open questions (if any) explicitly listed in a section the reviewer will see
- [ ] Out of Scope reads as a list of *deliberate* cuts with one-line reasons — not "we forgot about X"

## Tips

- **Be specific about mode** if you already know it. Saves a grill turn.
- **Trust the 2-week sanity check.** If decompose flags the spec as too big, it almost always is. Splitting earlier is cheaper than splitting after the spec is written.
- **Don't skip recon.** Skipping it means architecture/snippets/surfaces invent context — and inventions are how hallucinated file paths sneak in.
- **Inspect `.specs/` between gates** if you want a tighter review loop; the skill already pauses at the important ones.

## Layout

```
skills/tech-spec/
  SKILL.md          Orchestrator: intake, grill, pipeline, gates
  recon.md          Phase instructions
  architect.md
  snippets.md
  ui-surfaces.md
  decompose.md
  synthesize.md
  template.md       Locked final-spec shape
```

Phase detail lives in those reference files so the orchestrator stays small. The agent reads the next file only when it enters that phase.

## Design rationale

- **Why one skill now?** The old split (six skills + grill-me) was easier to test in isolation but harder to share: teammates had to learn the order, the gates, and which prompt to paste next. One session with explicit gates is the thing you actually want to port.
- **Why still write intermediate files?** So you can review recon before architecture poisons the spec, resume a mid-flight run, and redo one phase without regenerating everything.
- **Why progressive disclosure?** A single 800-line skill is worse at triggering and wastes context. `SKILL.md` is the pipeline; phase files load on demand.
- **Why a fixed template?** Tech spec format is the team's authoring discipline. Letting the agent invent the format every time produces inconsistent specs that are harder to review.
- **Why `<details>` for snippets?** Long snippets dominate visual real estate when they're not collapsible.
- **Why no effort estimates?** Estimation is the team's job at sprint planning. The 2-week sanity check is a smell test for spec *size*, not effort.
- **Why Mode A and Mode B?** Same machinery, different artefacts (proposed options + recommendation vs. stress-test + writeup). The user opts into the right shape.

## Extending or modifying

- **Adding a new section to specs**: edit `tech-spec/template.md` *and* the additive-deviations rule in `synthesize.md`. Both should be consistent.
- **Changing snippet format**: edit `snippets.md`. Synthesize reads snippet files generically (first code block + framing prose), so most format changes are backward-compatible.
- **Adding a new phase to the task breakdown**: edit `decompose.md`. Keep numbering stable.
- **Tightening/loosening grill**: edit the Grill protocol and gate sections in `SKILL.md`.

## Troubleshooting

- **"Skill didn't trigger when I asked."** Prompt more explicitly: "Use the tech-spec skill to..."
- **"Snippets contain hallucinated file paths."** Recon was skipped or the tool has no codebase read access. Recon's citations are the foundation.
- **"Synthesize produced a malformed document."** Check that all upstream files exist in `.specs/<feature>/` and that snippet references point at files that exist.
- **"The 2-week sanity check feels wrong for our team."** The heuristic is calibrated for a small team. For a larger team that can fully parallelize Phase 2, the verdict will skew conservative. Take it as a smell test, not a directive.
- **"The agent grilled forever and never started recon."** Intake grill should only cover forks the code cannot answer. Ask it to proceed to recon; missing conventions get settled there.
