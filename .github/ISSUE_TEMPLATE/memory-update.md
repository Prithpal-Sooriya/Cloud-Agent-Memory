---
name: Memory Delta Update (markdown mirror)
about: Plain-markdown mirror of memory-update.yml. Prefer the YAML form via the web UI; this file documents the body shape agents should produce when using `gh issue create --body-file`.
title: "Memory Update: [TYPE] Brief description"
labels: ["memory-update"]
---

<!--
  This template mirrors .github/ISSUE_TEMPLATE/memory-update.yml so that
  cloud agents using `gh issue create --body-file -` produce issues with
  the same shape as humans filling in the YAML form.

  Keep this file in sync with memory-update.yml when fields change.
-->

## Memory Delta Update Request

**Repository:** <!-- MetaMask/core | MetaMask/metamask-extension | MetaMask/metamask-mobile -->
**Operation:** <!-- ADD | UPDATE -->
**Section:** <!-- SHR | CODE | TS -->
**Target ID:** <!-- existing ID for UPDATE (e.g., shr-003); use NEW for ADD -->

### Reasoning

<!--
  Root cause and concrete evidence from the session. Not a generic
  explanation — anchor in what actually happened.
-->

### Proposed Entry (Copy-Paste Ready)

<!--
  Style: keep it tight. Playbook bullets are field notes, not incident
  reports. Drop pleasantries and narrator connectives ("which is why",
  "note that"), prefer fragments and `;` / ` — ` over multi-sentence
  prose, and split any buried "(1) …, (2) …" enumeration into
  sub-bullets. Preserve verbatim every command, path, address, error
  string, URL, and code fence. See `skills/update-memory/style.md` for
  the full rules — the `update-memory` skill compresses to this style
  before merging, so a tight proposal saves the curator a rewrite.
-->

```markdown
- **[shr-NEW] Title**: Actionable instruction or insight here.
```

### Evidence

<!-- Links to logs, errors, commits, PRs, etc. Optional but recommended. -->
