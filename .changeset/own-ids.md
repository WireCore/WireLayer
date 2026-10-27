---
'@wirecore/wirelayer-vue': patch
'@wirecore/wirelayer-react': patch
'@wirecore/wirelayer-recipes': minor
---

An own `id` on Ark-based controls no longer breaks them. Ark finds its parts by the ids it generates – an `id` passed to
a Select ended up on the trigger and replaced that id, so the list opened at the top left of the page; the focus did not
return after choosing. The `id` now goes through Ark's `ids` to the part a `<label for>` points to, the ids of a
surrounding Field are kept:

- the trigger: Select, MultiSelect, VirtualSelect, CascadeSelect, TreeSelect, ColorPicker (the buttons of the last three
  are named by the label and describe themselves by their value)
- the input: Combobox, Autocomplete, NumberInput, PasswordInput, TagsInput, QuarterPicker (React; Vue already did),
  ColorInput and Mentions (Vue lost it outside a Field)
- the hidden check box: Checkbox, Switch, CheckboxCard – a Switch without text leaves out its empty label, which hid a
  `<label for>`

No label element can name a date field (spin buttons per part), a slider, a list box or a group: DatePicker,
DateRangePicker, MonthPicker, YearPicker, TimePicker, TimeRangePicker (the first date or time gets the id),
DurationInput (its group), Knob (the dial), Rating, PinInput, Listbox, AngleSlider (their root) keep the id, and a
`<label for>` pointing at one of them – or at a Slider, RadioGroup or SegmentedControl – warns in development: use a
Field or `aria-label`. New in `@wirecore/wirelayer-recipes`: `controlIds()` and `warnLabelFor()`.
