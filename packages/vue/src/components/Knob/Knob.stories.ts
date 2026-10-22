import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Knob from './Knob.vue';

const meta = {
    title: 'Forms/Knob',
    component: Knob,
    args: { label: 'Volume', min: 0, max: 100, step: 1, size: 'md', disabled: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { Knob },
        setup: () => ({ args, value: ref(40), percent: (value: number) => `${value}%` }),
        template: `<Knob v-bind="args" v-model="value" :format-value="percent" />`,
    }),
} satisfies Meta<typeof Knob>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Sizes: Story = {
    render: () => ({
        components: { Knob },
        setup: () => ({ celsius: (value: number) => `${value} °C` }),
        template: `
            <div class="flex items-end gap-6">
                <Knob label="Small" size="sm" :default-value="20" />
                <Knob label="Temperature" :min="10" :max="30" :step="0.5" :default-value="21" :format-value="celsius" />
                <Knob label="Large" size="lg" :default-value="80" />
            </div>`,
    }),
};

/** Text template, stroke width and color */
export const Styling: Story = {
    name: 'Styling',
    render: () => ({
        components: { Knob },
        template: `
            <div class="flex items-end gap-6">
                <Knob label="Level" :default-value="64" value-template="{value} dB" :stroke-width="12" color="success" />
                <Knob label="Load" :default-value="88" value-template="{value}%" color="danger" :stroke-width="4" />
            </div>`,
    }),
};
