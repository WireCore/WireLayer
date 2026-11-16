---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

NotificationCenter:

- Items without `href` can be `clickable`: their title becomes a button that reports `select` / `onSelect` (opt-in per
  item; items without both stay text). In React the event of `onSelect` is a `MouseEvent<HTMLAnchorElement |
HTMLButtonElement>` now.
- `markAllRead` / `onMarkAllRead` gets the ids of the unread items shown (Vue, React and React Native), e.g. for one
  request to the server instead of one per item.
