---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Compact `Progress` for lists and status bars, all opt-in:

- `size: 'xs' | 'md'` – `xs` is a thin bar with small text
- `status: 'info' | 'success' | 'warn' | 'danger'` colours the fill
- `hideLabel`: the label only names the bar for screen readers
- `barText`, e.g. "42 %", "waiting" or "failed": text in a taller bar (horizontal, without segments or steps), readable
  over the empty and the filled part; screen readers get it after the value
