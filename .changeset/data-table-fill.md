---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: `scrollHeight="fill"` – the table takes the rest of a flex column instead of a fixed height. A table that
should reach down to the bottom of the page under a heading and figures needed an estimated `calc(100dvh - 12rem)`, too
big or too small depending on what is above it and on the window width. With `fill` the table is a flex item
(`flex-1 min-h-0`), its scroll area takes the room left between toolbar and footer (new recipe variant `fill`, with
`contain: size` so the rows do not stretch the page), and the new prop `minScrollHeight` (e.g. `60vh`) keeps it from
collapsing – below that the page scrolls. Toolbar, header and footer stay visible; virtual scrolling measures the area.
Story “Fill the rest”, docs with a page layout; the PrimeVue migration guide maps `scrollHeight="flex"` to it.
