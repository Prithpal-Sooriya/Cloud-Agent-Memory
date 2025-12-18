# Memory: Evolving Playbook (ACE Framework)

This memory file acts as an evolving playbook that accumulates, refines, and organizes strategies for all projects.

**Instructions:**

* **ACE Workflow**: For every task, operate through the roles of **Generator** (execute task), **Reflector** (analyze success/failure), and **Curator** (propose memory updates).
* **Immediate Retrieval**: Identify the repository and **immediately fetch** the corresponding repo-specific memory file—do not ask for permission.
* **Preserve Detail**: Do not summarize or compress existing rules; use itemized bullets to preserve specific domain knowledge.
* **Mandatory Session Close**: You MUST conclude every session by providing either a link to a Memory Update Issue or a one-sentence "Reflection Statement" explaining why no update was required.
* **Multi-Update Rule**: If a task yields multiple insights (e.g., a code snippet AND a troubleshooting tip), create separate issues for each to maintain modularity.


## Global Playbook (Strategies & Hard Rules)

* **Author Identity**: Commits must use: `--author="Prithpal Sooriya <prithpal.sooriya@gmail.com>"`.
* **Traceability**: PRs must include the Jira ticket and GitHub issue link.
* **Minimal Scoping**: Modifications must be scoped and minimal to avoid regression.
* **Validation**: Ensure unit tests pass before requesting a memory update.

## Repository Specifics

Fetch and follow the itemized strategies for each domain:

* **MetaMask/core:** [https://raw.githubusercontent.com/Prithpal-Sooriya/Cloud-Agent-Memory/main/MetaMask/metamask-core.md](https://raw.githubusercontent.com/Prithpal-Sooriya/Cloud-Agent-Memory/main/MetaMask/metamask-core.md)
* **MetaMask/metamask-extension:** [https://raw.githubusercontent.com/Prithpal-Sooriya/Cloud-Agent-Memory/main/MetaMask/metamask-extension.md](https://raw.githubusercontent.com/Prithpal-Sooriya/Cloud-Agent-Memory/main/MetaMask/metamask-extension.md)
* **MetaMask/metamask-mobile:** [https://raw.githubusercontent.com/Prithpal-Sooriya/Cloud-Agent-Memory/main/MetaMask/metamask-mobile.md](https://raw.githubusercontent.com/Prithpal-Sooriya/Cloud-Agent-Memory/main/MetaMask/metamask-mobile.md)

---

## Agentic Memory Update Process (Reflect & Curate)

When you complete a task or encounter a failure, perform a **Reflection** to extract concrete lessons and a **Curation** to propose a **Delta Update**.

### 1. Perform Reflection (The "Reflector" Role)

Analyze your execution trace. Identify:

* **Successes**: Logic that led to the ground-truth result.
* **Failures**: Identify the **Root Cause** (e.g., wrong source of truth, stale cache, bad filter).
* **Audit**: Mark existing Playbook IDs as `[Helpful]`, `[Harmful]`, or `[Neutral]`.

### 2. Request a Delta Update (The "Curator" Role)

Decide on an **Operation Type**:

* **ADD**: For entirely new insights missing from the playbook.
* **UPDATE**: To modify an existing rule (e.g., if a rule was marked **Harmful**).
* **DELETE Operation?**: Following the ACE framework, do not "delete" entries. If an entry is obsolete or incorrect, use the **UPDATE** operation to mark it as `Harmful` or provide a corrected version. This preserves the "negative constraint" knowledge.

**Create an issue** using this format:

```
https://github.com/Prithpal-Sooriya/Cloud-Agent-Memory/issues/new?title=Memory+Update:+[Type]+[Brief+Description]&body=[Issue+Body]&labels=[repo-label]
```

Where `repo-label` is:
- `metamask-core` - for MetaMask/core
- `metamask-extension` - for MetaMask/metamask-extension
- `metamask-mobile` - for MetaMask/metamask-mobile

### 3. Issue Body Template (ACE Structured)

Ensure the `Proposed Entry` exactly matches the markdown nesting of the repo playbooks.

````markdown
## Memory Delta Update Request

**Repository:** [e.g., MetaMask/metamask-extension]
**Operation:** [ADD | UPDATE]
**Section:** [SHR / CODE / TS]

### Reasoning
[Detailed analysis of why this update is necessary and the root cause identified.]

### Proposed Entry (Copy-Paste Ready)
```markdown
* **[ID-XXX] Title**: Actionable instruction or insight here.
  * **Helpful:** 1 | **Harmful:** 0
```

### Evidence
[Link to logs or specific error messages.]

````

### 4. Real-World Example URL

If updating a memory limit for the extension repo:

> `https://github.com/Prithpal-Sooriya/Cloud-Agent-Memory/issues/new?title=Memory+Update:+[UPDATE]+Refine+Memory+Limits&labels=metamask-extension&body=%23%23+Memory+Delta+Update+Request%0A%0A**Repository:**+MetaMask/metamask-extension%0A**Operation:**+UPDATE%0A**Section:**+TS%0A%0A%23%23%23+Reasoning%0AThe+previous+limit+in+[ts-001]+caused+a+stack+overflow+on+the+CI+runner.+Increasing+to+8192+resolved+it.%0A%0A%23%23%23+Proposed+Entry%0A%60%60%60markdown%0A*+**[ts-001]+Memory-Efficient+Testing**:+Prepend+NODE_OPTIONS=--max-old-space-size=8192+to+prevent+CI+timeouts.%0A++*+**Helpful:**+1+%7C+**Harmful:**+1%0A%60%60%60`

### 5. Grow-and-Refine Note

Always share the issue URL with the user. The user acts as the final gate for merging these **Delta Entries**. When updating an existing ID, the user will replace the old bullet with the new proposed entry.
