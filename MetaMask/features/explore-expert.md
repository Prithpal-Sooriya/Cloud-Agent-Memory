# Explore Feature Expert Knowledge Base

> **Purpose**: Source of truth for AI agents working on the Trending/Explore feature in MetaMask Mobile.

## 1. Feature Mission

The **Explore** feed (code name: "Trending") is the discovery engine surfacing real-time market data across four verticals:

| Section         | Data Source                                  | Display Type |
| --------------- | -------------------------------------------- | ------------ |
| **Predictions** | PredictController (Polymarket)               | Carousel     |
| **Tokens**      | `@metamask/assets-controllers` token-service | Card list    |
| **Perps**       | HyperLiquid WebSocket stream                 | Card list    |
| **Sites**       | Portfolio API (`/explore/sites`)             | Card list    |

**Entry Point**: `app/components/Views/TrendingView/TrendingView.tsx` → `ExploreFeed` component

---

## 2. Architecture: Config-Driven Design

### The Configuration Hub

**`app/components/Views/TrendingView/sections.config.tsx`** is the single source of truth for all sections.

```typescript
interface SectionConfig {
  id: SectionId; // 'predictions' | 'tokens' | 'perps' | 'sites'
  title: string;
  icon: IconName;
  viewAllAction: (navigation) => void;
  RowItem: React.ComponentType; // Row component for items
  OverrideRowItemSearch?: React.ComponentType; // Optional different row for search
  Skeleton: React.ComponentType;
  Section: React.ComponentType; // SectionCard or SectionCarrousel
  useSectionData: (searchQuery?) => { data; isLoading; refetch };
  SectionWrapper?: React.ComponentType; // Optional provider wrapper (Perps uses this)
}
```

**Key Arrays**:

- `HOME_SECTIONS_ARRAY` → Feed order: predictions, tokens, perps, sites
- `SECTIONS_ARRAY` → QuickActions/Search order: tokens, perps, predictions, sites

**Architectural Benefit**: New sections require changes ONLY in this file.

---

## 3. Data Layer

### Token Service (`@metamask/assets-controllers`)

**Endpoint**: `https://token.api.cx.metamask.io`

| Function            | Hook Consumer        | Purpose                             |
| ------------------- | -------------------- | ----------------------------------- |
| `getTrendingTokens` | `useTrendingRequest` | Fetch trending list                 |
| `searchTokens`      | `useSearchRequest`   | Token search by name/symbol/address |

**Key Parameters for `getTrendingTokens`**:

- `chainIds`: Array of CAIP chain IDs
- `sortBy`: `m5_trending` | `h1_trending` | `h6_trending` | `h24_trending`
- `excludeLabels`: `['stable_coin', 'blue_chip']` (filters "boring" tokens)
- `minLiquidity`, `minVolume24hUsd`, `minMarketCap`

### Hook Chain

```
useTrendingSearch (combines results)
├── useTrendingRequest → getTrendingTokens API
└── useSearchRequest → searchTokens API (when query exists)
```

**Race Condition Protection**: `useTrendingRequest` uses `requestIdRef` to discard stale responses.

### Other Data Sources

| Hook                   | Source                                       | Notes                          |
| ---------------------- | -------------------------------------------- | ------------------------------ |
| `useSitesData`         | `portfolio.api.cx.metamask.io/explore/sites` | Local filtering for search     |
| `usePredictMarketData` | `Engine.context.PredictController`           | Retry with exponential backoff |
| `usePerpsMarkets`      | WebSocket via `PerpsStreamProvider`          | Requires connection providers  |

---

## 4. Component Structure

### Key Components

| Component              | File                                           | Responsibility                                      |
| ---------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `ExploreFeed`          | `TrendingView/TrendingView.tsx`                | Main orchestrator, manages refresh & section states |
| `Section`              | `TrendingView/components/Sections/Section.tsx` | Generic wrapper connecting config to data/UI        |
| `SectionCard`          | `Sections/SectionTypes/SectionCard.tsx`        | Vertical list (tokens, perps, sites)                |
| `SectionCarrousel`     | `Sections/SectionTypes/SectionCarrousel.tsx`   | Horizontal carousel (predictions)                   |
| `QuickActions`         | `TrendingView/components/QuickActions/`        | Section jump buttons                                |
| `ExploreSearchBar`     | `TrendingView/components/ExploreSearchBar/`    | Dual-mode: button or interactive                    |
| `TrendingTokenRowItem` | `UI/Trending/components/TrendingTokenRowItem/` | Single token row                                    |

### State Management

**Section State Tracking** (`useSectionStateTracker`):

- Tracks `emptySections` → Hides sections with no data
- Tracks `loadingSections` → Shows loading indicator

**Refresh Config**:

```typescript
{ trigger: number, silentRefresh: boolean }
// silentRefresh: true = show skeletons, false = show loading indicator only
```

**Session Analytics**: `TrendingFeedSessionManager` (Singleton) tracks session time, entry point.

---

## 5. Styling Rules

**CRITICAL**: The app uses **Hybrid Styling**. Do NOT mix approaches.

| Component                  | Styling Approach | Example                           |
| -------------------------- | ---------------- | --------------------------------- |
| `TrendingView`, `Section*` | Tailwind         | `twClassName="flex-1 bg-default"` |
| `TrendingTokenRowItem`     | StyleSheet       | `styles.container`                |
| Design system components   | Props            | `variant={TextVariant.BodyMd}`    |

---

