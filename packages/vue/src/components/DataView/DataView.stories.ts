import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { computed, ref, type ConcreteComponent } from 'vue';
import Badge from '../Badge/Badge.vue';
import Input from '../Input/Input.vue';
import Select from '../Select/Select.vue';
import DataView from './DataView.vue';

const servers = [
    { name: 'web-01', location: 'Frankfurt', status: 'ONLINE', load: 42 },
    { name: 'web-02', location: 'Frankfurt', status: 'ONLINE', load: 37 },
    { name: 'db-primary', location: 'Frankfurt', status: 'ONLINE', load: 71 },
    { name: 'k8s-node-3', location: 'Nuremberg', status: 'MAINTENANCE', load: 18 },
    { name: 'backup-02', location: 'Nuremberg', status: 'OUTAGE', load: 96 },
    { name: 'cache-01', location: 'Nuremberg', status: 'ONLINE', load: 55 },
    { name: 'mail-01', location: 'Vienna', status: 'ONLINE', load: 12 },
];
const variant = { ONLINE: 'success', MAINTENANCE: 'warn', OUTAGE: 'danger' } as const;

const meta = {
    title: 'Data/DataView',
    // Generic component: Storybook's Vue types can't infer args here
    component: DataView as unknown as ConcreteComponent,
    args: { label: 'Servers', pageSize: 6, layoutToggle: true },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Badge, DataView: DataView as unknown as ConcreteComponent },
        setup: () => ({ args, servers, variant, layout: ref<'list' | 'grid'>('grid') }),
        template: `
            <DataView v-bind="args" v-model:layout="layout" :items="servers" class="max-w-3xl">
                <template #item="{ item, layout }">
                    <div :class="layout === 'grid' ? 'flex flex-col gap-2 rounded-xl border border-line bg-card p-4' : 'flex items-center gap-4 rounded-xl border border-line bg-card px-4 py-3'">
                        <span class="font-semibold">{{ item.name }}</span>
                        <span class="text-sm text-muted">{{ item.location }} · {{ item.load }}%</span>
                        <Badge :variant="variant[item.status]" :class="layout === 'list' ? 'ml-auto' : 'self-start'">{{ item.status }}</Badge>
                    </div>
                </template>
            </DataView>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

// A server with 60 machines: pages, search and sorting, answering after a pause
const fleet = Array.from({ length: 60 }, (_, index) => ({
    name: `srv-${String(index + 1).padStart(2, '0')}`,
    location: ['Frankfurt', 'Nuremberg', 'Vienna'][index % 3]!,
    status: (['ONLINE', 'ONLINE', 'MAINTENANCE', 'ONLINE', 'OUTAGE'] as const)[index % 5]!,
    load: (index * 37) % 100,
}));
type Machine = (typeof fleet)[number];
const fleetSource: DataSource<Machine> = {
    async getItems({ page = 1, pageSize = 6, search = '', sorting = [], signal }) {
        await new Promise((done) => setTimeout(done, 500));
        if (signal.aborted) throw new DOMException('aborted', 'AbortError');
        const found = fleet.filter((machine) => machine.name.includes(search) || machine.location.includes(search));
        const sort = sorting[0];
        if (sort) found.sort((a, b) => (a[sort.id as 'load'] > b[sort.id as 'load'] ? 1 : -1) * (sort.desc ? -1 : 1));
        return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
    },
};
const card = `
    <div class="flex items-center gap-4 rounded-xl border border-line bg-card px-4 py-3">
        <span class="font-semibold">{{ item.name }}</span>
        <span class="text-sm text-muted">{{ item.location }} · {{ item.load }}%</span>
        <Badge :variant="variant[item.status]" class="ml-auto">{{ item.status }}</Badge>
    </div>`;

/** Pages from a data source; the toolbar (slot) searches and sorts – a change starts at page 1 */
export const ServerData: Story = {
    name: 'Server data',
    render: () => ({
        components: { Badge, Input, Select, DataView: DataView as unknown as ConcreteComponent },
        setup: () => {
            const search = ref('');
            const sort = ref('name');
            const query = computed(() => ({
                search: search.value,
                sorting: [{ id: sort.value, desc: sort.value === 'load' }],
            }));
            return {
                fleetSource,
                variant,
                search,
                sort,
                query,
                sorts: [
                    { value: 'name', label: 'Name' },
                    { value: 'load', label: 'Load' },
                ],
            };
        },
        template: `
            <DataView label="Servers" :data-source="fleetSource" :query="query" :page-size="6" :page-sizes="[6, 12, 24]" :layout-toggle="false" class="max-w-3xl">
                <template #toolbar>
                    <Input v-model="search" aria-label="Search servers" placeholder="Search …" class="max-w-60" />
                    <Select v-model="sort" :items="sorts" aria-label="Sort order" class="max-w-44" />
                </template>
                <template #item="{ item }">${card}</template>
                <template #noResults>No server matches the search.</template>
            </DataView>`,
    }),
};

/** The list grows: "Load more" – and with autoLoad as soon as its end scrolls into view */
export const Infinite: Story = {
    name: 'Infinite loading',
    render: () => ({
        components: { Badge, DataView: DataView as unknown as ConcreteComponent },
        setup: () => ({ fleetSource, variant }),
        template: `
            <DataView label="Servers" :data-source="fleetSource" :page-size="8" load-mode="infinite" auto-load :layout-toggle="false" class="max-w-3xl">
                <template #item="{ item }">${card}</template>
            </DataView>`,
    }),
};

/** The parent pages (manual): it loads the page the pagination asks for and gives the number of all items */
export const Manual: Story = {
    name: 'Manual pages',
    render: () => ({
        components: { Badge, DataView: DataView as unknown as ConcreteComponent },
        setup: () => {
            const page = ref(1);
            const items = ref(fleet.slice(0, 5));
            const loading = ref(false);
            const load = async (next: number) => {
                page.value = next;
                loading.value = true;
                await new Promise((done) => setTimeout(done, 400));
                items.value = fleet.slice((next - 1) * 5, next * 5);
                loading.value = false;
            };
            return { page, items, loading, load, variant, total: fleet.length };
        },
        template: `
            <DataView label="Servers" :items="items" manual :total-count="total" :page-size="5" :page="page" :loading="loading"
                :layout-toggle="false" class="max-w-3xl" @update:page="load">
                <template #item="{ item }">${card}</template>
            </DataView>`,
    }),
};

/** Placeholders while loading, an error with "Try again", the empty state */
export const States: Story = {
    name: 'Loading, error and empty',
    render: () => ({
        components: { DataView: DataView as unknown as ConcreteComponent },
        setup: () => ({
            failing: { getItems: async () => Promise.reject(new Error('Server unreachable')) },
        }),
        template: `
            <div class="grid max-w-3xl gap-8">
                <DataView label="Loading" :items="[]" loading :skeleton-count="3" :layout-toggle="false" />
                <DataView label="Error" :data-source="failing" :layout-toggle="false" />
                <DataView label="Empty" :items="[]" :layout-toggle="false">
                    <template #empty>No servers created yet.</template>
                </DataView>
            </div>`,
    }),
};
