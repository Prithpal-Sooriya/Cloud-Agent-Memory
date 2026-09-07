# Playbook: MetaMask/metamask-extension

This is an evolving playbook. Rules are structured as itemized bullets with unique IDs to allow for incremental updates and to prevent "context collapse".

## Strategies and Hard Rules (SHR)

These are environment-specific guidelines and mandatory workflows.

- **[shr-001] Environment Setup**: Initialize with `nvm install && corepack enable && yarn install`, then pin Node by the **literal version in `.nvmrc`**, not by `nvm current`: `export PATH="$HOME/.nvm/versions/node/v<version-from-.nvmrc>/bin:$PATH"; hash -r`. `nvm use` alone loses to `/exec-daemon/node` (Node 22) on PATH, and `$(nvm current)` still reports the *pre-install* version when it runs in the same command chain as `nvm install`, which silently pins the wrong Node and makes `yarn install` fail project validation with "current Node version X does not satisfy the required version". Verify with `node --version` before running yarn. Also export `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` so Corepack does not block on its download prompt. Before any of this, check `/tmp/cursor/async-install/install-user.log`: when it says "Started from stale build ..., skipping install script" **no repo has `node_modules`** and a full install is required (~2.5 min for metamask-extension) — run it in a tmux session and keep investigating while it installs.
- **[shr-002] Pre-Commit Validation**: Before pushing any code, you must execute `yarn lint:tsc`. Commits are only permitted if this check passes with zero errors.
- **[shr-003] Dependency Upgrade Scoping**: When upgrading dependencies, only modify `package.json` and `yarn.lock`. If TypeScript or lint errors appear in other files, verify they are directly caused by the upgrade before touching them. Pre-existing issues should not be addressed in the upgrade PR.
- **[shr-004] Cloud Task Instructions Priority**: When Cloud Agent instructions require committing, pushing, or running tests, follow those requirements even if repo-level `AGENTS.md` says not to commit/stage by default.

## Useful Code Snippets and Templates (CODE)

Reusable patterns and specific syntax requirements.

- **[code-001] Mocha Type Fix**: When using `it.each` for table-driven tests, prepend the call with a TypeScript override to avoid type-definition errors. _Reference:_ `ui/components/app/alert-system/utils.test.ts`.

  ```typescript
  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([...])
  ```

## Troubleshooting and Pitfalls (TS)

Lessons learned from past execution failures or resource constraints.

- **[ts-001] Memory-Efficient Testing**: When running specific tests via `yarn jest <path>`, if the process encounters RAM memory limits, prepend the command with `NODE_OPTIONS=--max-old-space-size=4096`. Note that the full `yarn test` suite is prone to timeouts.
- **[ts-002] Jest Coverage Overhead**: Always append `--coverage=false` when running individual Jest tests to reduce execution time and resource consumption.
