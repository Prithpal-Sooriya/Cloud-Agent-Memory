# Triage phase

Goal: produce a list of parsed `Proposal` structs from every open `memory-update` issue, grouped by repo label.

## 1. Fetch open issues

```bash
gh issue list \
  --repo Prithpal-Sooriya/Cloud-Agent-Memory \
  --state open \
  --label memory-update \
  --limit 200 \
  --json number,title,url,labels,body,author,createdAt,updatedAt
```

Notes:

- `--limit 200` covers realistic backlogs; if the JSON array is exactly 200 long, bump and re-run so you never truncate silently.
- Do **not** use `gh issue list --search` on cloud VMs: `[ts-NEW]` on `Memory.md` documents that the read-only cloud token returns placeholder rows (`{"number":0,"title":"","url":""}`) with exit 0. Use `--label memory-update` for filtering instead of `--search`.

## 2. Parse each issue body

Every issue follows `.github/ISSUE_TEMPLATE/memory-update.yml` / `memory-update.md`. Extract:

| Field           | Where                                                            | Notes                                             |
|-----------------|------------------------------------------------------------------|---------------------------------------------------|
| `number`        | top-level `number`                                                | e.g. `89`                                         |
| `url`           | top-level `url`                                                   | for the PR body                                   |
| `title`         | top-level `title`                                                 | strip the leading `Memory Update: [TYPE] ` prefix |
| `repo_label`    | `labels[].name` — exactly one of `metamask-core \| metamask-extension \| metamask-mobile` | if zero or multiple, flag for opt-out             |
| `repository`    | line `**Repository:** ...` in body                                 | should match `repo_label`; mismatch → flag         |
| `operation`     | line `**Operation:** ...`                                          | `ADD` \| `UPDATE`                                    |
| `section`       | line `**Section:** ...`                                            | `SHR` \| `CODE` \| `TS`                              |
| `target_id`     | line `**Target ID:** ...`                                          | `NEW` for ADD; concrete ID (e.g. `shr-002`) for UPDATE |
| `reasoning`     | body under `### Reasoning`                                         | verbatim, up to next `###`                        |
| `proposed_entry`| first fenced ```markdown block under `### Proposed Entry`         | verbatim                                          |
| `evidence`      | body under `### Evidence`                                          | verbatim; may be empty                            |

Store as JSON in memory (no file needs to be written on disk during triage — audit reads from the same struct).

## 3. Group by target file

Map `repo_label` → target file:

| `repo_label`         | Target file                          |
|----------------------|--------------------------------------|
| `metamask-core`      | `MetaMask/metamask-core.md`          |
| `metamask-extension` | `MetaMask/metamask-extension.md`     |
| `metamask-mobile`    | `MetaMask/metamask-mobile.md`        |
| _(no repo label)_    | `Memory.md` — treat as global-playbook proposal |

The global-playbook path is uncommon (most issues target a repo playbook) but valid — `[shr-005]` in `Memory.md` was itself a global entry. If an issue is missing a repo label AND its body says `Repository: Prithpal-Sooriya/Cloud-Agent-Memory` (or names no MetaMask repo), treat it as global. Otherwise flag as `invalid-repo-label` for opt-out.

## 4. Echo a compact table

Print one line per issue:

```
#<num> [<repo-label>] <OP> <SECTION> <TARGET_ID>  "<title>"
```

Sort by (repo_label, section, operation, number). Example:

```
#87 [extension] UPDATE SHR shr-002    "traceability needs a fallback when no Jira/issue link is discoverable"
#84 [extension] UPDATE SHR shr-001    "Resolve the nvm Node path explicitly, not via $(nvm current)"
#90 [extension] ADD    TS  NEW        "gh issue list --search returns empty stubs under the read-only cloud token"
#89 [extension] ADD    TS  NEW        "assets-unify-state hide invariant — hideAsset is the only write the read bridge honours"
#88 [extension] ADD    TS  NEW        "Corepack download prompt silently hangs yarn install on cloud VMs"
#82 [extension] ADD    TS  NEW        "Shell rg output mangles matched text — use the Grep tool for hex/identifier searches"
#77 [mobile]    ADD    TS  NEW        "Fetch logs of jobs in an in-progress GitHub Actions run via gh api"
...
```

This table is the input to Audit. Do not proceed until every open issue is accounted for — if parsing fails for any issue, list it with `PARSE_ERROR` and treat as opt-out `invalid-body`.
