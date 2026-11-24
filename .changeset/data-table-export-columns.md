---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

DataTable: `exportColumns` splits a column into several columns of the CSV and Excel export, at its position – e.g.
"Name" shown as "Doe, Jane" exported as "First name" and "Last name". It takes precedence over `exportHeader` and
`exportValue`; `exportable: false` and a hidden column export nothing. In Excel the aggregate and footer of the column go
to its first part. Printing keeps the shown column. The React Native DataTable exports the same way (`tableCsv`,
`tableXlsxSheet`); new recipe helper `tableExportColumns`. Story _Export columns_.
