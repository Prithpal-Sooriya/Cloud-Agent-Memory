# Apply phase

Goal: for each repo label with at least one `APPLY` proposal, create a branch, edit the target file, commit one issue per commit, and push. Do **not** open the PR yet — that is [pr.md](pr.md).

## 1. Refresh from origin

Before branching, sync with origin to avoid ID-collision with a parallel curation run:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
```

If `pull --ff-only` fails, stop — the local `main` has drifted. The user resolves.

## 2. Create one branch per repo label

For each repo label with `APPLY` proposals:

```bash
BRANCH="update-memory/$(date -u +%Y%m%d)-<repo-label>"
git checkout -b "$BRANCH" main
```

Example: `update-memory/20260907-metamask-extension`.

If a branch of that name already exists (rare — a same-day retry), append `-2`, `-3`, etc.

## 3. Re-index the target file on the branch

Right after checkout, re-read the target file and rebuild `max_id_per_section`. Reason: another curator PR may have merged since triage, changing the highest ID in a section. The audit-phase table's "assigns <next-id>" is only a preview; the authoritative assignment happens here.

If the recomputed `next_id` differs from the audit-phase preview, note the drift in your working log and continue — the PR body's ID-assignment table must use the final values, not the preview.

## 4. Apply each proposal, one commit at a time

Process proposals in ascending issue-number order (deterministic). For each:

### 4.1 ADD

1. Locate the target section header in the target file (e.g. `## Troubleshooting and Pitfalls (TS)`).
2. Locate the last bullet in that section (up to the next `## ` or end of file). If the section body is `_No entries yet._`, replace that line instead of appending.
3. Compute `next_id = max_id_in_section + 1`, zero-padded to three digits (`ts-008`, `code-013`).
4. Take the `proposed_entry` verbatim from the issue body. Replace the placeholder token exactly once:
   - `[shr-NEW]` → `[shr-<next_id-suffix>]`
   - `[code-NEW]` → `[code-<next_id-suffix>]`
   - `[ts-NEW]` → `[ts-<next_id-suffix>]`
5. Append the resulting bullet to the section, preserving the file's existing indentation and blank-line convention. Match the surrounding bullet style — check whether the file uses `-` or `*`; do not switch.
6. Increment `max_id_per_section` for the next proposal in this batch.

**No sub-bullet reflow.** If the proposed entry has sub-bullets, keep their indentation verbatim. Only the top-level ID token gets rewritten.

### 4.2 UPDATE

1. Find the existing bullet whose ID matches `target_id`. It must exist (Audit already verified with `stale-target`).
2. Determine the bullet's byte range: from the `- **[<id>] ...` line through the last continuation line before the next top-level `-` at the same indent, or the next section header, or EOF.
3. Replace that range with the `proposed_entry` body **verbatim**, but re-insert the original `target_id` in the `[…]` token. If the author left the placeholder `[<prefix>-NEW]` in an UPDATE proposal (a common author bug), substitute the real ID silently — do NOT invent a new one.
4. The ID never changes on UPDATE. Per ACE, obsolete rules are superseded in place.

### 4.3 Compress to house style

Read [style.md](style.md). Rewrite the bullet's prose per the concision
rules **before** staging the edit. Rules of thumb:

- Drop pleasantries, hedging, and narrator connectives ("which is why",
  "so that", "note that", "the fact that", redundant `the / a / an`).
- Merge two consecutive sentences into one with `;` or ` — ` when the
  second is a direct consequence of the first.
- Split any buried enumeration ("(1) …, (2) …, (3) …") into sub-bullets.
- **Preserve verbatim** every command, path, address, error string,
  URL, ID token, and fenced code block. See [style.md](style.md) for
  the full verbatim-preserve list.
- Never drop `not / never / no / only / except / must`.
- Compressed length ≤ proposal length. If it grew, undo.

If the proposal is already tight, this pass is a no-op — do not
compress for the sake of compressing.

### 4.4 Commit

```bash
git add <target-file>
git commit \
  --author="Prithpal Sooriya <prithpal.sooriya@gmail.com>" \
  -m "memory: apply #<issue-number> — <kebab-title>"
```

`<kebab-title>` is the issue title with the `Memory Update: [OP] ` prefix stripped, lowercased, hyphenated, and truncated to 60 chars. Example:

```
memory: apply #88 — corepack-download-prompt-silently-hangs-yarn-install
```

One commit per applied issue. No squashing at this stage — the human reviewer needs the granularity to pick individual reverts if the batch surfaces a bad delta.

## 5. Placeholder-leak invariant

After all commits for a branch, before pushing:

```bash
git diff main -- <target-file> | rg '\[(shr|code|ts)-NEW\]'
```

Must return zero matches. If any placeholder survives, `git reset --soft main`, fix the offending proposal manually, and re-commit. Never push a branch whose diff still contains a `-NEW` token.

## 6. Push

```bash
GH_TOKEN="${CLOUD_AGENT_WRITE_ISSUES_PAT:-$GH_TOKEN}" \
  git push -u origin "$BRANCH"
```

`GH_TOKEN` is required on cloud VMs per `Memory.md` `[shr-005]`; on a local machine with a write-capable `gh` auth, the fallback picks up whatever `gh` already uses.

## 7. Hand off to PR phase

For each pushed branch, invoke [pr.md](pr.md) with the applied + opted-out lists and the final ID-assignment table for that repo label. The PR opens draft; nothing else happens automatically.
