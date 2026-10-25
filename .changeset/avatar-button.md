---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
---

Avatar `as="button"`: the avatar as a button, e.g. the trigger of a user menu (`<Menu><Avatar as="button" name="…" />
</Menu>`), with the focus ring of the other buttons and a ring on hover and while its menu is open (avatar recipe:
variant `interactive` and slot `content`, `.wc-avatar-interactive`). The button is named by an image inside it that
carries `name`, so the visible initials do not have to be part of an aria-label (WCAG 2.5.3 label in name). An explicit
`aria-label` on an avatar that is not a button now wins over `name`.
