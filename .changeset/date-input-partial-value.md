---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DatePicker, DateRangePicker, MonthPicker and YearPicker: a date with a part emptied is no longer kept. Ark's segmented
field only reports a change when every part is filled or every part is empty – deleting the year of "12.05.1990" left
the old date in the model, a form saved it although the field showed "12.05.JJJJ". Now the field reports the dates
before the incomplete one (`null` for a single date, only the start for a range) right after the key or when it is left,
so a required field fails; the typed parts stay. Completing the date reports it again, also when it is the same as
before.

- The parts of the date and time fields (also TimePicker, TimeRangePicker and the times below the calendar) announce
  their changes in the language of the app instead of Ark's English ("Jahr, Leer" instead of "Year, Empty"): the part
  names from `dateSegments`, the new text `dateInput.empty` in every bundled language.
- New helpers in the recipes: `partialDateIndex(root)` and `translateDateAnnouncements(element, texts)`.
