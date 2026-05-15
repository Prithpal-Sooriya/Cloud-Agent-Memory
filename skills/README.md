# Tech Spec Skills

A bundle of six composable skills for authoring technical specifications with an AI agent (Claude Code, Cursor, etc.). Each skill does one thing; together they take you from a PRD/feature description to a final committable Markdown spec.

## Available Skills

Composable skills live under `skills/` and can be fetched directly via raw URL: `https://raw.githubusercontent.com/Prithpal-Sooriya/Cloud-Agent-Memory/main/skills/<skill-name>/SKILL.md`.

When the user asks for a tech spec, run the bundle in this order — each skill writes to `.specs/<feature-slug>/` so the next skill can pick it up. Full step-by-step lives in the repo `README.md`.

- **Tech spec authoring (run in order):**
  - `tech-spec-recon` — read-only codebase exploration → `recon.md`
  - `tech-spec-architect` — architecture decisions (Mode A: propose / Mode B: validate) → `architecture.md`
  - `tech-spec-snippet` — one grounded snippet per invocation; parallelize → `snippets/*.md`
  - `tech-spec-ui-surfaces` — one surface subsection per invocation; parallelize → `ui-surfaces/*.md`
  - `tech-spec-decompose` — phased task breakdown + 2-week sanity check → `task-breakdown.md`
  - `tech-spec-synthesize` — final assembly into one committable Markdown file → `tech-spec-<feature>.md`

**Hard rules when running these skills:**

- Always pass the relevant repo playbook (above) into recon as additional context — the conventions there are authoritative.
- Always pick Mode A or Mode B explicitly for `tech-spec-architect` — never let the agent infer.
- Never skip recon. Every downstream skill grounds its claims in recon's file-path citations.
- If `tech-spec-decompose` flags the spec as borderline or too big, raise the split with the user before running synthesize.

## Install

1. Unzip into your skills directory:
   - **Claude Code**: `~/.claude/skills/` (or `.claude/skills/` in a project)
   - **Cursor / others**: wherever your tool reads skills from
2. Verify each `SKILL.md` is detected by your tool (usually shown in the skill picker or skill list)
3. No additional dependencies — these are pure markdown instructions

That's it. The skills are read-only on the codebase and write-only into a `.specs/` directory of your choice.

## How to use — the full workflow

The skills are designed to run in order, with `grill-me` (or any back-and-forth) between phases for iteration. A typical run for a new feature:

```
PRD / feature description
        ↓
┌──────────────────────────────────────┐
│  1. tech-spec-recon                  │  Explore codebase → recon.md
└──────────────────────────────────────┘
        ↓ (grill-me: anything missing from recon?)
┌──────────────────────────────────────┐
│  2. tech-spec-architect (Mode A or B)│  Architecture decisions → architecture.md
└──────────────────────────────────────┘
        ↓ (architect queues snippet requests)
┌──────────────────────────────────────┐
│  3. tech-spec-snippet (×N parallel)  │  Hooks/contracts → snippets/*.md
└──────────────────────────────────────┘
        ↓ (grill-me: are the snippets right?)
┌──────────────────────────────────────┐
│  4. tech-spec-ui-surfaces (×N //)    │  Each surface → ui-surfaces/*.md
└──────────────────────────────────────┘
        ↓ (may queue more snippet requests for wiring)
┌──────────────────────────────────────┐
│  5. tech-spec-decompose              │  Task breakdown → task-breakdown.md
└──────────────────────────────────────┘
        ↓ (grill-me: is the 2-week verdict accurate?)
┌──────────────────────────────────────┐
│  6. tech-spec-synthesize             │  Final assembly → tech-spec-<feature>.md
└──────────────────────────────────────┘
```

### Step-by-step, with example prompts

**Step 1: Recon.** Hand the agent your PRD or a paragraph describing the feature plus its surfaces.

> "Run tech-spec-recon for a new Watchlist feature. PRD: [link]. Surfaces touched: Token Details page, Homepage, Swap/Bridge picker. Look for reusable components, established conventions, and any gaps we'll need to fill."

Verify the four buckets (Reuse / Conventions / Infrastructure / Gaps) are populated and every claim has a file-path citation. If recon misses something you know is in the codebase, ask the agent to look at the specific path.

**Step 2: Architect.** Pass the recon output and pick a mode.

> "Run tech-spec-architect in Mode A using `.specs/watchlist/recon.md`. The feature is [paste 1-paragraph context]. I expect most decisions to be obvious-choice but flag the storage class (E2EE vs AUS) as a genuine choice."

Or Mode B if you have an architecture in mind:

> "Run tech-spec-architect in Mode B. Recon is at `.specs/watchlist/recon.md`. My proposed architecture: [paste]. Stress-test this."

Resolve any "Open questions" before moving on. Don't generate snippets for unresolved decisions.

