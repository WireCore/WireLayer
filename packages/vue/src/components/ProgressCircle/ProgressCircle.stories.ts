import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ProgressCircle from './ProgressCircle.vue';

const meta = {
    title: 'Feedback/ProgressCircle',
    component: ProgressCircle,
    args: { value: 72, max: 100, label: 'Storage used', size: 'md', status: 'neutral' },
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        status: { control: 'inline-radio', options: ['neutral', 'success', 'warn', 'danger'] },
    },
    render: (args) => ({
        components: { ProgressCircle },
        setup: () => ({ args }),
        template: `<ProgressCircle v-bind="args" />`,
    }),
} satisfies Meta<typeof ProgressCircle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const KeyFigures: Story = {
    render: () => ({
        components: { ProgressCircle },
        template: `
            <div class="flex items-end gap-8">
                <ProgressCircle :value="99.9" label="Availability" status="success" size="lg" :format-value="(v) => v.toLocaleString('en-US') + '%'" />
                <ProgressCircle :value="81" label="CPU" status="warn" />
                <ProgressCircle :value="12" :max="16" label="RAM (GB)" size="sm" :format-value="(v) => String(v)" />
            </div>`,
    }),
};
