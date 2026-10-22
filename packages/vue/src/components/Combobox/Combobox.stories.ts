import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import ComboboxComponent from './Combobox.vue';

// Generic component: Storybook's Vue types can't infer args here
const Combobox = ComboboxComponent as unknown as ConcreteComponent;

const cities = [
    'Berlin',
    'Dusseldorf',
    'Frankfurt am Main',
    'Hamburg',
    'Cologne',
    'Leipzig',
    'Munich',
    'Nuremberg',
    'Stuttgart',
];
const items = cities.map((city) => ({ value: city.toLowerCase(), label: city }));

// "Server": 500 customers, 20 per page, search by name – answers after 400 ms
const customers = Array.from({ length: 500 }, (_, index) => ({
    id: index + 1,
    name: `Customer ${String(index + 1).padStart(3, '0')}`,
}));
async function fetchCustomers(query: string, page: number) {
    await new Promise((done) => setTimeout(done, 400));
    const matches = customers.filter((customer) => customer.name.toLowerCase().includes(query.trim().toLowerCase()));
    return { items: matches.slice(page * 20, page * 20 + 20), hasMore: (page + 1) * 20 < matches.length };
}
const people = [
    { id: 1, name: 'Anna Berg', team: 'Sales' },
    { id: 2, name: 'Jonas Weber', team: 'Engineering' },
    { id: 3, name: 'Lea Schulz', team: 'Engineering' },
    { id: 4, name: 'Mehmet Yılmaz', team: 'Project management' },
];

// 500 customers on a "server": pages of 20, a search, labels by key for chosen values
interface Customer {
    id: number;
    name: string;
}
const serverCustomers: Customer[] = Array.from({ length: 500 }, (_, index) => ({
    id: index + 1,
    name: `Customer ${String(index + 1).padStart(3, '0')}`,
}));
const customerSource: DataSource<Customer> = {
    async getItems({ page = 1, pageSize = 20, search = '', signal }) {
        await new Promise((done) => setTimeout(done, 400));
        if (signal.aborted) throw new DOMException('aborted', 'AbortError');
        const found = serverCustomers.filter((customer) => customer.name.toLowerCase().includes(search.toLowerCase()));
        return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
    },
    async getItemsByKeys(keys) {
        await new Promise((done) => setTimeout(done, 200));
        return serverCustomers.filter((customer) => keys.includes(String(customer.id)));
    },
};

const meta = {
    title: 'Forms/Combobox',
    component: Combobox,
    args: { items, placeholder: 'Search city …', disabled: false, invalid: false },
    render: (args) => ({
        components: { Combobox, Field },
        setup: () => ({ args, value: ref<string | null>(null) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Location" helper-text="Typing filters the suggestions">
                    <Combobox v-bind="args" v-model="value" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/**
 * `allowCustomValue`: text that matches no item becomes the value (a string) on Enter or when leaving the field –
 * the editable select
 */
export const CustomValue: Story = {
    name: 'Custom values',
    args: { allowCustomValue: true, placeholder: 'Search or enter a city …' },
};

/** Objects as items and values, under group headings; `size` and a loading spinner */
export const ObjectValues: Story = {
    name: 'Objects as values',
    render: () => ({
        components: { Combobox, Field },
        setup: () => ({ people, value: ref<number | null>(2) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Contact">
                    <Combobox v-model="value" :items="people" item-value="id" item-label="name" item-group="team" size="lg" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/** Server-side search (`manualFilter` + filterChange) with paging (`hasMore` + loadMore) */
export const ServerData: Story = {
    name: 'Loading more from the server',
    render: () => ({
        components: { Combobox, Field },
        setup() {
            const list = ref<{ id: number; name: string }[]>([]);
            const loading = ref(false);
            const hasMore = ref(true);
            const value = ref<number | null>(null);
            let query = '';
            let page = 0;
            let request = 0;
            async function load(reset: boolean) {
                if (reset) page = 0;
                const current = ++request;
                loading.value = true;
                const result = await fetchCustomers(query, page);
                if (current !== request) return;
                list.value = reset ? result.items : [...list.value, ...result.items];
                hasMore.value = result.hasMore;
                loading.value = false;
                page++;
            }
            void load(true);
            return {
                list,
                loading,
                hasMore,
                value,
                search(text: string) {
                    query = text;
                    void load(true);
                },
                more: () => void load(false),
            };
        },
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Customer" helper-text="500 customers, 20 per page">
                    <Combobox v-model="value" :items="list" item-value="id" item-label="name" manual-filter
                        :loading="loading" :has-more="hasMore" @filter-change="search" @load-more="more" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/** The typed text asks the data source (from 2 characters, after a typing pause; outdated answers are dropped) */
export const WithDataSource: Story = {
    name: 'Data source',
    render: () => ({
        components: { Combobox, Field },
        setup: () => ({ customerSource, value: ref<number | null>(42) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Customer" helper-text="From 2 characters"><Combobox v-model="value" :items="[]" :data-source="customerSource" item-value="id" item-label="name" :min-search-length="2" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};
