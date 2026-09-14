# Playbook: MetaMask/metamask-core

This is an evolving playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Strategies and Hard Rules (SHR)

These are environment-specific guidelines and mandatory workflows.

- **[shr-001] Environment Setup**: To initialize the development environment, run `nvm use && yarn install` in the root directory.
- **[shr-002] Project Type**: This is a monorepo that contains many packages.
- **[shr-003] Type Checking**: To type-check changes, run the **root** `yarn build` (`tsc --build tsconfig.build.json`), which resolves TS project references across the monorepo in dependency order. Package-level `yarn build:clean` fails with TS6305 ("Output file .../dist/index.d.ts has not been built") whenever workspace dependencies lack `dist/` output (fresh clone or after `build:only-clean`); use it only when dependency dists already exist, or run the root build first.
- **[shr-004] Changelog Requirements**: Once a PR is made, update the related files changelog to reflect the file changes. Add the correct PR link to the changelog. Changelog users are developers consuming the package.
- **[shr-005] Changelog Exceptions**: For ESLint cleanup PRs (adding return types, renaming identifiers, fixing lint violations) that don't change implementation behavior, **do not add changelog entries**. Changelogs are for changes that impact consumers of the package.
- **[shr-006] Review-Comment Resolution Requires Code Push**: When asked to resolve PR review comments, implement the requested code changes and push in the same turn; do not stop at drafting reply text. Include commit hash and push confirmation. If the request is wording-only, explicitly state that no code changes were made.
- **[shr-007] Regenerate messenger action types**: When adding methods to a controller/service's `MESSENGER_EXPOSED_METHODS` in metamask-core, regenerate the `*-method-action-types.ts` file with `yarn messenger-action-types:generate` (package script backed by `packages/messenger-cli`); never hand-edit it. Method JSDoc is copied verbatim into the generated public action-type docs — write the JSDoc carefully before generating.

## Useful Code Snippets and Templates (CODE)

Reusable patterns and specific syntax requirements.

- **[code-001] Gating Accounts API calls in AssetsController tests — flush before arming**: `AccountsApiDataSource` populates `activeChains` asynchronously via a constructor-time `fetchV2SupportedNetworks` call. Arming a query-API gate before that resolves makes `getAssets` skip the gated balances call (no active chains) and settle synchronously — mid-flight state assertions observe `{}`. Deterministic pattern:
  1. Construct controller.
  2. `await flushPromises()` with the gate DISARMED — construction-time networks fetch resolves, populating `activeChains`.
  3. Arm.
  4. Call `getAssets` — parks on the gated `fetchV5MultiAccountBalances`.
  5. Unlock-trigger flows: let the first `activateTracking(messenger)` settle disarmed, then publish `KeyringController:lock`, arm, publish `KeyringController:unlock` — `#stop()` clears subscriptions so `#start()` re-runs `#runStartupRefresh` with the gate armed.
  6. Gate ALL Accounts API calls (including `fetchV2SupportedNetworks`) so the data source's 20-minute chains-refresh interval doesn't fire mid-test.

## Troubleshooting and Pitfalls (TS)

Lessons learned from past execution failures or resource constraints.

- **[ts-001] Lint Cleanup Process**: Format with **oxfmt**, not Prettier — `yarn prettier --check` passes on files that `lint:misc:check` rejects (oxfmt also sorts imports; Prettier does not). Use two commands in sequence:
  1. `yarn eslint <file> --fix --prune-suppressions` — fixes lint issues and removes unused suppressions from `eslint-suppressions.json`.
  2. `yarn lint:misc --write <files>` (i.e. `oxfmt`), then verify with `yarn lint:misc:check` — the CI `Lint (lint:misc:check)` job.
- **[ts-002] Changelog CI Requirement**: The CI "Check changelog" job fails if you modify a package without updating its `CHANGELOG.md`. Add entries under `## [Unreleased]` with a link to the PR: `([#XXXX](https://github.com/MetaMask/core/pull/XXXX))`.
- **[ts-003] Private Member Hash Syntax**: The repo enforces using hash syntax (`#memberName`) for private class members instead of TypeScript's `private memberName`. ESLint will flag `private readonly` as violations.
- **[ts-004] superstruct StructError message format**: In @metamask/superstruct v3.4+, a failing `define`/`definePattern` struct (e.g. `CaipAssetTypeStruct`) throws ``Expected a value of type `StructName`, but received: `value` `` — not classic superstruct's "Expected a StructName, but received ...". Nested failures are prefixed with the dotted path: `At path: importedAssets.1 -- Expected a value of type ...`. Write jest `toThrow` regexes accordingly (e.g. /At path: importedAssets\.1 -- Expected a value of type `CaipAssetType`/u).
- **[ts-005] Include eslint-suppressions.json in the oxfmt step**: `yarn eslint --fix --prune-suppressions` rewrites `eslint-suppressions.json` without a trailing newline, failing `yarn lint:misc:check`. After running it, include `eslint-suppressions.json` in the follow-up `yarn lint:misc --write eslint-suppressions.json` (or run `yarn lint:misc --write` from the repo root) before checking.
- **[ts-006] Commits: disable GPG signing per-invocation; never amend after pushing**: Local git config has `commit.gpgsign=true`, so plain `git commit` tries to sign — the pi harness blocks commit/amend on passphrase risk. MetaMask/core does not require signed commits.
  1. Use `git -c commit.gpgsign=false commit --author="Prithpal Sooriya <prithpal.sooriya@gmail.com>" ...` — no passphrase needed.
  2. For a pushed-commit fixup (e.g. embedding the PR link in the changelog), do NOT amend — force-push is guard-blocked and the push is rejected as non-fast-forward. Instead `git reset --soft <remote-sha>`, commit the fixup as a NEW commit, push normally (fast-forward). Prefer changelog-PR-link updates as a follow-up commit from the start.