**Step 3: Snippets.** The architect output includes snippet requests. Run them — in parallel where your tool supports it.

> "Run tech-spec-snippet for each of these in parallel: [list]. Use the architecture and recon documents in `.specs/watchlist/`."

Or invoke one at a time if you prefer to review each before moving on.

**Step 4: UI Surfaces.** One invocation per surface. Easy to parallelize.

> "Run tech-spec-ui-surfaces for these 5 surfaces in parallel: Token Details, Homepage Section, Full-screen Watchlist, Swap/Bridge Pill, Explore Trending Tokens. Use the recon, architecture, and snippets in `.specs/watchlist/`. Notes on each: [optional caller notes]."

**Step 5: Decompose.** Once everything upstream is settled.

> "Run tech-spec-decompose using everything in `.specs/watchlist/`. Out of Scope items: [list]. Phase 3 analytics review owner: @Person."

Read the 2-week sanity check carefully. If it flags borderline-too-big or too-big, take the recommendation seriously — splitting a spec is almost always cheaper than shipping one that's too large.

**Step 6: Synthesize.** Final assembly.

> "Run tech-spec-synthesize on `.specs/watchlist/`. Output to `tech-spec-watchlist.md` in the repo root."

Review the final document end-to-end. Confirm `<details>` blocks render correctly when committed (GitHub preview is the truth).

## Checklist

Print this and tick boxes as you go.

### Before you start

- [ ] You have a PRD or a 1-paragraph feature description that names the surfaces touched
- [ ] You know which team / stakeholders own this feature (for analytics review, storage decisions, etc.)
- [ ] You're working in a codebase your agent can read (Read/Grep/Glob access)
- [ ] You've created a `.specs/<feature-slug>/` directory or decided where outputs will live

### Phase 1: Recon (`tech-spec-recon`)

- [ ] Ran recon with the feature context as input
- [ ] Output has all four buckets: Reuse, Conventions, Existing Infrastructure, Gaps
- [ ] Every claim has at least one file-path citation
- [ ] Conventions section has at least two examples each (one example = not a convention)
- [ ] Gaps section names things genuinely missing — not things you didn't look for
- [ ] You've spot-checked 2-3 cited file paths to confirm recon read real code
- [ ] Optionally: ran `grill-me` to challenge anything the recon claims

### Phase 2: Architecture (`tech-spec-architect`)

- [ ] Picked a mode: A (propose) or B (validate) — _explicitly told the agent which_
- [ ] If Mode A: reviewed each proposed-options block and made a decision before snippet generation
- [ ] If Mode B: all contradictions with recon are surfaced (not silently overridden) — open questions resolved before proceeding
- [ ] Architecture has the "Top-level decision" sentence naming the main building blocks
- [ ] Each numbered subsection has a clear contract pin (data shape / endpoint / type / library choice)
- [ ] No snippets generated for unresolved decisions
- [ ] Optionally: ran `grill-me` on the architecture document

### Phase 3: Snippets (`tech-spec-snippet`)

- [ ] One invocation per snippet (parallel where supported)
- [ ] Each snippet's fidelity matches its purpose:
  - Contract-pinning snippets (types, query keys, paths, schemas) are precise
  - Wiring/handler snippets are illustrative with `// ...` placeholders
- [ ] Each snippet has a `## Grounding` section citing the files it leaned on
- [ ] Hypothetical or invented file paths flagged and replaced with real ones if generated against a real codebase
- [ ] Optionally: ran `grill-me` to challenge whether the snippet matches the codebase's actual patterns

### Phase 4: UI Surfaces (`tech-spec-ui-surfaces`)

- [ ] One invocation per surface (parallel where supported)
- [ ] Each surface file has Hooks / Components / Interactions sections populated
- [ ] Reuse callouts match real entries in recon's _Reuse_ bucket
- [ ] Snippets invoked only where there's non-obvious wiring (toggle handlers, FF selectors with version gating)
- [ ] Analytics events name the event and the source value explicitly
- [ ] No section numbers hardcoded (synthesize assigns them at assembly time)

### Phase 5: Decompose (`tech-spec-decompose`)

