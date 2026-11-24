---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

DataTable: column option `hidden` – the column starts hidden and is shown with the column menu (`columnToggle`). A saved
state (`stateKey`) now also lists the columns it knows (`knownColumns`): it keeps the user's choice for those, and a
column added later starts with its `hidden` value instead of suddenly showing for everyone with a saved state; a state
saved before treats every column with `hidden` as new. While `hiddenColumns` is set it decides alone; `hideable: false`
wins over `hidden` (warning in development). React Native has no column menu: a column with `hidden` is not shown.
New recipe helpers `hiddenColumnDefaults`, `restoreHiddenColumns` and `tableColumnIds`. Story _Optional columns_.
