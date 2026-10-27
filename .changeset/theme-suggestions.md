---
'@wirecore/wirelayer-tokens': minor
---

`suggestThemeFixes(theme)`: the pairs `checkTheme` reports, each with suggestions – the nearest variant of a colour of
the pair that meets the contrast (lightness moved in OKLCH, hue kept, chroma only lowered where sRGB needs it) and, for
text on a colour, a light or dark `on-*` colour; a suggestion never breaks a pair that passed. `checkTheme` stays as it
is. Also new: `rgbToOklch`, `oklchToRgb`, `inGamut`, `toHex`.
