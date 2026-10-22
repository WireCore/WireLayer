import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import AutocompleteComponent from './Autocomplete.vue';

// Generic component: Storybook's Vue types can't infer args here
const Autocomplete = AutocompleteComponent as unknown as ConcreteComponent;

const departments = ['Accounting', 'Purchasing', 'Engineering', 'Management', 'Marketing', 'HR', 'Sales'];

const grouped = [
    { label: 'Accounting', group: 'Administration' },
    { label: 'HR', group: 'Administration' },
    { label: 'Engineering', group: 'Technology' },
    { label: 'Operations', group: 'Technology' },
    { label: 'Marketing', group: 'Market' },
    { label: 'Sales', group: 'Market' },
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
    title: 'Forms/Autocomplete',
    component: Autocomplete,
    args: { items: departments, placeholder: 'e.g. Sales', disabled: false, invalid: false },
    render: (args) => ({
        components: { Autocomplete, Field },
        setup: () => ({ args, value: ref('') }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Department" helper-text="Pick a suggestion or type freely">
                    <Autocomplete v-bind="args" v-model="value" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value || '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** Suggestions as objects under group headings; `clearable` empties the field */
export const Groups: Story = {
    name: 'Groups',
    args: { items: grouped, clearable: true },
};

/** `multiple`: several entries as chips – free text or a suggestion (v-model:values) */
export const Multiple: Story = {
    name: 'Multiple entries',
    render: () => ({
        components: { Autocomplete, Field },
        setup: () => ({ departments, values: ref(['Vertrieb']) }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <Field label="Departments" helper-text="Down arrow shows suggestions, Enter accepts">
                    <Autocomplete v-model:values="values" :items="departments" multiple placeholder="Department" />
                </Field>
                <span class="text-xs text-muted">Value: {{ values.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** Suggestions from a data source for the typed text */
export const WithDataSource: Story = {
    name: 'Data source',
    render: () => ({
        components: { Autocomplete, Field },
        setup: () => ({ customerSource, value: ref('') }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Customer"><Autocomplete v-model="value" :items="[]" :data-source="customerSource" item-label="name" /></Field>
                <span class="text-xs text-muted">Text: {{ value || '–' }}</span>
            </div>`,
    }),
};
