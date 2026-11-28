import { LayoutGrid, List, Map as MapIcon } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { ConcreteComponent } from 'vue';
import SegmentedControlComponent from './SegmentedControl.vue';
import SegmentedControlItem from './SegmentedControlItem.vue';

// Generic component: Storybook's Vue types can't infer args here
const SegmentedControl = SegmentedControlComponent as unknown as ConcreteComponent;

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

/** Only icons: `label` names each segment for screen readers, the icon sits in the middle */
export const IconOnly: Story = {
    name: 'Icon only',
    render: () => ({
        components: { SegmentedControl, SegmentedControlItem },
        setup: () => ({ LayoutGrid, List }),
        template: `
            <SegmentedControl label="View" default-value="list">
                <SegmentedControlItem value="list" :icon="List" label="List" />
                <SegmentedControlItem value="tiles" :icon="LayoutGrid" label="Tiles" />
            </SegmentedControl>`,
    }),
};
