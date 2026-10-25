---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
'@wirecore/wirelayer-mcp': patch
---

Docs: `bindInput` lists every component it fits – in Vue all components with a string `v-model` (Input, Textarea,
PasswordInput, SearchField, MaskInput, PhoneInput, ColorInput, JsonInput, PinInput, Mentions, Autocomplete), in React
Input, Textarea and PasswordInput (the others report their text with `onValueChange` and take `bindValue`). The READMEs
point to the MCP server `@wirecore/wirelayer-mcp` and llms.txt; the component packages ship no llms.txt.
