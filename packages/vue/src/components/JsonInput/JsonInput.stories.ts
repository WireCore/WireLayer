import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import JsonInput from './JsonInput.vue';

const meta = {
    title: 'Forms/JsonInput',
    component: JsonInput,
    args: { indent: 2, formatButton: true, formatOnBlur: false, disabled: false },
    render: (args) => ({
        components: { Field, JsonInput },
        setup: () => ({ args, value: ref('{"name":"web-01","tags":["prod","eu"],"replicas":3}') }),
        template: `
            <Field label="Configuration" helper-text="JSON – checked as you type" class="w-[440px]">
                <JsonInput v-bind="args" v-model="value" />
            </Field>`,
    }),
} satisfies Meta<typeof JsonInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Checked while typing; the result is the field's description; "Format" pretty-prints */
export const Playground: Story = {};

/** An error with its position */
export const Invalid: Story = {
    name: 'Invalid',
    render: () => ({
        components: { Field, JsonInput },
        setup: () => ({ value: ref('{\n  "name": "web-01",\n  "tags": ["prod",]\n}') }),
        template: `<Field label="Configuration" class="w-[440px]"><JsonInput v-model="value" /></Field>`,
    }),
};
