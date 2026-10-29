---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Display parts for dense desktop UIs, all opt-in:

- `Progress status="neutral"`: a grey fill, e.g. for a cancelled transfer (also React Native)
- `Avatar initials`: own initials instead of the ones from `name` ("MS" for "my-server"; also React Native)
- `Card size="sm"`: smaller radius, padding and title, for lists of cards inside a dialog (`wc-card-sm` in HTML);
  `ConfigProvider size` leaves cards alone
- `Code` in the main package: code in a sentence with the look of `InlineCode`, without syntax colours and without the
  optional `shiki`

`rounded-card` and `rounded-panel` now count as radii for tailwind-merge (like `rounded-popup`): another radius in
`class`/`classes` replaces them instead of both classes ending up on the element.
