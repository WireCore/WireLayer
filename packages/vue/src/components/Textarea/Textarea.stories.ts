import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import Textarea from './Textarea.vue';

const meta = {
    title: 'Forms/Textarea',
    component: Textarea,
    args: { autoResize: true, disabled: false, invalid: false },
    render: (args) => ({
        components: { Field, Textarea },
        setup: () => ({ args, text: ref('We are planning a customer portal.') }),
        template: `
            <Field label="Message" helper-text="The field grows with the text" class="w-80">
                <Textarea v-bind="args" v-model="text" rows="2" />
            </Field>`,
    }),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AutoResize: Story = {};

/** Counter for maxlength – the remaining characters are announced once typing pauses */
export const Counter: Story = {
    render: () => ({
        components: { Field, Textarea },
        setup: () => ({ text: ref('Short description of the project') }),
        template: `
            <Field label="Short description" class="w-80">
                <Textarea v-model="text" :maxlength="120" show-count clearable rows="3" />
            </Field>`,
    }),
};

/** Grows between 2 and 5 rows, then it scrolls */
export const Rows: Story = {
    render: () => ({
        components: { Field, Textarea },
        setup: () => ({ text: ref('Line 1\nLine 2') }),
        template: `
            <Field label="Note" class="w-80">
                <Textarea v-model="text" auto-resize :min-rows="2" :max-rows="5" />
            </Field>`,
    }),
};

/** Without v-model: start value and counter */
export const InitialValue: Story = {
    name: 'Initial value',
    render: () => ({
        components: { Field, Textarea },
        template: `
            <Field label="Comment" class="w-80">
                <Textarea default-value="First draft" :maxlength="80" show-count rows="2" />
            </Field>`,
    }),
};

export const SizesAndStates: Story = {
    render: () => ({
        components: { Field, Textarea },
        template: `
            <div class="flex w-80 flex-col gap-3.5">
                <Field label="Small"><Textarea size="sm" rows="2" /></Field>
                <Field label="Large"><Textarea size="lg" rows="2" /></Field>
                <Field label="Validated" success="Looks good."><Textarea rows="2" /></Field>
                <Field label="Saving"><Textarea loading rows="2" /></Field>
            </div>`,
    }),
};
