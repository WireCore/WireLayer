---
'@wirecore/wirelayer-recipes': patch
'@wirecore/wirelayer-css': patch
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DateRangePicker with `withTime`: two fixes.

- A new range picked in the calendar keeps the end time. The calendar starts a new range with the start alone, so the
  end took the time of the start (04.09. 17:00 – 06.09. 16:00 became 14.09. 17:00 – 16.09. 17:00). Each side now keeps
  its last time; without one the start gets 00:00 and the end 23:59.
- In a narrow field (a form column, the filter row of a DataTable) the value no longer runs under the clear button: the
  date input is clipped, and a focused part scrolls into view.
