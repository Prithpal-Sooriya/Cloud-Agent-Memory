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

```markdown
- **[shr-NEW] Title**: Actionable instruction or insight here.
```

### Evidence

<!-- Links to logs, errors, commits, PRs, etc. Optional but recommended. -->
