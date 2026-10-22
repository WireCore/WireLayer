import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import NumberInput from './NumberInput.vue';

const meta = {
    title: 'Forms/NumberInput',
    component: NumberInput,
    args: { size: 'md', min: 0, max: 100, step: 1, disabled: false, invalid: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { Field, NumberInput },
        setup: () => ({ args, value: ref<number | null>(8) }),
        template: `
            <Field label="Number of servers" helper-text="Between 0 and 100" class="w-60">
                <NumberInput v-bind="args" v-model="value" />
            </Field>`,
    }),
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Formats: Story = {
    render: () => ({
        components: { Field, NumberInput },
        template: `
            <div class="flex w-60 flex-col gap-4">
                <Field label="Budget">
                    <NumberInput :default-value="12500" :step="100" :format-options="{ style: 'currency', currency: 'EUR' }" />
                </Field>
                <Field label="Discount">
                    <NumberInput :default-value="0.15" :step="0.05" :min="0" :max="1" :format-options="{ style: 'percent' }" />
                </Field>
                <Field label="Weight (kg)">
                    <NumberInput :default-value="2.5" :step="0.1" size="sm" />
                </Field>
            </div>`,
    }),
};

/**
 * Without buttons, stacked buttons, free prefix/suffix, fixed decimals, no negatives and selecting on focus. "." and
 * "," both type the decimal separator; pasted numbers are read in either notation
 */
export const Options: Story = {
    name: 'Options',
    render: () => ({
        components: { Field, NumberInput },
        setup: () => ({ price: ref<number | null>(12.5) }),
        template: `
            <div class="flex w-60 flex-col gap-4">
                <Field label="Quantity (no buttons)"><NumberInput :default-value="3" :stepper="false" select-on-focus /></Field>
                <Field label="Font size"><NumberInput :default-value="12" stepper-layout="stacked" suffix="pt" /></Field>
                <Field label="Price" helper-text="Two decimals, not negative">
                    <NumberInput v-model="price" :decimals="2" :allow-negative="false" prefix="≈" suffix="€" clearable />
                </Field>
                <Field label="Pieces" helper-text="Whole numbers only, at most 10">
                    <NumberInput :default-value="4" :allow-decimal="false" :max="10" clamp-behavior="strict" />
                </Field>
            </div>`,
    }),
};
