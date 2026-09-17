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
- **[shr-008] Terse JSDoc/comments only**: In MetaMask repos, keep JSDoc to a one-to-two-line summary plus only the necessary `@param`/`@returns`/`@throws` tags. No multi-paragraph essays, rationale, or inline examples in code comments — rationale belongs in the PR description or README. Remember method JSDoc is copied verbatim into generated files (e.g. `*-method-action-types.ts`), so verbosity is amplified.

## Useful Code Snippets and Templates (CODE)

Reusable patterns and specific syntax requirements.

_No entries yet._

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
- **[ts-007] Open same-repo PRs against MetaMask/core — fork PRs structurally fail CI**: "Check changelog" and "Validate changelog diffs" resolve `origin/<head-ref>` inside MetaMask/core — github-tools `check-changelog@v1` checks out `repo: github.repository` + `ref: github.head_ref`; `check-merge-queue-changelogs` runs `git merge-base origin/<base> origin/<pr-branch>` — so ANY fork-sourced PR fails them (`fatal: Not a valid object name origin/<branch>`) regardless of content. The account has write access to MetaMask/core (verify: `gh api repos/MetaMask/core/collaborators/Prithpal-Sooriya/permission` → `write`; `origin` remote is SSH).
  1. Preferred flow: `git push origin <branch>` (feature branch to upstream via SSH) → `gh pr create --repo MetaMask/core --base main --head <branch>` — all checks green.
  2. If a fork PR already exists: prove changelog content locally with `node .github/actions/check-merge-queue-changelogs/check-changelog-diff.cjs <base-changelog> <pr-changelog> <merged-changelog>` (exit 0 = content fine), then close the fork PR with an explanatory comment, open the same-repo PR, update changelog links to the new PR number, and delete the redundant fork branch (`git push git@github.com:Prithpal-Sooriya/core.git --delete <branch>`).
- **[ts-008] MetaMask/core PR review conventions + transient-state concurrency pattern (from PR #10230 round 1)**: Reviewer conventions, concurrency pattern, and thread hygiene:
  1. Keep PRs minimal — no explanatory doc comments on new state fields/metadata/helpers (repo lint does not require JSDoc; strip to zero unless pre-existing style has them).
  2. Changelog entries are ONE sentence — no enumeration of new exports.
  3. After any public-method JSDoc change, re-run `yarn workspace <pkg> run messenger-action-types:generate`; verify the generated file has ZERO diff vs main if the reviewer asked for no generated-file churn.
  4. Prefer simple value unions (`'loading' | 'loaded'`) over rich encodings (trigger unions) unless the reviewer asks for context — the reviewer explicitly said "it is meant to be a 1-time loading for now".
  5. Transient UX state attached to mutex-serialized fetches: set the marker at EVENT time BEFORE `await mutex.acquire()` (queued switches then mark their accounts immediately) and settle to the terminal value in an OUTER `finally` wrapping the entire mutex section — never only inside the post-mutex fetch (Bugbot flags exactly this as "Queued switch omits loading status").
  6. Thread hygiene: reply via `gh api repos/MetaMask/core/pulls/<n>/comments --input -` with `{"body":..., "in_reply_to":<commentId>}`, then resolve each with GraphQL `resolveReviewThread(input:{threadId:"PRRT_..."})`; re-requesting review from the PR author's own account 422s — human re-approves manually.
- **[ts-009] Write repetitive tests as it.each tables**: In MetaMask repos, when new tests repeat the same body across methods/inputs/statuses (mirrored method pairs, error-status sweeps, malformed-input cases, cache-invalidation trios), write them as `const testCases = [...] as const` + `it.each(testCases)('...', ...)` from the start — split per scenario, not one massive array. House patterns: `it.each([401, 500])('throws ... %s')`, object rows with `$prop` title interpolation, `describe.each` for mirrored describes. Use `as const` rows so `service[method]` indexing stays type-safe (spread readonly `ids` with `[...ids]` at call sites), and remember arrow functions in table rows need explicit return types for `explicit-function-return-type`.
