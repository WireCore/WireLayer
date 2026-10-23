---
'@wirecore/wirelayer-recipes': minor
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

DataTable: new prop `csvSeparator` for the CSV export, also for the built-in export button. By default the separator
now follows the locale like a spreadsheet does (`csvSeparator(locale)` from the recipes): `;` where numbers have a
decimal comma (de-DE, fr-FR …), `,` otherwise (en-US …). Before, it was always `;`. `exportCsv({ separator })` still
wins over both.
