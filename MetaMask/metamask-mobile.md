## Repo: MetaMask/metamask-mobile

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
