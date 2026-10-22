import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import NativeSelect from './NativeSelect.vue';

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
