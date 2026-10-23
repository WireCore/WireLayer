---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

**Breaking:** German is a language module like French or Spanish and no longer part of the default bundle (about half
of the built-in texts). Only English is built in. Apps that use German register it once at startup, before the first
render:

```ts
import { registerLocale } from '@wirecore/wirelayer-vue'; // or -react, -native
import { de } from '@wirecore/wirelayer-vue/locales/de';

registerLocale('de', de);
```

`messages` only contains `en` now; the German texts are `de` from `…/locales/de`. The German names and search words of
the EmojiPicker moved there as well (`emojiPicker.emojis`); the built-in emojis are English. `localeEmojis(texts)` no
longer takes a locale – pass the lines of the language module (`localeEmojis(de.emojiPicker.emojis)`).
