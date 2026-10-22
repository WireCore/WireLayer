import { LayoutGrid, List, Map as MapIcon } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SegmentedControl from './SegmentedControl.vue';
import SegmentedControlItem from './SegmentedControlItem.vue';

const meta = {
    title: 'Buttons/SegmentedControl',
    component: SegmentedControl,
    args: { label: 'View', defaultValue: 'list', size: 'md', disabled: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
    render: (args) => ({
        components: { SegmentedControl, SegmentedControlItem },
        setup: () => ({ args, LayoutGrid, List, MapIcon }),
        template: `
            <SegmentedControl v-bind="args">
                <SegmentedControlItem value="list" :icon="List">List</SegmentedControlItem>
                <SegmentedControlItem value="grid" :icon="LayoutGrid">Grid</SegmentedControlItem>
                <SegmentedControlItem value="map" :icon="MapIcon">Map</SegmentedControlItem>
            </SegmentedControl>`,
    }),
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Language: Story = {
    render: () => ({
        components: { SegmentedControl, SegmentedControlItem },
        template: `
            <SegmentedControl label="Language" size="sm" default-value="de">
                <SegmentedControlItem value="de">DE</SegmentedControlItem>
                <SegmentedControlItem value="en">EN</SegmentedControlItem>
            </SegmentedControl>`,
    }),
};
