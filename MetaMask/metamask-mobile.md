# Playbook: MetaMask/metamask-mobile

This is an evolving playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Strategies and Hard Rules (SHR)

These are environment-specific guidelines and mandatory workflows.

- **[shr-001] Environment Setup**: To initialize the development environment, run `corepack enable` to install yarn then `yarn && yarn setup:expo`. This must be completed before running tests or the TypeScript linter (it applies necessary library patches).
- **[shr-002] Pre-Commit Validation**: Before `git push`, run `yarn lint:tsc` and ensure zero errors — required even for test-only changes (`*.test.ts(x)`). Jest + ESLint passing locally is not a substitute: `tsc`-only inference quirks (e.g. `it.each` heterogenous-union narrowing) surface only here. Re-run after every refactor, however small.
- **[shr-003] Project Type**: The project is a React Native application written in TypeScript.
- **[shr-004] Reviewer-Scope Fidelity**: When a reviewer requests a specific structure or minimal adjustment, implement exactly that requested scope first; avoid additional DRY/architectural refactors unless explicitly requested.
- **[shr-005] PR Template Compliance**: Before creating a PR, search the standard template locations (`**/PULL_REQUEST_TEMPLATE.md` and `**/PULL_REQUEST_TEMPLATE/*.md`, case-insensitive, under repo root and `.github/`) and follow the discovered template structure in the PR body. If none is found, state that explicitly in the PR summary and use a minimal `Summary` + `Testing` body.

## Useful Code Snippets and Templates (CODE)

Reusable patterns and specific syntax requirements.

- **[code-001] Jest Assertion Style**: In Jest tests, use `.toStrictEqual()` instead of `.toEqual()` for comparisons.
- **[code-002] Test Description Style**: Test descriptions in `it()` should not start with 'should'.
- **[code-003] Redux Selector Default State Pattern**: Selectors that access `state.engine.backgroundState?.ControllerName` must fall back to the controller's default state to prevent crashes during app init: `state.engine.backgroundState?.ControllerName ?? getDefaultControllerNameState()`.
- **[code-004] Inline Platform Conditionals**: For simple platform-specific logic (SafeAreaView edges, small style differences), inline a `Platform.OS === 'ios' ? … : …` ternary in JSX rather than creating a utility file. Keeps diffs minimal and avoids triggering SonarCloud coverage requirements on new files. Example: `edges={Platform.OS === 'ios' ? ['left', 'right'] : ['left', 'right', 'bottom']}`.
- **[code-005] Remote Feature Flag Registration**: When adding a new LaunchDarkly flag referenced via `remoteFeatureFlags[FLAG_KEY]` / `remoteFeatureFlags.flagName` inside a selector under `app/selectors/featureFlagController/**` or `app/components/UI/**/selectors/**`, in the same PR add an entry to `tests/feature-flags/feature-flag-registry.ts` keyed on `name: '<flag-string>'`.
  - Unreleased flags: `inProd: false`, `productionDefault: false`, `status: FeatureFlagStatus.Active`.
  - Live flags: copy `inProd` / `productionDefault` from `https://client-config.api.cx.metamask.io/v1/flags?client=mobile&distribution=main&environment=prod`.
  - The registry object key may be the camelCase or quoted kebab-case form of the flag.
  - Only add the constant to `.github/scripts/known-feature-flag-constants.ts` if it is defined in a different file from where it is referenced (same-file constants resolve via `resolveConstantFromSourceFile`).
  - Validate with `yarn jest .github/scripts/check-feature-flag-registry.test.ts --coverage=false` (the full CI script requires `@actions/github` types not installed in dev).
- **[code-006] ESLint / JSDoc Conventions**: Apply these repo-wide rules up front when writing new TypeScript to avoid an extra `npx eslint` cycle:
  - `@typescript-eslint/array-type`: use `T[]` and `readonly T[]`. `Array<T>` and `ReadonlyArray<T>` are forbidden.
  - `@typescript-eslint/consistent-type-definitions`: use `interface Foo { ... }` for object shapes, not `type Foo = { ... }`.
  - `no-void`: don't prefix promises with `void`; keep the bare `.catch(...)`.
  - `jsdoc/check-indentation`: continuation lines must keep a single space after `*` — no extra indentation for list items, code blocks, or wrapped sentences. Multi-line bullets are rejected; keep each bullet on a single line or split into separate paragraphs.
- **[code-007] TanStack Query Mutation Hook Test Boilerplate**: For Jest tests around TanStack Query v4 `useMutation` hooks, override the notifyManager at module scope with `notifyManager.setBatchNotifyFunction((cb) => cb())` to avoid `unstable_batchedUpdates` teardown crashes, and clear caches in `afterEach` (`getMutationCache().clear()`, `getQueryCache().clear()`, `clear()`). Canonical example: `app/components/UI/Card/hooks/useCardFreeze.test.ts`.

## Troubleshooting and Pitfalls (TS)

Lessons learned from past execution failures or resource constraints.

- **[ts-001] Jest Coverage Overhead**: Always append `--coverage=false` to individual Jest runs: `yarn jest <filepath> --coverage=false`.
- **[ts-002] Targeted Testing**: Only run tests for affected files, not the whole suite. Tests are co-located with sources (`component.tsx` + `component.test.tsx`).
- **[ts-003] Efficient Linting**: Run `npx eslint <file>` directly (the `package.json` script is slow on this repo). Format with `yarn prettier --write <file>`.
- **[ts-004] Asset.fiat Requires `conversionRate`**: `Asset` from `@metamask/assets-controllers` declares `fiat: { balance: number; currency: string; conversionRate: number }` — all three fields are required. Fixtures (e.g. `makeAsset({ fiat: ... })`) that omit `conversionRate` survive `yarn jest` and only fail at `yarn lint:tsc` at the consumer site (see `[shr-002]`).
