# Playbook: MetaMask/metamask-mobile
This is an evolving playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Strategies and Hard Rules (SHR)
These are environment-specific guidelines and mandatory workflows.

* **[shr-001] Environment Setup**: To initialize the development environment, run `yarn && yarn setup:expo`. This must be completed before running tests or the TypeScript linter (it applies necessary library patches).
  * **Helpful:** 1 | **Harmful:** 0

* **[shr-002] Pre-Commit Validation**: Before pushing any code, you must execute `yarn lint:tsc`. Commits are only permitted if this check passes with zero errors.
  * **Helpful:** 1 | **Harmful:** 0

* **[shr-003] Project Type**: The project is a React Native application written in TypeScript.
  * **Helpful:** 1 | **Harmful:** 0

## Useful Code Snippets and Templates (CODE)
Reusable patterns and specific syntax requirements.

* **[code-001] Jest Assertion Style**: In Jest tests, use `.toStrictEqual()` instead of `.toEqual()` for comparisons.
  * **Helpful:** 1 | **Harmful:** 0

* **[code-002] Test Description Style**: Test descriptions in `it()` should not start with 'should'.
  * **Helpful:** 1 | **Harmful:** 0

* **[code-003] Redux Selector Default State Pattern**: When creating selectors that access `state.engine.backgroundState?.ControllerName`, always provide a fallback using the controller's default state function to prevent crashes during app initialization. Pattern: `state.engine.backgroundState?.ControllerName ?? getDefaultControllerNameState()`.
  * **Helpful:** 1 | **Harmful:** 0
 
* **[code-004] Inline Platform Conditionals**: For simple platform-specific logic (e.g., SafeAreaView edges, styling differences), use inline ternary conditionals directly in JSX rather than creating utility files. Example: `edges={Platform.OS === 'ios' ? ['left', 'right'] : ['left', 'right', 'bottom']}`. This keeps changes minimal and avoids triggering SonarCloud coverage requirements for new code.
  * **Helpful:** 1 | **Harmful:** 0

## Troubleshooting and Pitfalls (TS)
Lessons learned from past execution failures or resource constraints.

* **[ts-001] Jest Coverage Overhead**: Always append `--coverage=false` when running individual Jest tests to reduce execution time and resource consumption. Use `yarn jest <filepath> --coverage=false`.
  * **Helpful:** 1 | **Harmful:** 0

* **[ts-002] Targeted Testing**: Only run tests for affected files, not the entire suite. Test files are co-located with source files (e.g., `component.tsx` and `component.test.tsx`).
  * **Helpful:** 1 | **Harmful:** 0

* **[ts-003] Efficient Linting**: To run eslint, use `npx eslint <path_to_file>` (running via package.json is slow due to project size). To format code, use `yarn prettier --write <file_path>`.
  * **Helpful:** 1 | **Harmful:** 0
