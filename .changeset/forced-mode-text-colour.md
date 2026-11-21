---
'@wirecore/wirelayer-tokens': patch
'@wirecore/wirelayer-css': patch
---

`data-mode` and `data-theme` on a part of the page now set the text colour of that part as well. Body computes the text
colour once from the page's mode and passes it down as a fixed value, so in a `data-mode="light"` part of a dark page
text that inherits its colour (e.g. in a Card or a table) stayed light – light text on a white card – and the other way
round. The rule sits in the base layer (`color: var(--wc-fg)`), so `text-*` classes still win; the part gets no
background and may stay transparent. Overlays (Dialog, Drawer, Popover, Menu) already set their text colour and need no
change; React Native switches mode and theme for the whole app.
