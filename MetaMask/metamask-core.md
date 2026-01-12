# Playbook: MetaMask/metamask-core
This is an evolving playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Strategies and Hard Rules (SHR)
These are environment-specific guidelines and mandatory workflows.

* **[shr-001] Environment Setup**: To initialize the development environment, run `nvm use && yarn install` in the root directory.
  * **Helpful:** 1 | **Harmful:** 0

* **[shr-002] Project Type**: This is a monorepo that contains many packages.
  * **Helpful:** 1 | **Harmful:** 0

* **[shr-003] Type Checking**: Run `build:clean` to run type checking during build.
  * **Helpful:** 1 | **Harmful:** 0

* **[shr-004] Changelog Requirements**: Once a PR is made, update the related files changelog to reflect the file changes. Add the correct PR link to the changelog. Changelog users are developers consuming the package.
  * **Helpful:** 1 | **Harmful:** 0

* **[shr-005] Changelog Exceptions**: For ESLint cleanup PRs (adding return types, renaming identifiers, fixing lint violations) that don't change implementation behavior, **do not add changelog entries**. Changelogs are for changes that impact consumers of the package.
  * **Helpful:** 1 | **Harmful:** 0

## Useful Code Snippets and Templates (CODE)
Reusable patterns and specific syntax requirements.

*No entries yet.*

## Troubleshooting and Pitfalls (TS)
Lessons learned from past execution failures or resource constraints.

* **[ts-001] Lint Cleanup Process**: When running lint cleanup, use two commands in sequence:
  1. `yarn eslint <file> --fix --prune-suppressions` - fixes lint issues and removes unused suppressions from `eslint-suppressions.json`
  2. `yarn prettier --write <files> eslint-suppressions.json` - formats files including the suppressions file (needs trailing newline)
  * **Helpful:** 1 | **Harmful:** 0

* **[ts-002] Changelog CI Requirement**: The CI "Check changelog" job fails if you modify a package without updating its `CHANGELOG.md`. Add entries under `## [Unreleased]` with a link to the PR: `([#XXXX](https://github.com/MetaMask/core/pull/XXXX))`.
  * **Helpful:** 1 | **Harmful:** 0

* **[ts-003] Private Member Hash Syntax**: The repo enforces using hash syntax (`#memberName`) for private class members instead of TypeScript's `private memberName`. ESLint will flag `private readonly` as violations.
  * **Helpful:** 1 | **Harmful:** 0
