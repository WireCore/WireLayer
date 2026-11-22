---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DataTable: `searchPlaceholder` sets the text of the empty search field and its name for screen readers ("Find a club"
instead of "Search …" and "Search <caption>"); `searchInputAttrs` passes more attributes to the search input, e.g.
`{ 'data-tour': 'search' }` as the target of a Tour step.
