# Memory
This memory file contains links to many repos. Please view the agent memory for the repo you are working in.

## Global

- Always start a task in 'deep planning mode'. Interact with the user by asking clarifying questions to gain absolute certainty of their expectations and goals before creating a plan. Only after the user answers the questions and confirms my understanding should I create the plan.
- Make sure that commits use the users author `--author="Prithpal Sooriya <prithpal.sooriya@gmail.com>"`
- Make sure that modifications are scoped and minimal
- Make sure that unit tests pass

## Repo: MetaMask/core

https://github.com/Prithpal-Sooriya/Cloud-Agent-Memory/blob/main/MetaMask/metamask-core.md

## Repo: MetaMask/metamask-extension

https://github.com/Prithpal-Sooriya/Cloud-Agent-Memory/blob/main/MetaMask/metamask-extension.md

## Repo: MetaMask/metamask-mobile

https://github.com/Prithpal-Sooriya/Cloud-Agent-Memory/blob/main/MetaMask/metamask-mobile.md

---

## Update Memory

When you discover important information that should be remembered for future sessions, create a memory update request by opening an issue.

### How to Request a Memory Update

1. **Create an issue** using this URL format:
   ```
   https://github.com/Prithpal-Sooriya/Cloud-Agent-Memory/issues/new?title=Memory+Update:+[Brief+Description]&body=[Issue+Body]&labels=[repo-label]
   ```

2. **Use the appropriate label** based on the repository:
   - `metamask-core` - for MetaMask/core
   - `metamask-extension` - for MetaMask/metamask-extension
   - `metamask-mobile` - for MetaMask/metamask-mobile

3. **Format the issue body** with the following template:

   ````markdown
   ## Memory Update Request
   
   **Repository:** [e.g., MetaMask/metamask-extension]
   
   **Context:** [Brief explanation of why this should be remembered]
   
   ### Proposed Memory Entry
   
   ```markdown
   - [Your new memory entry here - be specific and actionable]
   ```
   
   ### Source/Evidence
   [Link to relevant PR, discussion, or documentation that supports this memory]
   ````

4. **Share the created issue URL** with the user so they can review, validate, and merge the memory update.

### Example Issue URL

```
https://github.com/Prithpal-Sooriya/Cloud-Agent-Memory/issues/new?title=Memory+Update:+New+lint+command+for+extension&body=%23%23%20Memory%20Update%20Request%0A%0A**Repository:**%20MetaMask/metamask-extension%0A%0A**Context:**%20Discovered%20a%20faster%20way%20to%20run%20linting%0A%0A%23%23%23%20Proposed%20Memory%20Entry%0A%0A%60%60%60markdown%0A-%20To%20run%20eslint%20on%20specific%20files,%20use%20%60yarn%20lint:eslint%20%3Cfile_path%3E%60%0A%60%60%60&labels=metamask-extension
```

> **Note to agents:** Always share the issue URL with the user after creating it. Users must validate and approve memory updates before they are added to this file.
