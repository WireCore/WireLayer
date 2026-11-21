---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-css': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DataTable `striped` with `virtual`: the pattern no longer jumps while scrolling. The tint came from the position in the
DOM (`even:`), but virtual scrolling renders a spacer row and only a window of the rows, so the tinted rows changed with
the scroll position. Every data row now carries `data-stripe="true|false"` by its place among the data rows of the page:
group and detail rows do not count (the pattern runs on across the groups), frozen rows alternate among themselves.
Rows without the attribute – plain HTML with `@wirecore/wirelayer-css` – still follow their position. Hover and the
selected state win over the tint as before.
