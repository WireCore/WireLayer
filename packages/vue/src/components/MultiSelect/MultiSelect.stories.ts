import { Cloud, CodeXml, Cpu, Server } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import MultiSelectComponent from './MultiSelect.vue';

// Generic component: Storybook's Vue types can't infer args here
const MultiSelect = MultiSelectComponent as unknown as ConcreteComponent;

const items = [
    { value: 'web', label: 'Software & Web', icon: CodeXml },
    { value: 'hosting', label: 'Managed Hosting', icon: Server },
    { value: 'cloud', label: 'Cloud & DevOps', icon: Cloud },
    { value: 'hardware', label: 'Hardware', icon: Cpu, disabled: true },
];
const grouped = [
    { value: 'web', label: 'Software & Web', group: 'Engineering' },
    { value: 'ai', label: 'AI & LLM', group: 'Engineering' },
    { value: 'apps', label: 'Apps', group: 'Engineering' },
    { value: 'fra', label: 'Frankfurt', group: 'Data centers', description: 'Tier III' },
    { value: 'nbg', label: 'Nuremberg', group: 'Data centers', description: 'Tier III' },
    { value: 'vienna', label: 'Vienna', group: 'Data centers', disabled: true },
    { value: 'support', label: 'Support 24/7', group: 'Operations' },
    { value: 'backup', label: 'Backup', group: 'Operations' },
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
    title: 'Forms/MultiSelect',
    component: MultiSelect,
    args: { items, placeholder: 'Choose services', disabled: false, invalid: false, maxShown: 2 },
    render: (args) => ({
        components: { Field, MultiSelect },
        setup: () => ({ args, value: ref(['web', 'cloud']) }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Field label="Services" helper-text="Multiple selection possible">
                    <MultiSelect v-bind="args" v-model="value" />
                </Field>
                <span class="text-xs text-muted">Selection: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** `display="chips"`: one chip per value with a remove button; Backspace on the field removes the last one */
export const Chips: Story = {
    args: { display: 'chips', clearable: true },
};

/** `selectAll` above the options (takes the options in view) and `max`: at most three, the rest is disabled */
export const SelectAll: Story = {
    name: 'Select all',
    args: { items: grouped, selectAll: true, max: 3, display: 'chips' },
};

/** `filter`: search field at the top of the list; groups and two-line options */
export const WithSearch: Story = {
    name: 'With search',
    args: { items: grouped, filter: true, selectAll: true, clearable: true },
};

/** `size`: 32, 40 (default) and 48 px; `checkboxes: false` shows check marks instead of boxes */
export const Sizes: Story = {
    name: 'Sizes',
    render: () => ({
        components: { Field, MultiSelect },
        setup: () => ({ items }),
        template: `
            <div class="flex w-80 flex-col gap-4">
                <Field label="Small"><MultiSelect :items="items" size="sm" :default-value="['web']" /></Field>
                <Field label="Medium"><MultiSelect :items="items" :default-value="['web']" :checkboxes="false" /></Field>
                <Field label="Large"><MultiSelect :items="items" size="lg" display="chips" :default-value="['web', 'cloud']" /></Field>
            </div>`,
    }),
};

/** Options from a data source with a server search; preselected customers get their labels by key */
export const WithDataSource: Story = {
    name: 'Data source',
    render: () => ({
        components: { MultiSelect, Field },
        setup: () => ({ customerSource, value: ref<number[]>([3, 480]) }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Field label="Customers"><MultiSelect v-model="value" :items="[]" :data-source="customerSource" item-value="id" item-label="name" filter display="chips" clearable /></Field>
                <span class="text-xs text-muted">Value: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
};
