---
'@wirecore/wirelayer-tokens': minor
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Themes can set the hover of the primary color: the optional token `primary-hover` is the fill of solid primary buttons
and the text of tinted ones (`soft`, `outline`, `text` in the primary color, Button and IconButton, and avatar buttons
with `color="primary"`) on hover – for strong brand colors whose faded hover or tinted text misses 4.5:1. `checkTheme`
checks the hover pairs with it, and `suggestThemeFixes` suggests one `primary-hover` for all of them before it changes
`primary`.

Changed behavior:

- Without `primary-hover`, solid primary buttons now fade only their fill on hover (to 85 % via `color-mix`), no longer
  the whole button with `opacity` – the text stays opaque. The bundled themes look the same, the contrast is never
  lower. The other solid colors keep fading with `opacity`.
- `checkTheme` additionally checks tinted primary text at rest (`soft primary: text-primary on bg-primary/10` on `bg`,
  `bg-2`, `card`, and `avatar primary: text-primary on primary/14 (card)`), which the hover pairs no longer imply. A
  custom theme that missed a tinted primary hover may be reported for these pairs too.
