# Audit phase

Goal: for every parsed proposal, emit a verdict of `APPLY` or `OPT_OUT (<reason>)`. Never mutate a file in this phase — read only.

## 1. Load the current playbooks

Read the target file(s) once and index each bullet:

```
{
  file: "MetaMask/metamask-extension.md",
  section: "TS",
  id: "ts-007",
  body: "Detect react-compiler bailouts with the babel logger, not eslint: ..."
}
```

Ignore the `_No entries yet._` placeholder if a section is empty. Note the `max_id_per_section` per file — you will need it in Apply.

## 2. Run the checks

For each proposal, apply the checks in this order. **First failing check wins** — do not stack reasons.

### 2.1 `invalid-body`

Fired by the parser in [triage.md](triage.md). Any issue whose body could not be split into the seven fields is opted out here. No further checks.

### 2.2 `invalid-repo-label`

Zero or ≥2 repo labels, or the body's `Repository:` line names a repo not on the allowlist. Opt out.

### 2.3 `invalid-section`

Section must be one of `SHR | CODE | TS`. If the target file has no section for it (e.g., `MetaMask/metamask-core.md` currently has no CODE bullets — the section header exists but says `_No entries yet._`, which is valid; a section header that literally does not exist is not), opt out with `invalid-section: <SECTION> not present in <file>`. Section-header creation is a human call.

### 2.4 `stale-target` (UPDATE only)

For `operation = UPDATE`, `target_id` must exist in the target file's index. If not, opt out with `stale-target: <target_id> not found in <file>`.

### 2.5 `no-evidence`

If the `Evidence` block is empty **and** the `Reasoning` block is under ~200 characters or contains no concrete anchor (URL, PR reference, file path, error snippet, command output), opt out with `no-evidence`. Cloud-agent proposals without an anchor are the highest false-positive risk; the ACE workflow in `Memory.md` §1 explicitly requires "concrete evidence from this session's execution trace".

### 2.6 `contradicts-existing`

If the proposed entry either:

- contradicts a rule in the same section without acknowledging the older rule (e.g., an UPDATE that inverts a hard rule but its Reasoning does not cite the old wording), or
- an ADD whose body directly conflicts with an existing bullet's guidance,

opt out with `contradicts-existing: <bullet-id>`. Do not silently supersede — force the author to file it as an UPDATE.

### 2.7 `dedupe`

Cluster the surviving proposals by target file + section. Two proposals are duplicates when **both** hold:

- Same operation shape (both ADD, or both UPDATE with same `target_id`).
- Substantive overlap: their `proposed_entry` bodies name the same core insight — same command, same failure mode, same file path, or same lesson learned. Wording differences alone are not enough to keep both.

Pick the canonical one by, in order:

1. Highest evidence quality (concrete links > prose).
2. Most recent `updatedAt` (fresher wording).
3. Lowest issue number (breaks ties deterministically).

Mark the canonical as `APPLY`; mark all siblings as `OPT_OUT (dedupe → #<canonical>)`. **Do not silently drop siblings** — every sibling still appears in the PR body's Opted-out list.

### 2.8 `duplicate-target` (UPDATE conflict)

If, after dedupe, two or more `APPLY` UPDATEs still target the same `target_id`, pick the winner with the §2.7 tiebreakers (evidence quality, then `updatedAt`, then issue number) and flip the losers to `OPT_OUT (duplicate-target → #<winner>)`. Never merge two UPDATE bodies into one, and never stall the batch waiting for a human to choose — note in the PR body that the collision was resolved automatically so the reviewer can second-guess it there.

### 2.9 `out-of-scope`

Anything targeting a file the skill does not own (new `MetaMask/<something>.md`, `.github/*`, `automations/*`, `skills/*`) → opt out with `out-of-scope: <path>`. The skill only edits `Memory.md` and existing `MetaMask/*.md` playbooks.

### 2.10 `verbose` (informational, does not opt out)

Not a blocker — a note for the PR body. Flag a proposal as
`verbose` when any of the following hold on its `proposed_entry`:

- Body length exceeds ~800 characters and does not use sub-bullets.
- Body contains a buried enumeration ("(1) …, (2) …, (3) …") in prose
  rather than as sub-bullets.
- Body opens with a pleasantry / narrator phrase ("Note that…", "It is
  worth noting…", "One thing to keep in mind…").

Verbose proposals are still applied — the Apply phase runs the
[style.md](style.md) compression pass on them (see [apply.md](apply.md)
§4.3). The `verbose` flag exists only so the PR body can name which
bullets were rewritten and the reviewer can diff the compression.

## 3. Emit the verdict table

For each issue print one line:

```
#<num>  APPLY                  → <target-file>::<SECTION>  (assigns <next-id>)
#<num>  OPT_OUT (<reason>)     → <target-file>::<SECTION>
```

Group by repo label so the user reviews each PR-bound batch together. Example:

```
== metamask-extension ==
#87  APPLY                       → MetaMask/metamask-extension.md::SHR  (updates shr-002)
#88  APPLY  [verbose]            → MetaMask/metamask-extension.md::TS   (assigns ts-008)
#85  OPT_OUT (dedupe → #88)      → MetaMask/metamask-extension.md::TS
#82  APPLY                       → MetaMask/metamask-extension.md::TS   (assigns ts-009)

== metamask-mobile ==
#77  APPLY                       → MetaMask/metamask-mobile.md::TS      (assigns ts-008)
#75  OPT_OUT (dedupe → #83)      → MetaMask/metamask-mobile.md::TS
...
```

## 4. Continue to Apply

Print the table and go straight on to [apply.md](apply.md). There is no approval step: the verdicts above are the skill's decision, and the draft PR is where a human disagrees with them.

Two things to carry forward so the decision stays auditable:

- Every verdict, including the opt-outs, lands in the PR body — the audit trail is the PR, not this printout.
- Any verdict that hinged on a tiebreaker (`dedupe`, `duplicate-target`) or on a borderline `no-evidence` judgement gets a one-line note on its PR-body row saying what tipped it.

If a proposal is genuinely undecidable — mutually contradictory bodies, or a target file that changed underneath the batch — opt it out with the closest reason and say so in the PR body. Leaving one issue open for the next run is always better than blocking the whole batch.
