# Playbook: MetaMask/metamask-extension

This is an evolving playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Strategies and Hard Rules (SHR)

These are environment-specific guidelines and mandatory workflows.

* **[shr-001] Environment Setup**: To initialize the development environment, always run `nvm install && nvm use && corepack enable && yarn install`. This ensures the correct Node.js version from `.nvmrc` and Yarn version via Corepack are utilized.
  * **Helpful:** 1 | **Harmful:** 0


* **[shr-002] Pre-Commit Validation**: Before pushing any code, you must execute `yarn lint:tsc`. Commits are only permitted if this check passes with zero errors.
  * **Helpful:** 1 | **Harmful:** 0

* **[shr-003] Dependency Upgrade Scoping**: When upgrading dependencies, only modify `package.json` and `yarn.lock`. If TypeScript or lint errors appear in other files, verify they are directly caused by the upgrade before touching them. Pre-existing issues should not be addressed in the upgrade PR.
  * **Helpful:** 0 | **Harmful:** 0
 
* **[shr-004] Cloud task instructions priority**: When Cloud Agent instructions require committing, pushing, or running tests, follow those requirements even if repo-level AGENTS.md says not to commit/stage by default.
  * **Helpful:** 1 | **Harmful:** 0

## Useful Code Snippets and Templates (CODE)

Reusable patterns and specific syntax requirements.

* **[code-001] Mocha Type Fix**: When using `it.each` for table-driven tests, you must prepend the call with the specific TypeScript override to avoid type definition errors:
```typescript
// @ts-expect-error This is missing from the Mocha type definitions
it.each([...])

```


*Reference:* `ui/components/app/alert-system/utils.test.ts`.
  * **Helpful:** 1 | **Harmful:** 0



## Troubleshooting and Pitfalls (TS)

Lessons learned from past execution failures or resource constraints.

* **[ts-001] Memory-Efficient Testing**: When running specific tests via `yarn jest <path>`, if the process encounters RAM memory limits, prepend the command with `NODE_OPTIONS=--max-old-space-size=4096`. Note that the full `yarn test` suite is prone to timeouts.
  * **Helpful:** 1 | **Harmful:** 0


* **[ts-002] Jest Coverage Overhead**: Always append `--coverage=false` when running individual Jest tests to reduce execution time and resource consumption.
  * **Helpful:** 1 | **Harmful:** 0
