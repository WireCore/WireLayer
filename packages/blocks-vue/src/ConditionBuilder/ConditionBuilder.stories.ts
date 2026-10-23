import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {
    emptyConditionGroup,
    matchesCondition,
    type ConditionField,
    type ConditionGroup,
} from '@wirecore/wirelayer-recipes';
import { DataTable, dateInput, numberInput, type DataTableColumn } from '@wirecore/wirelayer-vue/data-table';
import { computed, ref, type ConcreteComponent } from 'vue';
import ConditionBuilder from './ConditionBuilder.vue';

const fields: ConditionField[] = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'load', label: 'Load (%)', type: 'number' },
    { id: 'since', label: 'In service since', type: 'date' },
    {
        id: 'location',
        label: 'Location',
        type: 'select',
        options: [
            { value: 'Frankfurt', label: 'Frankfurt' },
            { value: 'Nuremberg', label: 'Nuremberg' },
            { value: 'Vienna', label: 'Vienna' },
        ],
    },
    { id: 'online', label: 'Online', type: 'boolean' },
];
const servers = [
    { name: 'web-01', load: 42, since: '2024-03-01', location: 'Frankfurt', online: true },
    { name: 'db-primary', load: 71, since: '2023-11-15', location: 'Frankfurt', online: true },
    { name: 'k8s-node-3', load: 18, since: '2025-06-30', location: 'Nuremberg', online: false },
    { name: 'cache-01', load: 55, since: '2025-01-10', location: 'Vienna', online: true },
];
const initial: ConditionGroup = {
    type: 'group',
    id: 'root',
    combinator: 'and',
    children: [
        { type: 'rule', id: 'r1', field: 'load', operator: 'gt', value: 40 },
        {
            type: 'group',
            id: 'g1',
            combinator: 'or',
            children: [
                { type: 'rule', id: 'r2', field: 'location', operator: 'equals', value: 'Vienna' },
                { type: 'rule', id: 'r3', field: 'name', operator: 'startsWith', value: 'db' },
            ],
        },
    ],
};

const meta = {
    title: 'Blocks/ConditionBuilder',
    component: ConditionBuilder,
    args: { fields },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { ConditionBuilder },
        setup() {
            const tree = ref<ConditionGroup>(initial);
            const matches = computed(() => servers.filter((row) => matchesCondition(row, tree.value, fields)));
            return { args, tree, matches };
        },
        template: `
            <div class="flex max-w-4xl flex-col gap-4">
                <ConditionBuilder v-bind="args" v-model="tree" />
                <p class="text-sm" aria-live="polite">Matches: {{ matches.map((row) => row.name).join(', ') || 'none' }}</p>
                <details class="text-xs text-muted"><summary>JSON</summary><pre>{{ JSON.stringify(tree, null, 2) }}</pre></details>
            </div>`,
    }),
} satisfies Meta<typeof ConditionBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nested and/or groups; editors per field type; the tree as JSON and matchesCondition() on rows */
export const Playground: Story = {};

/** Empty start, groups only one level deep */
export const Empty: Story = {
    name: 'Empty',
    args: { maxDepth: 1 },
    render: (args) => ({
        components: { ConditionBuilder },
        setup: () => ({ args, tree: ref(emptyConditionGroup('and', 'root')) }),
        template: `<ConditionBuilder v-bind="args" v-model="tree" class="max-w-4xl" />`,
    }),
};

/** "Not" per group: negates the group (`not` in the JSON) */
export const Negate: Story = {
    name: 'Negate',
    args: { negatable: true },
};

interface Machine {
    id: string;
    location: string;
    load: number;
    since: string;
    online: boolean;
}
/** Deterministic sample data (screenshots stay the same) */
const machines: Machine[] = Array.from({ length: 24 }, (_, index) => ({
    id: `vm-${String(index + 1).padStart(4, '0')}`,
    location: ['Frankfurt', 'Nuremberg', 'Vienna', 'Zurich'][index % 4]!,
    load: (index * 37) % 100,
    since: `202${3 + (index % 3)}-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    online: index % 5 !== 3,
}));
const machineColumns: DataTableColumn<Machine>[] = [
    { id: 'id', header: 'Name', width: 150, sortable: true, filter: 'text' },
    { id: 'location', header: 'Location', width: 160, sortable: true, filter: 'multiSelect' },
    { id: 'load', header: 'Load', width: 150, align: 'end', filter: 'number', format: (value) => `${value}%` },
    {
        id: 'since',
        header: 'In service since',
        width: 170,
        filter: 'date',
        format: (value) => new Date(String(value)).toLocaleDateString('en-US'),
    },
    { id: 'online', header: 'Online', width: 120, filter: 'boolean', format: (value) => (value ? 'Yes' : 'No') },
];

/**
 * The editor of the DataTable's advanced filter: the `#advancedFilter` slot gets fields, tree, setter and label. The
 * toolbar button opens it above the table; the rows pass the tree (v-model:advanced-filter-value)
 */
export const InDataTable: Story = {
    name: 'In the DataTable',
    render: () => ({
        components: { ConditionBuilder, DataTable: DataTable as ConcreteComponent },
        setup: () => ({
            rows: machines,
            columns: machineColumns,
            features: [dateInput, numberInput],
            getRowId: (row: Machine) => row.id,
            tree: ref<ConditionGroup>({
                type: 'group',
                id: 'root',
                combinator: 'and',
                children: [{ type: 'rule', id: 'r1', field: 'load', operator: 'gt', value: 50 }],
            }),
        }),
        template: `
            <DataTable
                v-model:advanced-filter-value="tree"
                :data="rows"
                :columns="columns"
                :features="features"
                caption="Machines"
                :get-row-id="getRowId"
                :row-label="getRowId"
                advanced-filter
                :page-size="10"
                class="max-w-[1000px] overflow-hidden rounded-2xl border border-line bg-card"
            >
                <template #advancedFilter="{ fields, value, setValue, label }">
                    <ConditionBuilder :fields="fields" :model-value="value" :label="label" @update:model-value="setValue" />
                </template>
            </DataTable>`,
    }),
};
