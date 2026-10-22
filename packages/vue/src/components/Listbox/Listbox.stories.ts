import { Cloud, Code, Server, Sparkles } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { ref, type ConcreteComponent } from 'vue';
import ListboxComponent from './Listbox.vue';

// Generic component: Storybook's Vue types can't infer args here
const Listbox = ListboxComponent as unknown as ConcreteComponent;

const items = [
    { value: 'software', label: 'Software & Web', icon: Code },
    { value: 'hosting', label: 'Hosting', icon: Server },
    { value: 'cloud', label: 'Cloud & DevOps', icon: Cloud },
    { value: 'ai', label: 'AI integration', icon: Sparkles, disabled: true },
];

const people = [
    { id: 1, name: 'Anna Berg', team: 'Sales' },
    { id: 2, name: 'Jonas Weber', team: 'Engineering' },
    { id: 3, name: 'Lea Schulz', team: 'Engineering' },
    { id: 4, name: 'Mehmet Yılmaz', team: 'Project management' },
    { id: 5, name: 'Sophie Krämer', team: 'Sales' },
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
    title: 'Forms/Listbox',
    component: Listbox,
    args: { items, label: 'Services', multiple: false, disabled: false },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { Listbox },
        setup: () => ({ args, value: ref<string[]>(['hosting']) }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Listbox v-bind="args" v-model="value" />
                <span class="text-xs text-muted">Value: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const Multiple: Story = { args: { multiple: true } };

/** Objects as items, grouped by `itemGroup` (role="group", named by the heading) */
export const Groups: Story = {
    name: 'Groups',
    render: () => ({
        components: { Listbox },
        setup: () => ({ people, value: ref<number[]>([2]) }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Listbox v-model="value" label="Contact" :items="people" item-value="id" item-label="name"
                    item-group="team" multiple />
                <span class="text-xs text-muted">Value: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** `filter`: search field above the list – arrow keys move in the list, Enter chooses */
export const WithSearch: Story = {
    name: 'With search',
    render: () => ({
        components: { Listbox },
        setup: () => ({ people, value: ref<number[]>([]) }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Listbox v-model="value" label="Contact" :items="people" item-value="id" item-label="name" filter />
                <span class="text-xs text-muted">Value: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** Options from a data source: pages while scrolling, the search field asks the server */
export const WithDataSource: Story = {
    name: 'Data source',
    render: () => ({
        components: { Listbox },
        setup: () => ({ customerSource, value: ref<number[]>([7]) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Listbox v-model="value" :items="[]" label="Customers" :data-source="customerSource" item-value="id" item-label="name" multiple filter />
                <span class="text-xs text-muted">Value: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** Check boxes before the options and "Select all" above them */
export const CheckboxesSelectAll: Story = {
    name: 'Checkboxes and select all',
    render: () => ({
        components: { Listbox },
        setup: () => ({ items, value: ref<string[]>(['hosting']) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Listbox v-model="value" :items="items" label="Services" multiple checkboxes select-all />
                <span class="text-xs text-muted">Value: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
};
