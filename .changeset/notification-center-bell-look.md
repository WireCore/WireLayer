---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

NotificationCenter: the look of the bell is configurable – `variant` (IconButton variant, default `text` as before),
`color` and `size`, for `display="popover"` and `"drawer"`. A bell in a header with outlined icon buttons (e.g.
`ModeToggle variant="outline"`) can now match them: `<NotificationCenter variant="outline" size="sm" />`. React Native:
the same props (without them the bell keeps the IconButton default).
