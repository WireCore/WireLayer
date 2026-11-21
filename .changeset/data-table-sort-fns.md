---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
---

DataTable: columns without their own `sortFn` sort texts and dates correctly. TanStack Table picks `text` or
`alphanumeric` for text columns and `datetime` for `Date` values, but only `alphanumeric` was registered – in
development the console said "sortFn 'text' (auto) … is not registered" and the column fell back to comparing character
codes (upper and lower case apart, umlauts at the end).

- All sort functions the automatic choice can pick are registered: `text`, `alphanumeric`, `textCaseSensitive`,
  `alphanumericCaseSensitive`, `datetime`, `basic`.
- `text` and `alphanumeric` sort by the language of the table (LocaleProvider/ConfigProvider, `Intl.Collator` with
  numbers counted): case does not matter, “Ärger” comes after “Anna”, “Server 2” before “Server 10” – the same rules as
  the React Native DataTable.
