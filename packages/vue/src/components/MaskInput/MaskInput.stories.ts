import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import MaskInput from './MaskInput.vue';

const meta = {
    title: 'Forms/MaskInput',
    component: MaskInput,
    args: { mask: 'DE99 9999 9999 9999 9999 99' },
    render: (args) => ({
        components: { Field, MaskInput },
        setup: () => ({ args, value: ref(''), raw: ref('') }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Field label="IBAN" helper-text="Type digits only – spaces are added automatically">
                    <MaskInput v-bind="args" v-model="value" @raw-change="raw = $event" />
                </Field>
                <span class="text-xs text-muted">Value: {{ value || '–' }} · Digits: {{ raw || '–' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof MaskInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Formats: Story = {
    render: () => ({
        components: { Field, MaskInput },
        template: `
            <div class="flex w-64 flex-col gap-4">
                <Field label="Phone"><MaskInput mask="+4\\9 999 99999999" /></Field>
                <Field label="ZIP code"><MaskInput mask="99999" /></Field>
                <Field label="License plate"><MaskInput mask="aa-aa 9999" /></Field>
            </div>`,
    }),
};

/**
 * Optional rest after "?", own slot character and tokens, `unmask` (v-model without separators), `autoClear` (an
 * incomplete value is emptied on leaving) and the `complete` event
 */
export const Options: Story = {
    name: 'Options',
    render: () => ({
        components: { Field, MaskInput },
        setup: () => ({ zip: ref(''), done: ref(''), hex: { h: /[0-9a-f]/i } }),
        template: `
            <div class="flex w-72 flex-col gap-4">
                <Field label="ZIP code (with optional extension)" helper-text="v-model without separators">
                    <MaskInput v-model="zip" mask="99999?-9999" slot-char="#" unmask />
                </Field>
                <Field label="Color" helper-text="Hex digits; cleared on leave if incomplete">
                    <MaskInput mask="#hhhhhh" :tokens="hex" auto-clear @complete="done = $event" />
                </Field>
                <span class="text-xs text-muted" aria-live="polite">ZIP: {{ zip || '–' }} · Color done: {{ done || '–' }}</span>
            </div>`,
    }),
};
