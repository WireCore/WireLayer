---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
'@wirecore/wirelayer-css': patch
---

Avatar `as="button"` hovers like the IconButton with the same look, so triggers side by side in a bar (app switcher,
user menu) behave alike: `outline` darkens its border, `soft` its background (like `secondary`), `solid` fades like the
filled variants, a `color` tint gets stronger (14 % → 18 %). The ring on hover and while the menu is open is gone –
only an avatar showing an image without a border (soft, solid) keeps a ring on hover, where the background change
would be hidden. New TopBar story with both triggers.
