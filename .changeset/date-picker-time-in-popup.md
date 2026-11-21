---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-css': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

DatePicker and DateRangePicker with `withTime`: the time can be set below the calendar as well. Until now only the
field had hour and minute – the calendar popup picked the day, so changing the time needed typing.

- Below the calendar one time field (hour and minute, typed or with the arrow keys, in the locale's 12 or 24 hours) –
  in a DateRangePicker two, “Start” and “End”, in a group named “Time”; with `showTimeZone` the zone after them. On the
  day of `min`/`max` the time is limited to it.
- Picking a day keeps the calendar open; “Done” closes it, Escape discards what changed since it opened.
- `timeInPopup={false}` (Vue `:time-in-popup="false"`) keeps the time in the field only, the calendar closes on a day as
  before.
- The DataTable features `dateInput` and `dateRangeInput` get it for `datetime` columns (filters and editors).
- New texts `calendar.time` and `calendar.done` in every language; new recipe parts `timeSection`, `timeHeading`,
  `timeField`, `timeFieldLabel` and `timeDone`.
