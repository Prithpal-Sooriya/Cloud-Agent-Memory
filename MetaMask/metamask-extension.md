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
- **[code-002] Arc / Stable dual-identity gas tokens (USDC, USDT0)**: On Arc (`0x13b2`/`eip155:5042`) the native gas token IS USDC and the same balance is *also* an ERC-20 at `0x3600000000000000000000000000000000000000` (Stable: USDT0 at `0x779ded0c9e1022225f8e0630b35a9b54be713736`). The Accounts API returns both identities for every account — native `eip155:5042/slip44:5042` at 18 decimals and the ERC-20 at 6 decimals, identical amounts, both priced by the price API. Rules to know before touching any of it: (1) asset-list/send surfaces keep the **native** entry and hide the ERC-20 via `ui/components/app/assets/enablement/networks-customization.ts`, while swap/bridge does the **reverse** (`BRIDGE_ASSET_PICKER_HIDDEN_ASSETS` in `shared/constants/bridge.ts` hides the native, because the router is only validated for the ERC-20) — never "unify" the two, they are deliberately opposite. (2) On the assets-unify-state path the native row is derived, not stored: `getAccountTrackerControllerAccountsByChainId` (`shared/lib/selectors/assets-migration.ts`, mirrored in mobile `app/selectors/assets/assets-migration.ts`) only emits it when `AssetsController.assetsInfo[assetId].type === 'native'`, seeded from core `packages/assets-controller/src/defaults.ts`. So any filter that removes the ERC-20 must first confirm the native entry is present, otherwise the token disappears from the list while the aggregated total (read straight off `assetsBalance`) still counts it — the ASSETS-3900 symptom. (3) `useArcDefaultTokens` (both clients) imports the ERC-20 id into custom assets, which is why manual import of `0x3600...` reports "token already added".

## Troubleshooting and Pitfalls (TS)

Lessons learned from past execution failures or resource constraints.

- **[ts-001] Memory-Efficient Testing**: When running specific tests via `yarn jest <path>`, if the process encounters RAM memory limits, prepend the command with `NODE_OPTIONS=--max-old-space-size=4096`. Note that the full `yarn test` suite is prone to timeouts.
- **[ts-002] Jest Coverage Overhead**: Always append `--coverage=false` when running individual Jest tests to reduce execution time and resource consumption.
- **[ts-003] Ticket attachments are unreachable — reconstruct state from the public MetaMask APIs**: State logs / files attached to a Jira ticket or linked from Slack cannot be downloaded on a Cursor Cloud VM (Jira attachment REST returns 403 with no injected Atlassian token, the Atlassian MCP has no attachment tool, `FetchMcpResource` 404s, and Slack DM channels return `channel_not_found`). Do not burn calls on it: pull the affected address out of the ticket and query the public APIs directly — `https://accounts.api.cx.metamask.io/v5|v6/multiaccount/balances?accountIds=eip155:<chain>:<address>&networks=eip155:<chain>` for the exact CAIP-19 asset IDs, decimals and balances the client will persist, `.../v2/accounts/<address>/balances?networks=<decimalChainId>` for the v2 shape, `.../v1/supportedNetworks` for chain coverage, and `https://price.api.cx.metamask.io/v3/spot-prices?assetIds=<caip19,...>&vsCurrency=usd` for pricing. This is stronger evidence than a state dump because it shows what the controller *will* receive. Related: `$JIRA_INTEGRATION_PLAYBOOK_URL` may hold a **local machine path**, not a URL — probe it with `${VAR:0:30}` (its full value is redacted in tool output) and skip it when it is not fetchable.
- **[ts-004] Use the Grep tool, not shell `rg`, when the match text matters**: ripgrep run through the Shell tool can come back with the *matched substrings replaced* in its output — searching `0x3600...|ARC_USDC|eip155:5042` returned lines where `ARC_USDC_ERC20_TOKEN_ADDRESS` had become `n_ERC20_TOKEN_ADDRESS` and every address/CAIP id had become a bare `n`. The file paths and line numbers stay correct, so it is still usable for "which files mention this", but never trust it for reading identifiers, addresses, or asset IDs. Use the Grep tool (correct rendering, supports `-C`/`glob`/`type`) for anything where you need to see the match, and fall back to reading the file.
