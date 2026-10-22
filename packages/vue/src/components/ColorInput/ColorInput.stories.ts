import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Field from '../Field/Field.vue';
import ColorInput from './ColorInput.vue';

const swatches = ['#0a0a0a', '#1e66f5', '#7c3aed', '#0d9488', '#16a34a', '#d97706', '#dc2626', '#f4f4f4'];

const meta = {
    title: 'Forms/ColorInput',
    component: ColorInput,
    args: { format: 'hex', swatches, channelInputs: true, eyeDropper: true, alpha: false, disabled: false },
    argTypes: { format: { control: 'inline-radio', options: ['hex', 'rgb', 'hsl', 'hsb', 'oklch'] } },
    render: (args) => ({
        components: { ColorInput, Field },
        setup: () => ({ args, value: ref('#1e66f5') }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Field label="Brand color" helper-text="Hex, rgb(), hsl() or oklch()"><ColorInput v-bind="args" v-model="value" /></Field>
                <span class="font-mono text-xs text-muted">Value: {{ value }}</span>
            </div>`,
    }),
} satisfies Meta<typeof ColorInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type a color in any format (Enter takes it) or open the picker with the swatch */
export const Playground: Story = {};

/** The value in OKLCH */
export const Oklch: Story = { args: { format: 'oklch' } };
