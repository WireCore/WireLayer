---
'@wirecore/wirelayer-tokens': minor
'@wirecore/wirelayer-css': minor
---

Slim scrollbars: `data-scrollbars="slim"` – on `<html>` for the whole page, or on any element for that part – draws
the scrollbars as a narrow, rounded stroke. `thin` is drawn by the browser, and in Chrome and Edge (above all on
Windows) it stays a system-like bar, depending on the version with arrow buttons and a square thumb; a stroke is only
possible through `::-webkit-scrollbar`, which Chromium ignores while `scrollbar-width` or `scrollbar-color` is set.

- Browsers with `::-webkit-scrollbar` (Chromium, Safari): the stroke is `--wc-scrollbar-size` wide (new variable, 6px),
  2px off the edge, no arrow buttons, the track and the corner transparent; under the pointer and while dragging the
  thumb takes the full 10px and `--wc-scrollbar-thumb-hover`. Colours from `--wc-scrollbar-thumb` (`line-strong`, at
  least 3:1 against the surfaces), so light, dark and parts with their own `data-mode` follow.
- Firefox keeps `thin` in the theme colours; forced colors keep the system scrollbars. The default (`thin`) and
  `data-scrollbars="native"` do not change.
- Docs: _Theming › Themes › Scrollbars › Slim scrollbars_ with a list and a table in light and dark.
