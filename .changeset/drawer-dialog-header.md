---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Drawer and Dialog: own content in the header row – slot `#header` (Vue), prop `header` (React, React Native), e.g. the
logo of the app next to the close button of a navigation drawer.

- The content sits where title and description are, before the close button (Dialog: after the icon, before the
  maximize and close buttons), takes the free space and is centred with the close button (new recipe part
  `headerContent`, Drawer variant `customHeader`).
- The title stays required and keeps naming the panel (`aria-labelledby`); with header content it is shown for screen
  readers only by default. `hideTitle: false` shows it next to the content (Drawer) or where `titlePosition` puts it
  (Dialog). The description stays connected (`aria-describedby`).
- React Native Drawer (side panel and sheet): `header` and `hideTitle`; a hidden title names the panel via `aria-label`.
- Without header content nothing changes.
