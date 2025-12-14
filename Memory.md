# Memory
This memory file contains links to many repos. Please view the agent memory for the repo you are working in.

## Global

- Make sure that modifications are scoped and minimal
- Make sure that unit tests pass
- Make sure that commits use the users author `--author="Prithpal Sooriya <prithpal.sooriya@gmail.com>"`

## Repo: MetaMask/core

## Repo: MetaMask/metamask-extension

TODO - will be moved into a different file path

- Always start a task in 'deep planning mode'. Interact with the user by asking clarifying questions to gain absolute certainty of their expectations and goals before creating a plan. Only after the user answers the questions and confirms my understanding should I create the plan.

- PR created should include the provided jira ticket and gihub issue linked

- The project uses an `.nvmrc` file to define the required Node.js version. A reliable command sequence to set up the environment is `nvm install && nvm use && corepack enable && yarn install`.

- Before committing make sure that yarn lint:tsc does not return errors

- To run only specific tests, use the command `yarn jest <path_to_test_file> --coverage=false`. This is more efficient than running the full suite.

- To run tests with increased memory, prepend the test command with NODE_OPTIONS=--max-old-space-size=4096.

- The project uses yarn for dependency management and requires a specific version defined in package.json.

- To run the entire test suite, use yarn test. This command may fail due to memory limits or timeouts.

- The project is the MetaMask Extension

- The project uses Corepack to manage the yarn version. It needs to be enabled via corepack enable

## Repo: MetaMask/metamask-mobile

TODO - will be moved into a different file path

- Before starting a task, I must enter a deep planning mode to ask clarifying questions until the user's requirements are crystal clear. Only after getting confirmation should I create a plan.

- When refactoring, aim for minimal changes to limit the impact on the existing codebase.

- Keep unit test suites clean and focused.

- To run eslint linter, run `npx eslint <path to file>`. Running the linter via package.json will take a long time (project is large).

- To run typescript linter, make sure that: `yarn setup:expo` has been run (this is because we need to make sure the setup command runs library patches)

- To run unit tests, make sure that, `yarn setup:expo` has been run (this is because we need to make sure the setup command runs library patches)

- To format code, run `yarn prettier --write <file_path>` on the modified files

- Before committing, make sure to run yarn `lint:tsc` to make sure there are no typescript errors

- To run tests for a specific file, use the command `yarn jest <filepath> --coverage=false`.

- In Jest tests, use `.toStrictEqual()` instead of `.toEqual()` for object and array comparisons.

- Jest test descriptions (the string in the `it()` function) should not start with the word 'should'.

- The project is a React Native application written in TypeScript.

- When running tests, only run tests for the affected files, not the entire test suite.

- To set up the environment, run `yarn && yarn setup:expo` to install dependencies.

- Test files are co-located with their source files (e.g., `component.tsx` and `component.test.tsx` are in the same directory).

- The project uses Jest for testing.

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
