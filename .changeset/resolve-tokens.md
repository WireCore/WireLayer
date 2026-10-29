---
'@wirecore/wirelayer-tokens': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

Token colours as fixed values for canvas libraries (xterm.js, charts) that cannot read CSS variables:
`resolveTokens(element?)` gives the colours that apply right now (mode, theme and own overrides) as hex – `#rrggbbaa` for
the translucent ones – and `watchTokens(onChange)` reports a change of mode, theme or system colour scheme. The
composable/hook `useResolvedTokens()` keeps them up to date.
