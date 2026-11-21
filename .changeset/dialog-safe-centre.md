---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-css': patch
'@wirecore/wirelayer-native': patch
---

Dialog: a long dialog is no longer cut off at the top. With the default `scrollBehavior="outside"` the positioner
centred the dialog with `items-center`, which splits the overflow of a dialog taller than the window above and below –
the part above (title, close button) lay outside the scrolling area and could not be reached, only the end could. The
positioner now centres safely (`items-center-safe`, `items-end-safe` for `position="bottom"`): short dialogs stay in the
middle, a taller one starts at the top (with the `p-4` margin) and scrolls down to its buttons. Applies to Dialog and
everything built on it (AlertDialog, `confirm()`, `prompt()`, `openDialog()`).

- React Native: with `outside` the whole dialog (header, body, footer) now scrolls and is never taller than the screen;
  before, a long dialog ran off the screen at the top and the bottom.
- `scrollBehavior="inside"` keeps the header and footer of long forms in view – app-wide with
  `dialog: { defaultVariants: { scrollBehavior: 'inside' } }`. Stories “Long content”.
