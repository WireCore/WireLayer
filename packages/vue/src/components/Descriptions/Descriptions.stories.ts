import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Badge from '../Badge/Badge.vue';
import Button from '../Button/Button.vue';
import Input from '../Input/Input.vue';
import Descriptions, { type DescriptionsItem } from './Descriptions.vue';

const items: DescriptionsItem[] = [
    { id: 'customer', label: 'Customer', value: 'Northside Utilities Inc.' },
    { id: 'number', label: 'Contract number', value: 'V-2026-0815' },
    { id: 'status', label: 'Status', value: 'Active' },
    { id: 'start', label: 'Start', value: '03/01/2026' },
    { id: 'term', label: 'Term', value: '24 months', span: 2 },
    {
        id: 'note',
        label: 'Note',
        value: 'Renews for 12 months at a time, cancelable with three months of notice.',
        span: 'full',
    },
];

const meta = {
    title: 'Data/Descriptions',
    component: Descriptions,
    args: { items, title: 'Contract' },
    argTypes: {
        items: { control: false },
        orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    },
    render: (args) => ({
        components: { Badge, Descriptions },
        setup: () => ({ args }),
        template: `
            <Descriptions v-bind="args">
                <template #value-status="{ item }"><Badge variant="success">{{ item.value }}</Badge></template>
            </Descriptions>`,
    }),
} satisfies Meta<typeof Descriptions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Columns per breakpoint (1, from sm 2, from lg 3); items can span columns */
export const Playground: Story = {};

/** Table look with the label beside the value */
export const Bordered: Story = { args: { bordered: true, orientation: 'horizontal', columns: { base: 1, md: 2 } } };

/** Edit mode: the values turn into inputs, labelled by their term (labelId) */
export const Editing: Story = {
    render: () => ({
        components: { Button, Descriptions, Input },
        setup: () => {
            const editing = ref(false);
            const values = ref<Record<string, string>>(
                Object.fromEntries(items.map((item) => [item.id!, String(item.value)]))
            );
            const editable = items.filter((item) => item.id !== 'number').map((item) => item.id!);
            return { editing, values, editable, items };
        },
        template: `
            <Descriptions
                title="Contract"
                :items="items.map((item) => ({ ...item, value: values[item.id] }))"
                :editing="editing"
            >
                <template #actions>
                    <Button size="sm" :variant="editing ? 'primary' : 'outline'" @click="editing = !editing">
                        {{ editing ? 'Save' : 'Edit' }}
                    </Button>
                </template>
                <template v-for="id in editable" :key="id" #[\`edit-\${id}\`]="{ labelId }">
                    <Input v-model="values[id]" :aria-labelledby="labelId" />
                </template>
            </Descriptions>`,
    }),
};
