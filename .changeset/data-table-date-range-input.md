---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DataTable: new feature `dateRangeInput` – a `between` filter of a `date` or `datetime` column shows one DateRangePicker
for both ends instead of two fields below each other, in the filter row and in the filter menu. The filter value stays
`[from, to]` (the picker's `{ start, end }` is converted both ways), so `filters`, saved states and server requests do
not change. Without the feature it stays two fields. Use it like the other input features:
`:features="[dateInput, dateRangeInput]"`.
