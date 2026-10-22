import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import type { TreeNode } from '../Tree/types.js';
import TreeSelectComponent from './TreeSelect.vue';

// Generic component: Storybook's Vue types can't infer args here
const TreeSelect = TreeSelectComponent as unknown as ConcreteComponent;

const departments: TreeNode[] = [
    {
        id: 'technology',
        label: 'Technology',
        children: [
            { id: 'engineering', label: 'Engineering' },
            { id: 'operations', label: 'Operations' },
            { id: 'security', label: 'IT security' },
        ],
    },
    {
        id: 'sales',
        label: 'Sales',
        children: [
            { id: 'inside-sales', label: 'Inside sales' },
            { id: 'field-sales', label: 'Field sales' },
        ],
    },
    { id: 'administration', label: 'Administration' },
];

const meta = {
    title: 'Forms/TreeSelect',
    component: TreeSelect,
    args: { items: departments, leavesOnly: false, disabled: false, invalid: false },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { Field, TreeSelect },
        setup: () => ({ args, value: ref<string | null>('operations') }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Department"><TreeSelect v-bind="args" v-model="value" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const LeavesOnly: Story = { args: { leavesOnly: true } };

/** Several departments with check boxes: chips in the field, "+N" beyond maxShown, a clear button */
export const Multiple: Story = {
    name: 'Multiple selection',
    render: () => ({
        components: { Field, TreeSelect },
        setup: () => ({ items: departments, value: ref<string[]>(['engineering', 'sales']) }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <Field label="Departments">
                    <TreeSelect v-model="value" :items="items" multiple :max-shown="2" clearable filter />
                </Field>
                <span class="text-xs text-muted">Value: {{ value.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** A search field above the tree */
export const Search: Story = {
    name: 'Search',
    render: () => ({
        components: { Field, TreeSelect },
        setup: () => ({ items: departments, value: ref<string | null>(null) }),
        template: `
            <div class="w-72">
                <Field label="Department"><TreeSelect v-model="value" :items="items" filter clearable /></Field>
            </div>`,
    }),
};

/** Sub-departments load when a branch opens; they stay known while the field lives */
export const LazyChildren: Story = {
    name: 'Lazy-loaded children',
    render: () => ({
        components: { Field, TreeSelect },
        setup: () => ({
            items: [
                { id: 'north', label: 'Region North', hasChildren: true },
                { id: 'south', label: 'Region South', hasChildren: true },
            ],
            loadChildren: async (node: TreeNode) => {
                await new Promise((done) => setTimeout(done, 700));
                return ['Hamburg', 'Bremen', 'Kiel'].map((city) => ({
                    id: `${node.id}-${city}`,
                    label: `${city} (${node.label})`,
                }));
            },
            value: ref<string | null>(null),
        }),
        template: `
            <div class="w-72">
                <Field label="Location"><TreeSelect v-model="value" :items="items" :load-children="loadChildren" /></Field>
            </div>`,
    }),
};

/** Heights of 32, 40 and 48 px; a spinner while the field waits for data */
export const SizesLoading: Story = {
    name: 'Sizes and loading',
    render: () => ({
        components: { TreeSelect },
        setup: () => ({ items: departments }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <TreeSelect :items="items" size="sm" aria-label="Small" default-value="operations" clearable />
                <TreeSelect :items="items" aria-label="Medium" default-value="operations" />
                <TreeSelect :items="items" size="lg" aria-label="Large" loading />
            </div>`,
    }),
};
