import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Slider from './Slider.vue';

const meta = {
    title: 'Forms/Slider',
    component: Slider,
    args: { label: 'Utilization limit', min: 0, max: 100, step: 5, disabled: false, showValue: true },
    render: (args) => ({
        components: { Slider },
        setup: () => ({ args, value: ref([70]), percent: (value: number) => `${value}%` }),
        template: `<Slider v-bind="args" v-model="value" :format-value="percent" class="w-80" />`,
    }),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Two thumbs, named "Price, Minimum" and "Price, Maximum" */
export const Range: Story = {
    render: () => ({
        components: { Slider },
        setup: () => ({ value: ref([200, 800]), euro: (value: number) => `€${value}` }),
        template: `<Slider v-model="value" label="Price" :min="0" :max="1000" :step="50" :format-value="euro" class="w-80" />`,
    }),
};

/** Marks with labels; restrictToMarks allows only these values (arrow keys go from mark to mark) */
export const Marks: Story = {
    render: () => ({
        components: { Slider },
        setup: () => ({
            value: ref([50]),
            marks: [
                { value: 0, label: 'Off' },
                { value: 25, label: 'Basic' },
                { value: 50, label: 'Pro' },
                { value: 100, label: 'Max' },
            ],
        }),
        template: '<Slider v-model="value" label="Package" :marks="marks" restrict-to-marks class="w-80" />',
    }),
};

export const Vertical: Story = {
    render: () => ({
        components: { Slider },
        setup: () => ({ value: ref([30]) }),
        template: `
            <div class="h-64">
                <Slider v-model="value" label="Level" orientation="vertical" :marks="[0, 50, 100]" :format-value="(v) => v + '%'" />
            </div>`,
    }),
};

/** Range with a minimum distance of €100 between the thumbs */
export const MinRange: Story = {
    render: () => ({
        components: { Slider },
        setup: () => ({ value: ref([200, 800]) }),
        template:
            '<Slider v-model="value" label="Price" :max="1000" :step="10" :min-range="100" :format-value="(v) => \'€\' + v" class="w-80" />',
    }),
};

/**
 * Apply on release: without v-model the slider keeps its own value (`default-value`); `@value-change-end` reports it
 * once the thumb is let go – e.g. to filter only then. Change its `key` to set it back from outside
 */
export const ApplyOnRelease: Story = {
    name: 'Apply on release',
    render: () => ({
        components: { Slider },
        setup: () => ({ applied: ref([50]) }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Slider label="Minimum load" :default-value="[50]" :format-value="(v) => v + '%'" @value-change-end="applied = $event" />
                <span class="text-xs text-muted">Filter applied: {{ applied[0] }}%</span>
            </div>`,
    }),
};
