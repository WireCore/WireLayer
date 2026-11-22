---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-css': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

Sortable: a drag with the mouse no longer gets stuck. The handle listened for the pointer itself; once the dragged item
moved in the DOM (to another place, above all into another list) the browser ended the pointer capture, the release
landed elsewhere and the item stayed picked up (`data-grabbed`). The controller now follows the press on the document
until it ends.

- Near the edge of a scrolling area (or the window) a drag scrolls it – the innermost area that can still scroll that
  way, then the ones around it.
- A copy of the item follows the pointer while it is dragged (recipe slot `preview`, `aria-hidden` and inert), also on
  the way out of a source list (`clone`), where nothing showed until the pointer was over a target.
- New story _Scrolling_; browser tests for drags across several places, into another list and near the edge.
