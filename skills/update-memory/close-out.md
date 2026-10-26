# Close-out phase (post-merge)

Runs after a curation PR merges, triggered by the Kandev "Memory - Close opted-out issues" automation. GitHub has already auto-closed the Applied issues through `Closes #N`. This step closes the **opted-out** issues, so the backlog only ever holds proposals that have never been judged.

## Inputs

The merged PR's URL or number. Nothing else. The PR body is the only source of which issues to close.

## 1. Guard

```bash
gh pr view <N> --repo Prithpal-Sooriya/Cloud-Agent-Memory --json state,title,body,mergedAt,labels
```

Stop with no action unless all of these hold:

- `state == "MERGED"`.
- The title starts with `memory: curate`. The meta PR (`memory: refresh curation meta-memory`) and unrelated PRs are no-ops.

## 2. Extract the opted-out set

Fetch the body first (`gh pr view <N> --repo Prithpal-Sooriya/Cloud-Agent-Memory --json body -q .body > body.md`). Then take every `#N` that starts a bullet under `### Opted out (closed as not planned on merge)`, plus any under `### Opted out — other labels (no PR this run)`:

```bash
awk '/^### Opted out/{f=1;next} /^### /{f=0} f' body.md | rg -o '^- #(\d+)' -r '$1' | sort -u
```

Then remove from that set:

- Any `#N` that also appears as `Closes #N` in this PR's body. That would break the body invariant, so log it and leave the issue alone.
- Any `#N` that appears as `Closes #N` in another **open** curation PR. A multi-label issue can be opted out here and applied there, so that PR's merge decides it.

```bash
gh pr list --repo Prithpal-Sooriya/Cloud-Agent-Memory --state open --limit 50 \
  --json title,body --jq '.[] | select(.title | startswith("memory: curate")) | .body' \
  | rg -o 'Closes #(\d+)' -r '$1' | sort -u
```

## 3. Close

For each remaining issue that is still open, close it as not planned with a comment quoting its opt-out row:

```bash
gh issue close <issue> --repo Prithpal-Sooriya/Cloud-Agent-Memory --reason "not planned" \
  --comment "Closed by update-memory close-out after #<N> merged. Verdict: <opt-out row text>. Refile as a new memory-update issue if the proposal is revised."
```

Writes follow `[shr-005]`: use `GH_TOKEN="$CLOUD_AGENT_WRITE_ISSUES_PAT"` when the default token is read-only. If it is unset and the default token cannot write, report that and stop rather than ignoring `gh` errors.

The automation can fire more than once or race a manual run. Check `gh issue view <issue> --json state -q .state` first: an issue that is already `CLOSED` is skipped and listed under skipped, never re-closed or re-commented.

## 4. Report

Print three lists: closed, skipped (already closed, or applied in another open PR), and invariant violations. Do not edit any file, open a PR, or comment on the merged PR.
