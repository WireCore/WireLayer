import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import ColorSwatchPicker from './ColorSwatchPicker.vue';

const items = [
    { value: '#1e66f5', label: 'Blue' },
    { value: '#7c3aed', label: 'Violet' },
    { value: '#0d9488', label: 'Teal' },
    { value: '#16a34a', label: 'Green' },
    { value: '#d97706', label: 'Orange' },
    { value: '#dc2626', label: 'Red' },
    { value: '#525252', label: 'Gray', disabled: true },
];

const meta = {
    title: 'Forms/ColorSwatchPicker',
    component: ColorSwatchPicker,
    args: { items, label: 'Project color', showLabels: false, size: 'md', disabled: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => ({
        components: { ColorSwatchPicker },
        setup: () => ({ args, value: ref('#1e66f5') }),
        template: `
            <div class="flex flex-col gap-3">
                <ColorSwatchPicker v-bind="args" v-model="value" />
                <span class="font-mono text-xs text-muted">Value: {{ value }}</span>
            </div>`,
    }),
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A radio group: arrow keys choose, every color is named; the chosen one has a tick */
export const Playground: Story = {};

/** Names below the colors */
export const WithNames: Story = { name: 'With names', args: { showLabels: true, size: 'lg' } };
