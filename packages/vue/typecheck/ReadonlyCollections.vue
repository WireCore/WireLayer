<script setup lang="ts">
// Type test, checked by vue-tsc in `pnpm typecheck` (not part of the package): collection props take read-only
// arrays, e.g. data from an API client that hands out `readonly T[]`
import BarChart from '../src/chart/BarChart.vue';
import Breadcrumb from '../src/components/Breadcrumb/Breadcrumb.vue';
import Button from '../src/components/Button/Button.vue';
import Menu from '../src/components/Menu/Menu.vue';
import type { MenuEntry } from '../src/components/Menu/types.js';
import Menubar from '../src/components/Menubar/Menubar.vue';
import Select from '../src/components/Select/Select.vue';
import Steps from '../src/components/Steps/Steps.vue';
import Tree from '../src/components/Tree/Tree.vue';
import type { TreeNode } from '../src/components/Tree/types.js';
import DataTable from '../src/data-table/DataTable.vue';
import type { DataTableColumn } from '../src/data-table/types.js';

interface User {
    id: string;
    name: string;
}
const users: readonly User[] = [{ id: '1', name: 'Ada' }];
const columns: readonly DataTableColumn<User>[] = [{ id: 'name', header: 'Name' }];
const entries: readonly MenuEntry[] = [{ value: 'edit', label: 'Edit' }];
const nodes: readonly TreeNode[] = [{ id: 'root', label: 'Root' }];
const steps = [{ label: 'Account' }, { label: 'Done' }] as const;
const rows = [{ month: 'Jan', sales: 4 }] as const;
const series = [{ key: 'sales', label: 'Sales' }] as const;
const crumbs = [{ label: 'Home', href: '/' }] as const;
const options = [{ value: 'web', label: 'Web' }] as const;
</script>

<template>
    <DataTable :data="users" :columns="columns" caption="Users" />
    <Menu :items="entries"><Button>Actions</Button></Menu>
    <Menubar :menus="[{ label: 'File', items: entries }]" />
    <Tree :items="nodes" aria-label="Files" />
    <Steps :items="steps" :current="0" />
    <BarChart :data="rows" category-key="month" :series="series" title="Sales" />
    <Breadcrumb :items="crumbs" />
    <Select :items="options" aria-label="Service" />
</template>
