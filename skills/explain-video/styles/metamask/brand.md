# MetaMask — Brand

Values come from the `@metamask/design-tokens` package in
[MetaMask/metamask-design-system](https://github.com/MetaMask/metamask-design-system)
(`packages/design-tokens/src/css`), after the September 2026 brand-palette refresh
(PR #1496 "update brand accent colors", PR #1489 "replace Geist with Inter").

## Color

| Token | Value | Source token | Use |
|---|---|---|---|
| `--color-bg` | `#000000` | `background-default` (dark) | Canvas. OLED black, not charcoal. |
| `--color-surface` | `#18181b` | `background-section` | Cards, panels. |
| `--color-surface-2` | `#222226` | `background-subsection` | Nested rows, code blocks. |
| `--color-fg` | `#ffffff` | `text-default` | Headlines and body. |
| `--color-muted` | `#a3a4a7` | `text-alternative` | Secondary copy. |
| `--color-accent` / `--mm-orange` | `#fa4b00` | `orange400` (was `#ff5c16`) | The brand signal: key word, active item, glow. |
| `--mm-blue` | `#8b99ff` | `primary-default` | Interactive/primary things, links, "the flow". |
| `--mm-lime` | `#b9f302` | `success-default` | Success, "after", added lines. |
| `--mm-purple` | `#c66ef5` | `purple300` | Third category colour. |
| `--mm-red` | `#ff7584` | `error-default` | Removed lines, errors. Sparingly. |
| `--mm-yellow` | `#f0b034` | `warning-default` | Warnings. |

Rule of thumb: **one orange moment per scene**, blue for structure, lime for "good".

## Typography

- **Inter** for display and body (design-system default since PR #1489). Display is 700 with
  tight tracking (-0.03em); body is 400/500.
- MetaMask's `MMSans` (accent) and `MMPoly` (hero) are the proprietary brand faces. They are
  not licensed for this repo, so they are *not* embedded. Two open PRs
  (#1499, #1581) are still deciding their replacement — revisit when one merges.
- **JetBrains Mono** for code and identifiers. Inferred: the tokens define no mono face.

## Shape and surface

Rounded everywhere (12 / 20 / 28px, pills for chips). Dark surfaces are stepped greys with a
1px cool-tinted hairline (`#e2e2ff` at 15%), echoing the app's elevation model. No hard
corners, no blueprint grid.

## Logo

The fox mark is deliberately **not** bundled: use the official asset from MetaMask brand
resources if a scene needs it. Without it, set the wordmark as plain text "MetaMask" in
Inter 700.
