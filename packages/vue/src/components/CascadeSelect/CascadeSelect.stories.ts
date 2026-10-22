import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import CascadeSelectComponent from './CascadeSelect.vue';
import type { CascadeOption } from './types.js';

// Generic component: Storybook's Vue types can't infer args here
const CascadeSelect = CascadeSelectComponent as unknown as ConcreteComponent;

const locations: CascadeOption[] = [
    {
        value: 'de',
        label: 'Germany',
        children: [
            {
                value: 'by',
                label: 'Bavaria',
                children: [
                    { value: 'muc', label: 'Munich' },
                    { value: 'nue', label: 'Nuremberg' },
                ],
            },
            {
                value: 'he',
                label: 'Hesse',
                children: [
                    { value: 'fra', label: 'Frankfurt' },
                    { value: 'wie', label: 'Wiesbaden', disabled: true },
                ],
            },
        ],
    },
    {
        value: 'at',
        label: 'Austria',
        children: [
            { value: 'vie', label: 'Vienna' },
            { value: 'grz', label: 'Graz' },
        ],
    },
];

const meta = {
    title: 'Forms/CascadeSelect',
    component: CascadeSelect,
    args: { items: locations, disabled: false, invalid: false },
    argTypes: { items: { control: false } },
    render: (args) => ({
        components: { CascadeSelect, Field },
        setup: () => ({ args, value: ref<string | null>(null) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Location"><CascadeSelect v-bind="args" v-model="value" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

export const Preselected: Story = {
    render: (args) => ({
        components: { CascadeSelect, Field },
        setup: () => ({ args, value: ref<string | null>('fra') }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Location"><CascadeSelect v-bind="args" v-model="value" /></Field>
                <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
            </div>`,
    }),
};

const field = (props: string, label = 'Location') => ({
    components: { CascadeSelect, Field },
    setup: () => ({ items: locations, value: ref<string | null>(null) }),
    template: `
        <div class="flex w-80 flex-col gap-3">
            <Field label="${label}"><CascadeSelect v-model="value" :items="items" ${props} /></Field>
            <span class="text-xs text-muted">Value: {{ value ?? '–' }}</span>
        </div>`,
});

/** The field is a search field: the hits are listed with their whole path; the button at the end opens the levels */
export const Search: Story = { name: 'Search', render: () => field('filter clearable') };

/** The levels in between can be chosen, too ("Choose Bavaria") */
export const ChangeOnSelect: Story = { name: 'Selectable levels', render: () => field('change-on-select') };

/** Levels open on click and with the arrow keys only, not on hover */
export const ClickToOpen: Story = { name: 'Open on click', render: () => field('expand-trigger="click"') };

/** The cities of a country load when its level opens */
export const LazyChildren: Story = {
    name: 'Lazy-loaded children',
    render: () => ({
        components: { CascadeSelect, Field },
        setup: () => ({
            items: [
                { value: 'ch', label: 'Switzerland', hasChildren: true },
                { value: 'nl', label: 'Netherlands', hasChildren: true },
            ],
            loadChildren: async (option: CascadeOption) => {
                await new Promise((done) => setTimeout(done, 700));
                const cities: Record<string, string[]> = { ch: ['Zurich', 'Bern'], nl: ['Amsterdam', 'Utrecht'] };
                return (cities[option.value] ?? []).map((city) => ({ value: city.toLowerCase(), label: city }));
            },
            value: ref<string | null>(null),
        }),
        template: `
            <div class="w-72">
                <Field label="Location"><CascadeSelect v-model="value" :items="items" :load-children="loadChildren" /></Field>
            </div>`,
    }),
};

/** Objects as values, compared by their id (valueKey) */
export const ObjectValues: Story = {
    name: 'Objects as values',
    render: () => ({
        components: { CascadeSelect, Field },
        setup: () => ({
            items: [
                {
                    value: { id: 1, name: 'Sales' },
                    label: 'Sales',
                    children: [
                        { value: { id: 11, name: 'Inside sales' }, label: 'Inside sales' },
                        { value: { id: 12, name: 'Field sales' }, label: 'Field sales' },
                    ],
                },
            ],
            value: ref<{ id: number; name: string } | null>({ id: 12, name: 'Field sales' }),
        }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Team"><CascadeSelect v-model="value" :items="items" value-key="id" clearable /></Field>
                <span class="text-xs text-muted">Value: {{ value ? JSON.stringify(value) : '–' }}</span>
            </div>`,
    }),
};

/** Heights of 32, 40 and 48 px; a spinner while the field waits for data */
export const SizesLoading: Story = {
    name: 'Sizes and loading',
    render: () => ({
        components: { CascadeSelect },
        setup: () => ({ items: locations }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <CascadeSelect :items="items" size="sm" aria-label="Small" default-value="muc" clearable />
                <CascadeSelect :items="items" aria-label="Medium" default-value="muc" />
                <CascadeSelect :items="items" size="lg" aria-label="Large" loading />
            </div>`,
    }),
};
