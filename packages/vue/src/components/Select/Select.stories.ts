import { Cloud, CodeXml, Cpu, Network, Server, Sparkles } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { onBeforeUnmount, onMounted, ref, type ConcreteComponent } from 'vue';
import ComboboxComponent from '../Combobox/Combobox.vue';
import Field from '../Field/Field.vue';
import SelectComponent from './Select.vue';

// Generic component: Storybook's Vue types can't infer args here
const Select = SelectComponent as unknown as ConcreteComponent;
const Combobox = ComboboxComponent as unknown as ConcreteComponent;

const items = [
    { value: 'web', label: 'Software & Web', icon: CodeXml },
    { value: 'ai', label: 'AI & LLM', icon: Sparkles },
    { value: 'hosting', label: 'Hosting', icon: Server },
    { value: 'cloud', label: 'Cloud & DevOps', icon: Cloud },
    { value: 'hardware', label: 'Hardware', icon: Cpu },
    { value: 'network', label: 'Network', icon: Network, disabled: true },
];
const grouped = [
    { value: 'web', label: 'Software & Web', group: 'Engineering' },
    { value: 'ai', label: 'AI & LLM', group: 'Engineering', description: 'Assistants, search, analytics' },
    { value: 'fra', label: 'Frankfurt', group: 'Data centers', description: 'Tier III, ISO 27001' },
    { value: 'nbg', label: 'Nuremberg', group: 'Data centers' },
    { value: 'vienna', label: 'Vienna', group: 'Data centers', disabled: true },
    { value: 'support', label: 'Support 24/7', group: 'Operations' },
];
const people = [
    { id: 1, name: 'Anna Berg', team: 'Sales' },
    { id: 2, name: 'Jonas Weber', team: 'Engineering' },
    { id: 3, name: 'Lea Schulz', team: 'Engineering' },
    { id: 4, name: 'Mehmet Yılmaz', team: 'Project management' },
];

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
    title: 'Forms/Select',
    component: Select,
    args: { items, defaultValue: 'hosting', placeholder: 'Select', disabled: false, invalid: false },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { Field, Select },
        setup: () => ({ args }),
        template: `
            <Field label="Service" class="w-[380px]">
                <Select v-bind="args" />
            </Field>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** Items with `group` are listed under their heading; `description` adds a second line */
export const Groups: Story = {
    name: 'Groups',
    args: { items: grouped, defaultValue: 'fra' },
};

/** `filter`: search field at the top of the list – ignores case and accents ("nu" finds "Nuremberg") */
export const WithSearch: Story = {
    name: 'With search',
    args: { items: grouped, defaultValue: undefined, filter: true },
};

/** Any objects as items and values: itemValue/itemLabel name the fields, the value comes back unchanged */
export const ObjectValues: Story = {
    name: 'Objects as values',
    render: () => ({
        components: { Field, Select },
        setup: () => ({ people, person: ref(people[1]), id: ref<number | null>(3) }),
        template: `
            <div class="flex w-[380px] flex-col gap-4">
                <Field label="Contact (object)">
                    <Select v-model="person" :items="people" item-label="name" item-group="team" value-key="id" />
                </Field>
                <span class="text-xs text-muted">Value: {{ JSON.stringify(person) }}</span>
                <Field label="Contact (number)">
                    <Select v-model="id" :items="people" item-value="id" item-label="name" />
                </Field>
                <span class="text-xs text-muted">Value: {{ id }} ({{ typeof id }})</span>
            </div>`,
    }),
};

/** `clearable`: button in the field (not a tab stop – Backspace/Delete clear as well) */
export const Clearable: Story = {
    name: 'Clear button',
    args: { clearable: true },
};

/** `size`: 32, 40 (default) and 48 px – like Button and Input */
export const Sizes: Story = {
    name: 'Sizes',
    render: () => ({
        components: { Field, Select },
        setup: () => ({ items }),
        template: `
            <div class="flex w-[380px] flex-col gap-4">
                <Field label="Small"><Select :items="items" size="sm" default-value="web" /></Field>
                <Field label="Medium"><Select :items="items" size="md" default-value="ai" /></Field>
                <Field label="Large"><Select :items="items" size="lg" default-value="hosting" /></Field>
            </div>`,
    }),
};

/** Own content per option (`#item`) and for the value in the field (`#value`) */
export const CustomContent: Story = {
    name: 'Custom rendering',
    render: () => ({
        components: { Field, Select },
        setup: () => ({ people }),
        template: `
            <Field label="Contact" class="w-[380px]">
                <Select :items="people" item-value="id" item-label="name" :default-value="2">
                    <template #item="{ item, selected }">
                        <span class="flex min-w-0 flex-1 flex-col">
                            <span :class="selected ? 'font-semibold' : ''">{{ item.name }}</span>
                            <span class="text-xs text-muted">{{ item.team }}</span>
                        </span>
                    </template>
                    <template #value="{ item }">{{ item.name }} · {{ item.team }}</template>
                </Select>
            </Field>`,
    }),
};

