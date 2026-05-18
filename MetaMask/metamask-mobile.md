# Playbook: MetaMask/metamask-mobile

This is an evolving playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Strategies and Hard Rules (SHR)

These are environment-specific guidelines and mandatory workflows.

- **[shr-001] Environment Setup**: To initialize the development environment, run `corepack enable` to install yarn then `yarn && yarn setup:expo`. This must be completed before running tests or the TypeScript linter (it applies necessary library patches).
- **[shr-002] Pre-Commit Validation**: Before pushing any code, you must execute `yarn lint:tsc`. Commits are only permitted if this check passes with zero errors. This is mandatory even for test-only refactors (`*.test.ts(x)`) — Jest + ESLint passing locally is NOT a substitute, because TypeScript inference quirks like `it.each` heterogenous-union narrowing only surface in `tsc`. Re-run `lint:tsc` after every refactor, however small, before `git push`.
- **[shr-003] Project Type**: The project is a React Native application written in TypeScript.
- **[shr-004] Reviewer-Scope Fidelity**: When a reviewer requests a specific structure or minimal adjustment, implement exactly that requested scope first; avoid additional DRY/architectural refactors unless explicitly requested.
- **[shr-005] PR Template Compliance for PR Publishing**: Before creating a PR, always search standard template paths (`.github/pull-request-template.md`, `PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/PULL_REQUEST_TEMPLATE/*.md`, `PULL_REQUEST_TEMPLATE/*.md`) and use the discovered template structure in the PR body. If no template is found, state that explicitly in the PR summary and use a minimal structured body (`Summary`, `Testing`).

## Useful Code Snippets and Templates (CODE)

Reusable patterns and specific syntax requirements.

- **[code-001] Jest Assertion Style**: In Jest tests, use `.toStrictEqual()` instead of `.toEqual()` for comparisons.
- **[code-002] Test Description Style**: Test descriptions in `it()` should not start with 'should'.
- **[code-003] Redux Selector Default State Pattern**: When creating selectors that access `state.engine.backgroundState?.ControllerName`, always provide a fallback using the controller's default state function to prevent crashes during app initialization. Pattern: `state.engine.backgroundState?.ControllerName ?? getDefaultControllerNameState()`.
- **[code-004] Inline Platform Conditionals**: For simple platform-specific logic (e.g., SafeAreaView edges, styling differences), use inline ternary conditionals directly in JSX rather than creating utility files. Example: `edges={Platform.OS === 'ios' ? ['left', 'right'] : ['left', 'right', 'bottom']}`. This keeps changes minimal and avoids triggering SonarCloud coverage requirements for new code.
- **[code-005] Remote Feature Flag Registration**: Whenever a new remote LaunchDarkly flag is introduced (e.g. via `remoteFeatureFlags[FLAG_KEY]` or `remoteFeatureFlags.flagName` inside a selector under `app/selectors/featureFlagController/**` or `app/components/UI/**/selectors/**`), in the same PR add an entry to `tests/feature-flags/feature-flag-registry.ts` matched on `name: '<flag-string>'`. For unreleased flags use `inProd: false`, `productionDefault: false`, `status: FeatureFlagStatus.Active`; for live flags copy `inProd`/`productionDefault` from `https://client-config.api.cx.metamask.io/v1/flags?client=mobile&distribution=main&environment=prod`. The registry object key may be the camelCase or quoted kebab-case form of the flag. Only add the constant name to `.github/scripts/known-feature-flag-constants.ts` if the constant is defined in a file other than the one that references it; same-file constants are already resolved by `resolveConstantFromSourceFile`. Validate locally with `yarn jest .github/scripts/check-feature-flag-registry.test.ts --coverage=false` (the full CI script requires `@actions/github` types not installed in dev).
- **[code-006] ESLint conventions in metamask-mobile**: When writing new TypeScript files in this repo, apply these two repo-wide rules up front to avoid an extra `npx eslint` cycle:
  - `@typescript-eslint/array-type`: use `T[]` and `readonly T[]`. Both `Array<T>` and `ReadonlyArray<T>` are forbidden by ESLint.
  - `jsdoc/check-indentation`: JSDoc continuation lines must keep a single space after the leading `*`. Do **not** indent list items, code blocks, or wrapped sentences past that single space, even when the result reads less "pretty".
- **[code-007] TanStack Query Mutation Hook Test Boilerplate**: When writing Jest tests for TanStack Query `useMutation` hooks (v4), override the notifyManager at module scope with `notifyManager.setBatchNotifyFunction((cb) => cb())` to avoid `unstable_batchedUpdates` teardown crashes, and clear the QueryClient caches in `afterEach` (`getMutationCache().clear()`, `getQueryCache().clear()`, `clear()`). See `app/components/UI/Card/hooks/useCardFreeze.test.ts` for a canonical example.
 
## Troubleshooting and Pitfalls (TS)

Lessons learned from past execution failures or resource constraints.

- **[ts-001] Jest Coverage Overhead**: Always append `--coverage=false` when running individual Jest tests to reduce execution time and resource consumption. Use `yarn jest <filepath> --coverage=false`.
- **[ts-002] Targeted Testing**: Only run tests for affected files, not the entire suite. Test files are co-located with source files (e.g., `component.tsx` and `component.test.tsx`).
- **[ts-003] Efficient Linting**: To run eslint, use `npx eslint <path_to_file>` (running via package.json is slow due to project size). To format code, use `yarn prettier --write <file_path>`.
- **[ts-NEW] Asset.fiat shape in test fixtures**: The `Asset` type from `@metamask/assets-controllers` declares `fiat` as `{ balance: number; currency: string; conversionRate: number }`. All three fields are required. When constructing `Asset` fixtures (especially via `makeAsset({ fiat: ... })` builders), always include `conversionRate`. Casting to `Asset` will not catch the omission at the fixture site — `yarn lint:tsc` catches it at the consumer, which means it survives `yarn jest` and only fails in pre-commit. Couple this with `[shr-002]`.
