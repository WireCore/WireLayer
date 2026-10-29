---
'@wirecore/wirelayer-vue': minor
---

`PasswordInput` `autocomplete` also takes `'off'` and `'one-time-code'` – for secrets the browser or webview should not
offer to save (tokens, passphrases, vault master passwords). The default stays `current-password`. (React's
`autoComplete` and React Native's already took these values.)
