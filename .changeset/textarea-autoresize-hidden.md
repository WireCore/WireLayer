---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

Textarea with `autoResize`: measures its height again once it becomes visible and whenever its width changes. Mounted
hidden (an inactive tab, a closed accordion, a popover before it opens) it measured 0 and stayed one line high. A
hidden textarea now keeps its rows until it can be measured. Story _Textarea in Tabs_.
