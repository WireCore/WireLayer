---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
---

Avatar `as="button"`: the avatar as a button, e.g. the trigger of a user menu (`<Menu><Avatar as="button" name="…" />
</Menu>`), named by `name` or `aria-label`, with the focus ring of the other buttons and a ring on hover and while its
menu is open (avatar recipe: variant `interactive`, `.wc-avatar-interactive`). An explicit `aria-label` now wins over
`name`.
