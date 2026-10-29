import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Field from '../Field/Field.vue';
import NativeSelectComponent from './NativeSelect.vue';

// Generic component: Storybook's Vue types can't infer args here
const NativeSelect = NativeSelectComponent as unknown as ConcreteComponent;

const items = [
    { value: 'fra', label: 'Frankfurt' },
    { value: 'nue', label: 'Nuremberg' },
    { value: 'vie', label: 'Vienna', disabled: true },
];

const meta = {
    title: 'Forms/NativeSelect',
    component: NativeSelect,
    args: { items, placeholder: 'Select', size: 'md', disabled: false, invalid: false },
    argTypes: { items: { control: false }, size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { Field, NativeSelect },
        setup: () => ({ args, value: ref('nue') }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Location"><NativeSelect v-bind="args" v-model="value" /></Field>
                <span class="text-xs text-muted">Value: {{ value || '–' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Number values: v-model gets numbers back; the placeholder option gives an empty string */
export const NumberValues: Story = {
    name: 'Number values',
    render: () => ({
        components: { Field, NativeSelect },
        setup: () => ({
            port: ref(22),
            ports: [
                { value: 22, label: '22 (SSH)' },
                { value: 2222, label: '2222' },
                { value: 443, label: '443 (HTTPS)' },
            ],
        }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Port"><NativeSelect v-model="port" :items="ports" /></Field>
                <span class="text-xs text-muted">Value: {{ port }} ({{ typeof port }})</span>
            </div>`,
    }),
};