- [ ] Decompose has 4 phases (drop one only if the feature genuinely doesn't need it)
- [ ] Phase 1 item count matches the number of hooks/modules in architecture
- [ ] Phase 2 item count matches the number of UI surface files
- [ ] Phase 2 heading includes "(parallelisable after phase 1)" — preserve this exact phrasing
- [ ] Phase 3 mentions the analytics review owner by name
- [ ] Sanity check read carefully: green / borderline / red
- [ ] If borderline or red: discussed split recommendations with the team before continuing
- [ ] No Out-of-Scope items leaked into phases

### Phase 6: Synthesize (`tech-spec-synthesize`)

- [ ] Synthesize completed without errors and produced one `tech-spec-<feature>.md` file
- [ ] Section ordering matches the template: Summary → Architecture → UI Surfaces → Analytics → Out of Scope → (optional additive sections) → Task Breakdown
- [ ] All snippet references resolved into inline `<details>` blocks (no leftover `**Snippet:** see ...` lines)
- [ ] Upstream metadata stripped: no `## Grounding`, no `## Open questions`, no `## Sanity check`, no `**Destined for:**`, no `**Mode:**`
- [ ] `<details>` blocks have one blank line after `</summary>` (required for GitHub-flavored Markdown rendering)
- [ ] Previewed the final file in GitHub (or your platform's Markdown renderer) — every code block opens, every list renders, no broken nesting
- [ ] Task Breakdown phase headings preserved verbatim, including the parallelizability callout

### Before opening the PR

- [ ] Skimmed the whole document top to bottom — does it read like a spec a human wrote?
- [ ] Stakeholders mentioned by name in the doc have been notified or are ready to review
- [ ] Any "build new" components or new infrastructure are flagged for design / platform team awareness
- [ ] Open questions (if any) explicitly listed in a section the reviewer will see
- [ ] Out of Scope reads as a list of _deliberate_ cuts with one-line reasons — not "we forgot about X"

## Tips for getting good output

- **Be specific about mode.** For `tech-spec-architect`, always say "Mode A" or "Mode B" explicitly. The skill defaults to asking, which slows you down.
- **Parallelize where your tool supports it.** Snippets and UI surfaces are independent — running them in parallel saves real time on a large feature.
- **Use `grill-me` between phases.** Each skill produces a tangible artifact; `grill-me` (or any pushback) catches errors before they propagate downstream.
- **Trust the 2-week sanity check.** If decompose flags the spec as too big, it almost always is. Splitting earlier is cheaper than splitting after the spec is written.
- **Don't skip recon.** Every downstream skill is grounded in recon's findings. Skipping it means architects/snippets/surfaces have to invent context — and inventions are how hallucinated file paths and made-up patterns sneak in.

## Design rationale (skip unless you want to modify the skills)

A few design choices that aren't obvious from the skills themselves:

- **Why six skills, not one mega-skill?** A single 800-line orchestrator skill is harder to trigger reliably and harder to test in isolation. Small focused skills with tight descriptions trigger correctly more often and can be replaced one at a time.
- **Why one snippet per invocation?** Lets the host (Claude Code, etc.) decide parallelism. The same logic applies to UI surfaces.
- **Why a fixed template (`tech-spec-synthesize/template.md`)?** Tech spec format is the secret sauce of a team's authoring discipline. Letting the agent invent the format every time produces inconsistent specs that are harder to review. The template is the lock; surfaces and architecture fill in the structure.
- **Why `<details>` for snippets?** Long snippets dominate the visual real estate of a spec when they're not collapsible. Collapsing them by default lets a reviewer skim the structure first and dive into code only where relevant.
- **Why no effort estimates?** Estimation is the team's job at sprint planning time, not the spec author's. The 2-week sanity check is a smell test for spec _size_, not an estimate of _effort_.
- **Why Mode A and Mode B in architect?** The two modes use most of the same machinery but produce different artefacts (proposed options + recommendation vs. stress-test + writeup). Separating them lets the user opt into the right shape — proposing options when they don't have an architecture yet, validating when they do.

## Extending or modifying

- **Adding a new section to specs**: edit `tech-spec-synthesize/template.md` _and_ the SKILL.md's "additive deviations" rule. Both should be consistent.
- **Changing snippet format**: edit the output-format section of `tech-spec-snippet/SKILL.md`. The downstream `synthesize` skill reads snippet files generically (extracts the first code block and framing prose), so most format changes are backward-compatible.
- **Adding a new phase to the task breakdown**: edit `tech-spec-decompose/SKILL.md`'s phase convention section. Keep numbering stable.
- **Replacing one skill entirely**: each skill has well-defined inputs and outputs (file locations and shapes), so swapping in a different implementation of e.g. `tech-spec-architect` should work as long as it produces a compatible `architecture.md`.

## Troubleshooting

- **"Skill didn't trigger when I asked."** Check the skill's frontmatter description — does it match the phrasing you used? If your tool's skill picker shows the skill but the agent didn't use it, prompt more explicitly: "Use tech-spec-recon to..."
- **"Snippets contain hallucinated file paths."** Your tool may not have codebase read access, or recon was skipped. Recon's citations are the foundation that snippets build on.
- **"Synthesize produced a malformed document."** Check that all upstream files exist in `.specs/<feature>/` and that snippet references in architecture/UI surface files point to files that exist. If a referenced snippet file is missing, synthesize will leave the `**Snippet:** see ...` line in place instead of resolving it.
- **"The 2-week sanity check feels wrong for our team."** The heuristic is calibrated for a small team. For a larger team that can fully parallelize Phase 2, the verdict will skew conservative. Take it as a smell test, not a directive.
