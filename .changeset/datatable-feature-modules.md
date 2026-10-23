---
'@wirecore/wirelayer-vue': minor
'@wirecore/wirelayer-react': minor
---

**Breaking:** DataTable feature modules. Parts of the DataTable that bring a lot of code along are imported on their own
and passed in `features` – a minimal table is about a fifth smaller (gzip), and `@tanstack/vue-virtual` or
`@tanstack/react-virtual` is only needed for virtual rows.

- `virtual` needs the feature `virtualRows` from `/virtual`; without it all rows are rendered (with a hint in
  development).
- Date and number filters and editors use the browser's inputs; the DatePicker and NumberInput come with the features
  `dateInput` and `numberInput` from `/data-table`.

```tsx
import { DataTable, dateInput, numberInput } from '@wirecore/wirelayer-react/data-table'; // or -vue
import { virtualRows } from '@wirecore/wirelayer-react/virtual';

const features = [virtualRows, dateInput, numberInput];

<DataTable data={rows} columns={columns} features={features} scrollHeight="480px" virtual />;
```
