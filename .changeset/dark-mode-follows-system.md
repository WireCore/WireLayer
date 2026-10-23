---
'@wirecore/wirelayer-tokens': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

**Behavior change:** without `data-mode` the page now follows the system setting (`prefers-color-scheme`) instead
of always being light. `data-mode="light"` or `data-mode="dark"` forces a mode as before, also for a part of the page
(a forced light part stays light on a dark system).

- The `dark:` variant follows the same rules, and so do the dark colors of the built-in themes and of custom themes
  generated with `themeToCss`.
- Charts (Chart, ChartCanvas, Sparkline) recolor when the system setting changes.
- Apps that relied on "no attribute = light" and want to keep it: set `data-mode="light"` on `<html>`. Apps that set
  `data-mode` from `prefers-color-scheme` with JavaScript can drop that.
