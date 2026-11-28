---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-css': patch
---

Text fields and other form controls (Input, Textarea, Select, DatePicker, NumberInput, PasswordInput, Combobox,
TreeSelect, MultiSelect, editors, search fields …) show the keyboard focus more clearly: besides the primary border a
2 px primary ring right inside it, so the focused field differs from the resting one by a 3 px band (WCAG 2.4.13). It
sits inside the field, so neighbours and `overflow-hidden` do not cut it off; it covers the field's own surface, whose
contrast to primary the theme test already checks.