## 6. Navigation Routes

```typescript
// Explore stack
Routes.TRENDING_FEED        // Main feed
Routes.EXPLORE_SEARCH       // Search screen
Routes.SITES_FULL_VIEW      // Sites full view

// External navigation
Routes.WALLET.TRENDING_TOKENS_FULL_VIEW
Routes.PERPS.ROOT → Routes.PERPS.MARKET_LIST
Routes.PREDICT.ROOT → Routes.PREDICT.MARKET_LIST
Routes.BROWSER.HOME → Routes.BROWSER.VIEW
```

**Browser Navigation Pattern**:

```typescript
navigation.navigate(Routes.BROWSER.HOME, {
  screen: Routes.BROWSER.VIEW,
  params: { newTabUrl: url, timestamp: Date.now(), fromTrending: true },
});
```

---

## 7. Feature Flags & Conditionals

| Selector                                   | Effect                                                    |
| ------------------------------------------ | --------------------------------------------------------- |
| `selectBasicFunctionalityEnabled`          | `false` → Shows `BasicFunctionalityEmptyState`            |
| `selectNetworkConfigurationsByCaipChainId` | Token tap → May show `NetworkModals` if network not added |

---

## 8. Common Bug Areas

### 1. Section Visibility Flashing

**Symptom**: Section appears/disappears during load.
**Cause**: `toggleSectionEmptyState` called while loading.
**Fix**: In `Section.tsx`, only call when `!isLoading`.

### 2. Stale Search Results

**Symptom**: Wrong results appear after fast typing.
**Cause**: Race condition in debounced requests.
**Protection**: `useExploreSearch` tracks `isDebouncing = query !== debouncedQuery`.

### 3. Token Network Not Added

**Symptom**: Tap token → nothing happens or wrong screen.
**Cause**: Network not in user's wallet.
**Fix Location**: `TrendingTokenRowItem` → `handlePress` checks `networkConfigurations[caipChainId]`.

### 4. Empty Perps/Predict Sections

**Symptom**: Section empty despite API availability.
**Cause**: WebSocket connection failure or geo-blocking.
**Key Files**: `PerpsConnectionProvider.tsx`, `PerpsStreamManager.tsx`.

### 5. Refresh State Mismatch

**Symptom**: Loading indicator shows/hides incorrectly.
**Cause**: `silentRefresh` flag coordination issue.
**Key**: Pull-to-refresh uses `silentRefresh: true`, background refresh uses `false`.

### 6. Asset Navigation Params Wrong

**Symptom**: Token details page shows wrong data.
**Fix Location**: `TrendingTokenRowItem` → `getAssetNavigationParams`.
**Key Conversions**: CAIP chain ID → Hex, Asset identifier → Token address.

### 7. Carousel Snap Issues

**Location**: `SectionCarrousel.tsx`
**Config**: `snapToInterval={CARD_WIDTH}`, `decelerationRate="fast"`, `pagingEnabled={false}`.

---

## 9. Key Files Reference

| Category            | Path                                                                |
| ------------------- | ------------------------------------------------------------------- |
| **Config Hub**      | `app/components/Views/TrendingView/sections.config.tsx`             |
| **Main Feed**       | `app/components/Views/TrendingView/TrendingView.tsx`                |
| **Token Row**       | `app/components/UI/Trending/components/TrendingTokenRowItem/`       |
| **Trending Hook**   | `app/components/UI/Trending/hooks/useTrendingRequest/`              |
| **Search Hook**     | `app/components/UI/Trending/hooks/useTrendingSearch/`               |
| **Sites Hook**      | `app/components/UI/Sites/hooks/useSiteData/`                        |
| **Session Manager** | `app/components/UI/Trending/services/TrendingFeedSessionManager.ts` |
| **Networks List**   | `app/components/UI/Trending/utils/trendingNetworksList.ts`          |
| **Token Service**   | `node_modules/@metamask/assets-controllers/dist/token-service`      |

---

## 10. Testing Essentials

**Key TestIDs**:

- `trending-view-browser-button`, `explore-view-search-button`
- `quick-action-{sectionId}`, `basic-functionality-empty-state`
- `trending-tokens-list`, `site-row-item`

**Required Mocks**:

- Navigation: `useNavigation` → `{ navigate, goBack }`
- Redux: `selectBasicFunctionalityEnabled`, `selectNetworkConfigurationsByCaipChainId`
- Hooks: `useTrendingRequest` → `{ results, isLoading, error, fetch }`

---

## 11. Dangerous Zones ⚠️

1. **`TrendingFeedSessionManager`**: Singleton sensitive to lifecycle. Don't modify unless fixing analytics.
2. **`sections.config.tsx` IDs**: Changing `'tokens'`, `'perps'` etc. breaks analytics and persisted state.
3. **`requestIdRef` in hooks**: Critical for race condition prevention. Understand before modifying.
4. **Perps Providers**: `PerpsConnectionProvider` + `PerpsStreamProvider` must wrap Perps section.

---

## 12. Adding a New Section (Checklist)

1. Add ID to `SectionId` type in `sections.config.tsx`
2. Add config object to `SECTIONS_CONFIG`
3. Add to `HOME_SECTIONS_ARRAY` and `SECTIONS_ARRAY`
4. Create data hook: `useSectionData(searchQuery?) => { data, isLoading, refetch }`
5. Create `RowItem` component
6. Create `Skeleton` component
7. (Optional) Create `SectionWrapper` for providers
