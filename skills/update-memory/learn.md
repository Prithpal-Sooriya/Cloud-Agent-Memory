# Learn phase

Goal: before triage, fold the curator's verdicts since the last run into [meta-memory.md](meta-memory.md), so this run's audit judges with current taste. Read-only against GitHub; the only write is to `meta-memory.md` on its own branch.

## 1. Read the ledger

Take `last_reviewed_pr` from the Ledger block in `meta-memory.md`.

## 2. Collect new signals

Curation PRs closed since the marker (merged or not):

```bash
gh pr list --repo Prithpal-Sooriya/Cloud-Agent-Memory --state closed --limit 50 \
  --json number,title,state,mergedAt,closedAt,body \
  --jq '[.[] | select(.title | startswith("memory: curate")) | select(.number > LAST)]'
```

For each one, pull the curator's inline verdicts (skip the bot's own replies, which start with `Removed`, `Skipped`, `Done`, `Agreed`, or `Follow-up`):

```bash
gh api "repos/Prithpal-Sooriya/Cloud-Agent-Memory/pulls/<N>/comments" --paginate \
  --jq '.[] | select(.in_reply_to_id == null) | {path, line: (.line // .original_line), body}'
```

Map each comment to its issue through the PR's ID-assignment table (`line` → bullet ID → issue number). Then classify it:

| Comment says | Signal |
|---|---|
| `skip`, `remove`, `too specific`, `too scoped`, "we will not use …" | negative |
| "global rule?", "move to `Memory.md`" | routing → `meta-201` |
| "convert to a skill?", "move into the `<x>` skill" | routing → `meta-202` |
| anything else | ignore |

Also collect issues closed `NOT_PLANNED` since `last_reviewed_at`:

```bash
gh issue list --repo Prithpal-Sooriya/Cloud-Agent-Memory --label memory-update --state closed \
  --limit 200 --json number,title,stateReason,closedAt \
  --jq '[.[] | select(.stateReason == "NOT_PLANNED" and .closedAt > "<last_reviewed_at>")]'
```

Issues the close-out step closed (comment contains `Closed by update-memory close-out`) are the skill's own verdicts. They are **not** signals; skip them, or meta-memory just learns its own opinions back.

## 3. Distill

For each negative or routing signal:

- If it fits an existing entry, append the issue/PR to that entry's `Evidence` line.
- If at least two negatives share a pattern that no entry covers, ADD a new entry in the right band.
- A single unmatched negative is too thin for a rule; list it under the meta PR's "Watching" section instead.
- If the curator *applied* something an entry would have rejected (it is in the Applied section of a merged PR and the bullet survived), UPDATE that entry to narrow it and cite the PR.

Bump the Ledger to the highest PR number scanned and today's date.

## 4. Land it

If `meta-memory.md` changed, commit it on `update-memory/<YYYYMMDD>-meta` (author per `[shr-001]`) and open a separate **draft** PR titled `memory: refresh curation meta-memory` with labels `memory-update` and `meta-memory`. The body lists each entry ADDed or UPDATEd with its evidence. It has no `Closes` lines.

Then return to `main` and run the rest of the pipeline using the **updated working copy** of `meta-memory.md`. Audit uses the lessons straight away, and the meta PR is where the curator can overrule them.

If nothing changed, skip the branch and say so in the run summary.
