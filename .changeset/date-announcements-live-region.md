---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DatePicker, DateRangePicker and TimePicker: the parts announce their changes in the app's language again with Ark UI
5.40 (`@zag-js/live-region` 1.47), e.g. "Jahr, 1990" instead of "Year, 1990". Its live region has no id
`__live-region__` anymore and is created once when the field mounts; `translateDateAnnouncements` now finds the regions
by `data-live-announcer` and works with both versions.
