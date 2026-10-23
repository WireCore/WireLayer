---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

Menu, ContextMenu and other anchored overlays keep the focus when they are opened again right after closing: the
delayed focus return of the previous close no longer pulls the focus out of the reopened popup.
