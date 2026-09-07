---
name: update-memory
description: Batch-apply open `memory-update` GitHub issues on Prithpal-Sooriya/Cloud-Agent-Memory into a single reviewable PR that edits the ACE playbook files (Memory.md, MetaMask/*.md) and whose description doubles as the audit trail (applied issues auto-close on merge; opted-out issues remain open with a stated reason). Runs unattended end-to-end — the agent decides every verdict itself and the draft PR is the only human gate. Use when the user asks to update memory, audit, curate, triage, batch-apply, or merge memory-update issues, or mentions the memory delta backlog, ACE playbook updates, or closing memory issues via PR.
---

# Update Memory

Batch-triage open `memory-update` issues, audit each proposal against the current playbooks, apply the ones that survive, and open one draft PR per repo playbook whose body records **every** issue examined — applied ones with `Closes #N` (auto-close on merge), opted-out ones with a bare `#N` reference and a one-line reason.

The skill runs **end-to-end without stopping for approval**. It judges every proposal itself, applies the survivors, and lands the batch as a draft PR — that PR is the review surface. Do not ask the user to sign off on verdicts mid-run.

## Hard rules

- **Never DELETE.** Per ACE (`Memory.md` §"Curate a Delta Update"), obsolete entries are UPDATE'd, not removed.
- **Never invent bullets.** Every applied line traces back to an issue body's `Proposed Entry` block, with the placeholder ID substituted for a real one.
- **Never mix repo labels in one PR.** One branch and one PR per target playbook (`metamask-core`, `metamask-extension`, `metamask-mobile`, or the global `Memory.md`). Cross-cutting changes are the human's call, not the skill's.
- **Never `Closes #N` an opted-out issue.** The Applied and Opted-out sections of the PR body must be disjoint. The renderer fails loud if they overlap.
- **Always open a draft PR.** The human's only gate is the PR review. No auto-merge, no non-draft PRs from this skill.
- **Never pause for approval.** Every verdict is the skill's own call, decided by the rules in [audit.md](audit.md). Ambiguity is resolved by the documented tiebreakers, recorded in the PR body, and flagged in the review checklist — not escalated mid-run. Stop only for a hard blocker (wrong repo, missing write PAT, dirty tree, unreachable origin), and report it.
- **Triage and audit stay read-only.** They only read files and run `gh` queries; the first mutation happens in Apply. That is a sequencing property, not an approval checkpoint.
- **Follow `[shr-005]` for `gh` writes on cloud VMs.** Prefix every write with `GH_TOKEN="$CLOUD_AGENT_WRITE_ISSUES_PAT"` — the default cloud `gh` auth is read-only and silently returns placeholder rows for search endpoints.
- **Author every commit per `[shr-001]`.** `--author="Prithpal Sooriya <prithpal.sooriya@gmail.com>"`.
- **Compress prose before committing.** Every applied bullet passes through the concision rules in [style.md](style.md). Technical substance stays byte-exact (commands, paths, addresses, error strings, URLs, IDs, code fences); prose fluff is cut. See [apply.md](apply.md) §4.3.

## Workspace

Runs inside a clone of `Prithpal-Sooriya/Cloud-Agent-Memory`. The skill mutates only:

```
Memory.md                             ← global playbook (SHR/TS entries here)
MetaMask/metamask-core.md             ← repo playbook
MetaMask/metamask-extension.md        ← repo playbook
MetaMask/metamask-mobile.md           ← repo playbook
```

If invoked from a different repo, stop and report — the skill has no work to do.

## Pipeline

Copy this checklist and keep it updated in your working notes:

```
Memory curation progress:
- [ ] Intake (confirm repo + write auth)
- [ ] Triage (list + parse open memory-update issues)
- [ ] Audit (dedupe / target-id / section / evidence / style)
- [ ] Verdicts logged (table printed for the record — no approval wait)
- [ ] Apply (branch, edit, compress-to-style, commit — per repo label)
- [ ] PR (push, open draft, verify body invariant)
```

### 1. Intake

Confirm three things before any tool call that writes:

1. **Working directory is `Prithpal-Sooriya/Cloud-Agent-Memory`.** Run `git remote -v` and check the origin. If it's a different repo, stop.
2. **Write auth is available.** Try `gh auth status` — if the token is read-only (`cursor` login, `ghs_…` token), export `GH_TOKEN="$CLOUD_AGENT_WRITE_ISSUES_PAT"` for the session. If the PAT env var is missing, stop and report — this is a blocker the skill cannot work around.
3. **Working tree is clean.** `git status --porcelain` must be empty. The skill creates its own branches; it will not stack curation on top of a dirty tree.

Also read `Memory.md` §"Agentic Memory Update Process" once (lines 40-165 in the current file) to re-anchor on the ACE rules the skill is enforcing. That section is authoritative — if the skill's hard rules ever diverge from it, the Memory file wins and the skill needs updating.

### 2. Triage

Read [triage.md](triage.md). Produce a struct per open issue and group by repo label. Echo a compact table:

```
#89 [extension] ADD  TS   [ts-NEW]      "assets-unify-state hide invariant"
#88 [extension] ADD  TS   [ts-NEW]      "Corepack download prompt hangs yarn install"
#87 [extension] UPDATE SHR [shr-002]    "traceability needs a fallback"
...
```

### 3. Audit

Read [audit.md](audit.md). For each issue emit `APPLY` or `OPT_OUT (reason)`. Standard opt-out reasons:

- **`dedupe`** — another open issue proposes the same insight; keep the higher-quality one and cite the duplicates.
- **`stale-target`** — UPDATE names a target ID that no longer exists in the target file.
- **`invalid-section`** — proposed Section is not one of `SHR | CODE | TS`, or does not exist in the target file yet (section creation is a human call, not a batch call).
- **`no-evidence`** — Evidence block is empty and Reasoning is thin. Cloud agents are required to cite; a proposal without an anchor is not applied.
- **`contradicts-existing`** — Proposed entry contradicts an existing rule without explaining why. Author must revise the issue.
- **`out-of-scope`** — Proposal targets a file the skill does not own (e.g., a new `MetaMask/*.md`) or a repo label not on the allowlist.

Every opt-out MUST cite the exact reason and, where relevant, the sibling issue or existing bullet it collides with.

### 4. Log the verdicts and keep going

Print the full verdict table so the run has a visible trail, then continue straight to Apply. No approval wait.

Judgement calls the skill makes on its own:

- Which of two duplicate proposals is canonical, and which UPDATE wins when several target the same ID — both by the tiebreakers in [audit.md](audit.md) §2.7.
- Whether thin evidence clears the `no-evidence` bar.
- How aggressively to compress a `verbose` proposal.

Each decision that was close goes in the PR body next to the issue it affected, so the reviewer sees what was weighed. A user who wants a different verdict says so on the PR; the skill does not pre-emptively ask.

### 5. Apply

Read [apply.md](apply.md). One branch and one commit-series per repo label:

- Branch name: `update-memory/<YYYYMMDD>-<repo-label>` (e.g. `update-memory/20260907-metamask-extension`).
- One commit per applied issue: `memory: apply #<N> — <kebab-case title>`.
- Commits authored per `[shr-001]`.
- ADD → assign next sequential ID in the target section, substitute for `[*-NEW]`, append at section end.
- UPDATE → locate the existing bullet by ID, replace the body verbatim, keep the ID.
- **Every bullet is compressed per [style.md](style.md) before commit.** Verbatim-preserve rules keep every token an agent might grep for. If a proposal is already tight, this is a no-op.

If nothing survives triage+audit for a given repo label, skip that branch entirely — do not open an empty PR.

### 6. PR

Read [pr.md](pr.md). Push the branch, open a **draft** PR. The body follows the fixed template with two disjoint sections plus an ID-assignment table. Before invoking `gh pr create`, run the renderer's invariant check: no issue number appears in both Applied and Opted-out.

Hand back the PR URL and end the session. The human closes the loop by reviewing IDs, marking ready-for-review, and merging.

## What this skill does not do

- It does not edit playbook files outside the `Memory.md` + `MetaMask/*.md` set.
- It does not create new sections (SHR/CODE/TS) inside a playbook — that is a human decision, so proposals targeting a missing section are opted out with `invalid-section`.
- It does not merge the PR, mark it ready-for-review, or run `git push --force`.
- It does not close issues directly. Auto-close happens on merge via the `Closes #N` keywords in the PR body.

## Anti-patterns to avoid

- **Silent dedupe.** Never merge two issues into one applied bullet without listing both in the PR body (one as Applied, the other as Opted-out with `dedupe → #<applied-number>`).
- **Fabricated IDs.** Never assign an ID that skips numbers or reuses a retired one. The next ID is `max(existing) + 1` in the target section — no exceptions.
- **Asking to proceed.** Never end a turn with "approve these verdicts?" — that is the one thing this skill is built to avoid. Decide, apply, and put the reasoning in the PR body. The exceptions are the intake blockers, which are reports, not questions.
- **Non-draft PRs.** Never pass `--draft=false` or omit `--draft`.
- **Placeholder leakage.** No `[shr-NEW]` / `[code-NEW]` / `[ts-NEW]` may survive into a committed bullet. Grep the diff before pushing; abort if any placeholder remains.
- **Verbatim-pasted verbosity.** Never commit a proposal's prose unchanged when it repeats itself, hedges, or opens with pleasantries — pass it through [style.md](style.md). The apply step is not a cp; it is a compress + apply.
- **Silent rewrites of technical substance.** The style pass touches prose only. Never re-word a command, path, address, error string, URL, ID, or fenced code block. If a compression would change grep behaviour, revert it.
