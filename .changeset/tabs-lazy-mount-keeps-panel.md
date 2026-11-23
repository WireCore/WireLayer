---
'@wirecore/wirelayer-vue': patch
---

Tabs with `lazyMount`: the panel that was open when the tabs mounted stays mounted (hidden) when its tab is left, as
documented – only `unmountOnExit` removes a panel again. Ark's Vue presence forgot that panel and removed it, so e.g.
form fields in it were gone on submit. TabsContent now mounts the panels itself with the same rules.
