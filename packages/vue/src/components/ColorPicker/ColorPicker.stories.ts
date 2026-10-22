import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import ColorPicker from './ColorPicker.vue';

const swatches = ['#0a0a0a', '#1e66f5', '#7c3aed', '#0d9488', '#16a34a', '#d97706', '#dc2626', '#f4f4f4'];

const meta = {
    title: 'Forms/ColorPicker',
    component: ColorPicker,
    args: { alpha: false, swatches, disabled: false },
    render: (args) => ({
        components: { ColorPicker, Field },
        setup: () => ({ args, value: ref('#1e66f5') }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Accent color"><ColorPicker v-bind="args" v-model="value" /></Field>
                <span class="text-xs text-muted">Value: {{ value }}</span>
            </div>`,
    }),
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAlpha: Story = { args: { alpha: true } };

/** Value in OKLCH; number fields for RGB, HSL, HSB or OKLCH and the eye dropper (where the browser has one) */
export const Oklch: Story = {
    render: () => ({
        components: { ColorPicker, Field },
        setup: () => ({ value: ref('oklch(55.4% 0.218 262.9)') }),
        template: `
            <div class="flex w-64 flex-col gap-3">
                <Field label="Accent color"><ColorPicker v-model="value" format="oklch" channel-inputs eye-dropper /></Field>
                <span class="text-xs text-muted">Value: {{ value }}</span>
            </div>`,
    }),
};

/** Only a palette: the popup shows the preset colors */
export const PaletteOnly: Story = { name: 'Palette only', args: { withPicker: false } };
