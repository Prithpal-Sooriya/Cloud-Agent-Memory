# Playbook: MetaMask/metamask-core
This is an evolving playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Strategies and Hard Rules (SHR)
These are environment-specific guidelines and mandatory workflows.

* **[shr-001] Environment Setup**: To initialize the development environment, run `nvm use && yarn install` in the root directory.
  * **Helpful:** 0 | **Harmful:** 0

* **[shr-002] Project Type**: This is a monorepo that contains many packages.
  * **Helpful:** 0 | **Harmful:** 0

* **[shr-003] Type Checking**: Run `build:clean` to run type checking during build.
  * **Helpful:** 0 | **Harmful:** 0

* **[shr-004] Changelog Requirements**: Once a PR is made, update the related files changelog to reflect the file changes. Add the correct PR link to the changelog. Changelog users are developers consuming the package.
  * **Helpful:** 0 | **Harmful:** 0

* **[shr-005] Changelog Exceptions**: For ESLint cleanup PRs (adding return types, renaming identifiers, fixing lint violations) that don't change implementation behavior, **do not add changelog entries**. Changelogs are for changes that impact consumers of the package.
  * **Helpful:** 0 | **Harmful:** 0

## Useful Code Snippets and Templates (CODE)
Reusable patterns and specific syntax requirements.

*No entries yet.*

## Troubleshooting and Pitfalls (TS)
Lessons learned from past execution failures or resource constraints.

*No entries yet.*
