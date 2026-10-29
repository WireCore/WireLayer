---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
'@wirecore/wirelayer-native': minor
---

Typed values for choice components, inferred from the bound value; without one the types stay as they were:

- `RadioGroup` and `SegmentedControl` take a value type (`RadioGroup<'ssh' | 'sftp'>`, Vue `generic`), so a union comes
  back from v-model / `onValueChange` without mapping
- `RadioGroup` and `NativeSelect` also take number values (`RadioGroupItem :value="30"`, `items: [{ value: 30, … }]`)
  and give them back as numbers; NativeSelect's placeholder option still gives `''`
- `Checkbox` takes the state type from `checked`/`defaultChecked`: a boolean model gets `boolean` back, not
  `boolean | 'indeterminate'`

The rendered DOM does not change. Note for type code around the components: the Vue components are generic now, so
`InstanceType<typeof RadioGroup>` and Storybook's `Meta<typeof RadioGroup>` need a cast (as for Select); in React,
`ComponentProps<typeof RadioGroup>` / `NativeSelect` see `string | number` values (`typeof NativeSelect<string>` names
the old props).