/**
 * Items from a server: `manualFilter` sends the search text (filterChange), `hasMore` + loadMore fetch the next
 * page when the list is scrolled to its end, `loading` shows the spinner
 */
export const ServerData: Story = {
    name: 'Loading more from the server',
    render: () => ({
        components: { Field, Select },
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
            <div class="flex w-[380px] flex-col gap-3">
                <Field label="Customer" helper-text="500 customers, 20 per page">
                    <Select v-model="value" :items="list" item-value="id" item-label="name" filter manual-filter
                        :loading="loading" :has-more="hasMore" clearable @filter-change="search" @load-more="more" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

/**
 * Options from a data source: the first page when the list opens, more while scrolling, the search asks the server
 * after a typing pause; the preselected customer gets its label by key (getItemsByKeys)
 */
export const WithDataSource: Story = {
    name: 'Data source',
    render: () => ({
        components: { Select, Field },
        setup: () => ({ customerSource, value: ref<number | null>(250) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Customer"><Select v-model="value" :items="[]" :data-source="customerSource" item-value="id" item-label="name" filter clearable /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

const statusItems = [
    { value: null, label: 'All' },
    { value: true, label: 'Active' },
    { value: false, label: 'Archived' },
];

/**
 * An item with the value `null` – e.g. "All" – is a choice of its own: v-model `null` shows it. Without such an
 * item `null` means nothing chosen (the placeholder)
 */
export const NullValue: Story = {
    name: 'Null as a value',
    render: () => ({
        components: { Select, Field },
        setup: () => ({ statusItems, value: ref<boolean | null>(null) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Status"><Select v-model="value" :items="statusItems" /></Field>
                <span class="text-xs text-muted">Value: {{ value === null ? 'null' : value }}</span>
            </div>`,
    }),
};

const categories = [
    { value: 'rent', label: 'Rent', parent: 'Housing' },
    { value: 'power', label: 'Electricity', parent: 'Housing' },
    { value: 'fuel', label: 'Fuel', parent: 'Car' },
    { value: 'insurance', label: 'Insurance', parent: 'Car' },
];

/**
 * The search finds items by more than their label: `item-keywords` names a field or a function (one text or a list)
 * – here the main category: "car" finds Fuel and Insurance. Items can also bring their own `keywords`
 */
export const Keywords: Story = {
    name: 'Search by keywords',
    render: () => ({
        components: { Select, Field },
        setup: () => ({ categories, value: ref<string | null>(null) }),
        template: `
            <Field label="Category" class="w-72">
                <Select v-model="value" :items="categories" item-group="parent" item-keywords="parent" filter />
            </Field>`,
    }),
};

/**
 * In a dialog that saves with Enter and cancels with Escape on the window: `stop-key-propagation` keeps the keys the
 * list handles itself (Enter choosing or opening, Escape closing, Tab leaving) in the Select or Combobox.
 * `v-model:open` (or `update:open`) reports whether the list is open
 */
export const KeysInADialog: Story = {
    name: 'Keys in a dialog',
    render: () => ({
        components: { Field, Select, Combobox },
        setup() {
            const lastKey = ref('–');
            const open = ref(false);
            const onKey = (event: KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === 'Escape') lastKey.value = event.key;
            };
            onMounted(() => window.addEventListener('keydown', onKey));
            onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
            const protocols = [
                { value: 'ssh', label: 'SSH' },
                { value: 'sftp', label: 'SFTP' },
                { value: 'rdp', label: 'RDP' },
            ];
            return { lastKey, open, protocols };
        },
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Protocol">
                    <Select v-model:open="open" :items="protocols" filter stop-key-propagation />
                </Field>
                <Field label="Jump host">
                    <Combobox :items="protocols" stop-key-propagation />
                </Field>
                <span class="text-xs text-muted">List open: {{ open }} · Last key on the window: {{ lastKey }}</span>
            </div>`,
    }),
};

/**
 * A model that uses `""` for "nothing chosen" (e.g. from a form or an API): `empty-value=""` shows the placeholder for
 * it, and clearing gives `""` back instead of null
 */
export const EmptyStringValue: Story = {
    name: 'Empty string as no value',
    render: () => ({
        components: { Field, Select },
        setup() {
            const jumpHost = ref('');
            const hosts = [
                { value: 'bastion-1', label: 'bastion-1' },
                { value: 'bastion-2', label: 'bastion-2' },
            ];
            return { jumpHost, hosts };
        },
        template: `
            <div class="flex w-[380px] flex-col gap-3.5">
                <Field label="Jump host">
                    <Select v-model="jumpHost" :items="hosts" placeholder="None" empty-value="" clearable />
                </Field>
                <span class="text-xs text-muted">Value: {{ JSON.stringify(jumpHost) }}</span>
            </div>`,
    }),
};
