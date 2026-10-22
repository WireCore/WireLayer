import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import PinInput from './PinInput.vue';

const meta = {
    title: 'Forms/PinInput',
    component: PinInput,
    args: { length: 6, type: 'numeric', mask: false, invalid: false, disabled: false },
    argTypes: { type: { control: 'inline-radio', options: ['numeric', 'alphanumeric', 'alphabetic'] } },
    render: (args) => ({
        components: { Field, PinInput },
        setup: () => ({ args, code: ref(''), done: ref('') }),
        template: `
            <div class="flex flex-col gap-3">
                <Field label="Verification code" helper-text="We sent you a 6-digit code by SMS">
                    <PinInput v-bind="args" v-model="code" @value-complete="done = $event" />
                </Field>
                <span class="text-xs text-muted">{{ done ? 'Complete: ' + done : 'Input: ' + (code || '–') }}</span>
            </div>`,
    }),
} satisfies Meta<typeof PinInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
