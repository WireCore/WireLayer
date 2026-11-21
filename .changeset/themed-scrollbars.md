---
'@wirecore/wirelayer-tokens': minor
'@wirecore/wirelayer-css': minor
---

Scrollbars in the WireLayer look. Only `ScrollPanel` had designed scrollbars; the page itself, DataTable with
`scrollHeight`, long dialogs and drawers, Select and Menu lists or a Textarea showed the browser's – wide, and light in
dark mode. Now every scrolling area gets thin scrollbars like ScrollPanel: the thumb in `line-strong` (3:1 against the
surfaces in every theme and mode), the track transparent, following the mode and theme of its part of the page.

- Safari (no `scrollbar-color`) gets the same look through `::-webkit-scrollbar`, with `muted` under the pointer;
  forced colors keep the system scrollbars.
- Change them with `--wc-scrollbar-thumb`, `--wc-scrollbar-thumb-hover`, `--wc-scrollbar-track` and
  `--wc-scrollbar-width`; `<html data-scrollbars="native">` keeps the browser's own.
- Base layer: utilities such as `[scrollbar-width:none]` still win. Docs: _Theming › Themes › Scrollbars_.
