---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Banner for permanent, page-wide notices ("TEST SYSTEM", maintenance): `solid` fills it opaquely in the colour of the
variant with the matching text colour (info → `bg-info text-on-info`, …, neutral → `bg-fg text-bg`); `position="sticky"`
keeps it in the flow and at the top edge while the page scrolls (opaque also without `solid`, below dialogs and
drawers). React Native gets `solid` (no `sticky`). Stories _Solid_ and _Sticky_.
