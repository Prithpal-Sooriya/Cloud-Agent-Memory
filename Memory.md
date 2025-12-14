# Memory
This memory file contains links to many repos. Please view the agent memory for the repo you are working in.

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

TODO.

I want a nice memory prompt here to inform that the agent should open an issue to https://github.com/Prithpal-Sooriya/Cloud-Agent-Memory/
Use the Github new Issue URL: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue#creating-an-issue-from-a-url-query
They should share the issue url to the user, so users can open and vet and update new memory.
Issue format should use a code snippet to make it easier to copy/paste/insert the new memory field
Issue should include a label for which project this should be under (using the repo names provided in memory)
