import { useVirtualizer } from '@tanstack/react-virtual';
import type { DataTableFeature } from '../data-table/types.js';

/** DataTable feature: only the visible rows are rendered with `virtual` – `<DataTable features={[virtualRows]} virtual>` */
export const virtualRows: DataTableFeature = { useVirtualizer };
