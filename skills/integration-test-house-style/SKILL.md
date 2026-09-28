---
name: integration-test-house-style
description: Write new `*.integration.test.ts` files in MetaMask/core in the house style — the 8-step template (header docblock after imports, response-surface tables, describe.each rows, one run<Thing> helper, tiny named helpers, toStrictEqual assertions, shared fixture builders, numeric-range comments) plus an oxlint/jest/jsdoc authoring-gotchas checklist. Use when writing, reviewing, or adapting an integration test for assets-controller fast-lane or controller pipelines (v5/v6 lanes, remote-feature-flag lanes), when a playbook entry points here, or when converting an ad-hoc integration test to the house format. Exemplar packages/assets-controller/src/pipeline/buildFastFetchSources.bsc-spam-token-filtering.integration.test.ts.
---

# Integration Test House Style (MetaMask/core)

House format for new `*.integration.test.ts` files in MetaMask/core.
Exemplar: `packages/assets-controller/src/pipeline/buildFastFetchSources.bsc-spam-token-filtering.integration.test.ts`.

Write new files in this exact format:

1. **Header docblock placed AFTER the imports** (not at file top): one paragraph naming the lane + wallet/report, a line "Executes the real <lane> against realistic APIs." (controller level: "Boots the real controller…"), then `Integration Expectation - <one line>.`
2. **Response-surface table**: `type ResponseSurface = { surface: string; lookUp: (response: DataResponse, assetId: string) => unknown }` with named consts (`BALANCES`, `METADATA`, `PRICES`, `DETECTED_ASSETS`; `lookUp` uses `getIgnoringCase` / `Object.values(detectedAssets).flat().find(…)`). Drive assertions with `it.each([BALANCES, METADATA, PRICES])('$surface - <expectation>', ({ lookUp }) => …)`. Controller-level variant: `StateSurface` with `lookUp(state, assetId)`.
3. **`describe.each` rows when runs share its** — passes, lanes (`const LANES: { name: string; lane: 'v5' | 'v6' }[]`), or remote-flag lanes (`UPDATE_LANES` with `remoteFeatureFlags?: FeatureFlags`); title `'$name: <scenario>'`, one `beforeAll` run, many small `it`s. Never duplicate a whole describe for a lane/flag variant.
4. **One `run<Thing>` helper** (options object with defaults) constructing ALL real sources/middlewares, real nock mocks, `destroy()`/`clear()` cleanup, returning a NAMED result type (e.g. `WsUpdatePassResult`) — never `Awaited<ReturnType<…>>` at each describe.
5. **Tiny named helpers over inline machinery**: `askedAbout(batches: string[][]): Set<string>` for API-batch assertions; a typed accessor (e.g. `priceOf(state, assetId): number`) instead of repeating `as { price: number }` casts; `createRecording<X>(): { source; requests }` stubs (mirror `createRecordingRpcSource`).
6. **Assertions via `toStrictEqual`/`toMatchObject`/`toBeDefined` on the `lookUp` result — avoid `as` casts**; the only cast lives inside the typed accessor.
7. **Shared fixture builders for scenario state + combined events** in `src/__fixtures__/<scenario>/wsEvents.ts` / `wsWallet.ts` (e.g. `buildEthAndUsdcBalanceUpdatedEvent`, `buildEthHeldUnpricedState`, `buildUsdcHeldAndPricedState` + exported seeded consts like `SEEDED_USDC_PRICE`) so pipeline-level and controller-level tests share them.
8. Numeric-range assertions on captured market data stay (e.g. USDC peg 0.9–1.1) with a one-line `//` comment only where the name doesn't carry it.

## Authoring gotchas (oxlint/jest/jsdoc)

Before pushing a new file, check:

- `jest(expect-expect)` counts only raw `expect(` in the test body — assertion helpers like `expectAmount` do not count; give helper-only tests one explicit raw expect.
- jsdoc `require-param` fires on destructured arrow params even with a type annotation (`({ balance, decimals }: CapturedBalance)`) — use a named parameter.
- Use `toStrictEqual` for same-shape expectands (key sets, state slices).
- With yarn broken (lavamoat postinstall on Node 26), run `../../node_modules/.bin/oxlint <files>`, `.bin/oxfmt <files>`, and root `node_modules/.bin/tsc --build tsconfig.build.json` directly — the direct tsc build fully type-checks the monorepo and replaces the `yarn build` gate.

## Extending

New house rules belong first in a `memory-update` issue against `MetaMask/metamask-core.md` (CODE section); once applied, fold them into this skill and leave the playbook entry as the pointer.
