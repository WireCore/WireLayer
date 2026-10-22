import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../components/Field/Field.vue';
import VirtualSelectComponent from './VirtualSelect.vue';

// Generic component: Storybook's Vue types can't infer args here
const VirtualSelect = VirtualSelectComponent as unknown as ConcreteComponent;

const items = Array.from({ length: 10_000 }, (_, index) => ({
    value: `customer-${index + 1}`,
    label: `Customer ${String(index + 1).padStart(5, '0')}`,
}));

const meta = {
    title: 'Forms/VirtualSelect',
    component: VirtualSelect,
    args: { items, placeholder: 'Choose customer' },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { Field, VirtualSelect },
        setup: () => ({ args }),
        template: `
            <Field label="Customer (10,000 entries)" class="w-[380px]">
                <VirtualSelect v-bind="args" />
            </Field>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** `filter`: search field over the 10,000 entries */
export const WithSearch: Story = {
    name: 'With search',
    args: { filter: true, clearable: true },
};

/** Endless list: `hasMore` + loadMore fetch the next 50 entries when the end of the list comes into view */
export const Endless: Story = {
    name: 'Infinite loading',
    render: () => ({
        components: { Field, VirtualSelect },
        setup() {
            const list = ref<{ value: string; label: string }[]>(items.slice(0, 50));
            const loading = ref(false);
            const value = ref<string | null>(null);
            function more() {
                loading.value = true;
                setTimeout(() => {
                    list.value = items.slice(0, list.value.length + 50);
                    loading.value = false;
                }, 400);
            }
            return { list, loading, value, more };
        },
        template: `
            <Field label="Customer" helper-text="Loads 50 more at a time while scrolling" class="w-[380px]">
                <VirtualSelect v-model="value" :items="list" :loading="loading" :has-more="list.length < 10000"
                    placeholder="Choose customer" @load-more="more" />
            </Field>`,
    }),
};

// A server over the 10,000 customers: pages of 50, a search over the labels, after a short pause
const customerSource: DataSource<{ value: string; label: string }> = {
    async getItems({ page = 1, pageSize = 50, search = '', signal }) {
        await new Promise((done) => setTimeout(done, 300));
        if (signal.aborted) throw new DOMException('aborted', 'AbortError');
        const found = items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));
        return { items: found.slice((page - 1) * pageSize, page * pageSize), hasMore: page * pageSize < found.length };
    },
};

/** `dataSource`: pages of 50 from a server while scrolling; the search field asks the server */
export const FromServer: Story = {
    name: 'From the server',
    render: () => ({
        components: { Field, VirtualSelect },
        setup: () => ({ source: customerSource, value: ref<string | null>(null) }),
        template: `
            <Field label="Customer" helper-text="50 entries per page from the server, search on the server" class="w-[380px]">
                <VirtualSelect v-model="value" :items="[]" :data-source="source" filter placeholder="Choose customer" />
            </Field>`,
    }),
};
