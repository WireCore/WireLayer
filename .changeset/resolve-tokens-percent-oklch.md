---
'@wirecore/wirelayer-tokens': patch
---

`parse` (and with it `resolveTokens` / `useResolvedTokens`) reads OKLCH colors with the lightness or chroma in
percent, as minified CSS writes them (`oklch(47% .13 155)`). Before, the status colors resolved to `#NaNNaNNaN`.
