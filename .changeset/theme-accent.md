---
'@wirecore/wirelayer-tokens': minor
'@wirecore/wirelayer-css': minor
---

Themes can set a second brand color: the optional tokens `accent` and `on-accent` become the Tailwind colors
`bg-accent`, `text-accent`, `border-accent` and `text-on-accent` (also in React Native via `native.css`). Without them
they follow `primary` and `on-primary`, so existing themes stay as they are. `checkTheme` and `suggestThemeFixes` check
text on the accent and the accent as text on `bg`, `bg-2` and `card` once a theme sets `accent` or `on-accent` in a
mode. `resolveTokens()` returns them as well. No component uses the accent.
