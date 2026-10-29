import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Progress from './Progress.vue';

const meta = {
    title: 'Feedback/Progress',
    component: Progress,
    args: { value: 68, max: 100, label: 'BUILD', showValue: true },
    argTypes: { value: { control: { type: 'range', min: 0, max: 100 } } },
    render: (args) => ({
        components: { Progress },
        setup: () => ({ args }),
        template: '<Progress v-bind="args" class="w-[380px]" />',
    }),
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Several parts in one bar, named in the legend (tooltip on the part) */
export const Segments: Story = {
    name: 'Segments',
    args: {
        value: 0,
        label: 'Storage',
        segments: [
            { value: 42, label: 'Databases', tooltip: '420 GB' },
            { value: 26, label: 'Backups', color: 'success', tooltip: '260 GB' },
            { value: 9, label: 'Logs', color: 'warn', tooltip: '90 GB' },
        ],
    },
};

/** Steps as blocks */
export const Steps: Story = {
    name: 'Steps',
    args: { value: 3, max: 5, steps: 5, label: 'Step 3 of 5', showValue: false },
};

/** Stripes, moving (only without reduced motion) */
export const Striped: Story = {
    name: 'Striped',
    args: { value: 55, label: 'Upload', striped: true, animated: true },
};

/** Vertical bars */
export const Vertical: Story = {
    name: 'Vertical',
    render: () => ({
        components: { Progress },
        template: `
            <div class="flex h-40 gap-8">
                <Progress :value="70" label="CPU" orientation="vertical" />
                <Progress :value="35" label="RAM" orientation="vertical" striped />
            </div>`,
    }),
};

/**
 * Compact bars for lists and status bars: `size="xs"`, `hide-label` (the label still names the bar for screen readers),
 * `bar-text` in the bar and `status` for the colour
 */
export const Compact: Story = {
    name: 'Compact',
    render: () => ({
        components: { Progress },
        template: `
            <div class="flex w-[380px] flex-col gap-3">
                <div class="flex items-center gap-3 text-xs">
                    <span class="w-28 truncate font-mono">backup.tar.gz</span>
                    <Progress :value="42" label="backup.tar.gz" hide-label :show-value="false" bar-text="42 %" />
                </div>
                <div class="flex items-center gap-3 text-xs">
                    <span class="w-28 truncate font-mono">logs.zip</span>
                    <Progress :value="0" label="logs.zip" hide-label :show-value="false" bar-text="waiting" />
                </div>
                <div class="flex items-center gap-3 text-xs">
                    <span class="w-28 truncate font-mono">db.dump</span>
                    <Progress :value="77" label="db.dump" hide-label :show-value="false" bar-text="failed" status="danger" />
                </div>
                <div class="flex items-center gap-3 text-xs">
                    <span class="w-28 truncate font-mono">site.zip</span>
                    <Progress :value="100" label="site.zip" hide-label :show-value="false" bar-text="done" status="success" />
                </div>
                <Progress :value="81" label="Disk" size="xs" status="warn" class="w-40" />
            </div>`,
    }),
};
