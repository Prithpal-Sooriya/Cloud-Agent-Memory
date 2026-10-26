# Meta-memory — curation lessons

Memory about the memory. Each entry is a pattern the curator (Prithpal) has repeatedly accepted or rejected on past `memory: curate …` PRs. Audit reads this file before judging proposals ([audit.md](audit.md) §2.6 `low-value`); [learn.md](learn.md) keeps it current.

Ground truth is the **reviewer's verdict on a curation PR**, not the issue's close state — issues closed by hand (e.g. after #270) show `COMPLETED` even though nothing merged. Rank signals:

1. Inline review comment on a curation PR: `skip`, `remove`, `too specific`, `too scoped` → negative.
2. Issue closed `NOT_PLANNED` → negative.
3. Issue in the Applied section of a **merged** curation PR whose bullet survived to `main` → positive.
4. Reviewer question ("global rule?", "convert to a skill?") → routing hint, not a verdict.

## Ledger

```
last_reviewed_pr: 317
last_reviewed_at: 2026-10-26
```

[learn.md](learn.md) only scans curation PRs and issue closures newer than this marker, then bumps it.

## Reject patterns (`OPT_OUT (low-value: <meta-id>)`)

- [meta-001] **Agent-harness guard workarounds.** Recipes for getting past a sandbox's git/commit guard: pi-harness guard, GPG signing, git-plumbing commits, GitHub-API commits, `--author` blocks, `--`-prefixed session dirs. Harness-specific, churns weekly, owner handles it out-of-band ("Remove GPG stuff, I'll try to figure something out here").
  - Evidence: #147, #157, #156, #171, #182, #204, #247; PR #151 (pi-guard bullets removed), PR #201 (`ts-006` removed).
- [meta-002] **Local machine / workspace repair.** Fixing one dev box or a fresh agent workspace: broken corepack shim, Homebrew Node path vs nvm, cloning `node_modules` from a sibling workspace when the disk is full, install-first bootstrap for a new workspace.
  - Evidence: #146, #174, #190, #218.
- [meta-003] **Agent-tooling mechanics.** How to drive Kandev/MCP/agent tools (reporting args, dead sessions, card moves, reading memory without MCP, recovering prompt attachments from the Kandev DB). Belongs in the tool's own docs or a skill, not a repo playbook.
  - Evidence: #144, #158, #216.
- [meta-004] **Too specific / one-off facts.** Internals of one function, one library version, or one incident that the next agent is unlikely to hit: `tldts` 7.x internals, `executeAssetsPipeline` swallowing errors, native-asset zero-address fallback, preview-only state fields of one release, a single crash's build vintage. Test: would this help a *different* task in the same repo next month? If not, reject.
  - Evidence: #143, #152, #197, #217, #239; PR #200 and PR #201 ("Remove, too specific." ×17); PR #269 ("Please remove, too scoped." on `code-002`, #232); #277 (PR #317, "remove this, we'll only add this back if this is raised again."); #300 (PR #315, "You can remove this, we've moved to vitest!").
- [meta-005] **Fork-based workflows.** Pushing via forks, fork remotes, SSH transport for fork workflow-file pushes. Owner direction: "remove, we will not use forks now".
  - Evidence: #145, #219, #220; PR #269.
- [meta-006] **Restating what a linter/formatter already enforces.** Lists of lint violations to fix, import-style rules the linter flags. The tool is the source of truth; memory adds nothing.
  - Evidence: #188, #196; PR #269 ("Thoughts on combining this with any existing lint rules?").
- [meta-007] **Known flakes and generic shell hygiene.** "Rerun, don't bisect" for a flaky shard; `$?` after a pipe. Not repo knowledge.
  - Evidence: #164, #173.
- [meta-008] **Routine merge/test chores.** "Update the `.snap`, don't fight it", deep-equal check after a hand-resolved locale merge, mock-vs-wrap for one hook in one suite.
  - Evidence: #208, #250, #251; PR #271 (`skip` on `ts-019`…`ts-023`).

## Accept patterns (lean `APPLY`)

- [meta-101] **Gates the repo enforces in CI or review.** Pre-push checks, required changelog entries, format/lint commands that agents keep missing.
  - Evidence: #149, #150 — PR #151 kept only these (`shr-002` `format:check` gate, `shr-006` `CHANGELOG.md` pre-push gate) after every TS add was removed.
- [meta-102] **Process rules that change agent behaviour across tasks.** Scope discipline, verifying remote state before push, vacuous-verification traps, reading playbooks in full, shared mutable state across concurrent sessions.
  - Evidence: #237, #238, #241 (PR #269); #252, #254 (PR #271).

## Routing hints (do not opt out; add a `_judgement:_` note in the PR body)

- [meta-201] **Repo-agnostic guidance in a repo playbook.** If the rule would hold for any repo, note "candidate for global `Memory.md`" on the row. The reviewer asked this on PR #269 and PR #271.
- [meta-202] **Multi-step procedural recipes.** If the bullet is a recipe with more than ~4 steps, or it belongs to an existing skill (e.g. walkthrough videos → `explain-video`), note "candidate for a skill". The reviewer asked this on PR #201 and PR #271; PR #315 applied the 6-step messenger-action recipe (#298, `shr-007`) as an UPDATE with this note.

## Entry format

```
- [meta-NNN] **<pattern name>.** <one-paragraph rule, including the test the auditor applies>.
  - Evidence: #<issue>, …; PR #<pr> (<quoted reviewer verdict>).
```

IDs: reject `meta-001…099`, accept `meta-101…199`, routing `meta-201…299`. Next ID = max in band + 1. Same ACE rule as the playbooks: never delete; UPDATE an entry when the curator's taste shifts and cite the PR that shifted it.
