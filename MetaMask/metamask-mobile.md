## Repo: MetaMask/metamask-mobile

- The project is a React Native application written in TypeScript.
- To set up the environment, run `yarn && yarn setup:expo`. This must be completed before running tests or the TypeScript linter (it applies necessary library patches).
- To run specific tests, use `yarn jest <filepath> --coverage=false`. Only run tests for affected files, not the entire suite. Test files are co-located with source files (e.g., `component.tsx` and `component.test.tsx`).
- In Jest tests, use `.toStrictEqual()` instead of `.toEqual()` for comparisons. Test descriptions in `it()` should not start with 'should'.
- To run eslint, use `npx eslint <path_to_file>` (running via package.json is slow due to project size). To format code, use `yarn prettier --write <file_path>`.
- Before committing, run `yarn lint:tsc` and ensure it passes with no errors.
- When refactoring, aim for minimal changes. Keep unit test suites clean and focused.
