import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutGrid, List, Map as MapIcon } from 'lucide-react';
import { SegmentedControl } from './SegmentedControl.js';
import { SegmentedControlItem } from './SegmentedControlItem.js';

const meta = {
    title: 'Buttons/SegmentedControl',
    component: SegmentedControl,
    args: { label: 'View', defaultValue: 'list', size: 'md', disabled: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md'] } },
    render: (args) => (
        <SegmentedControl {...args}>
            <SegmentedControlItem value="list" icon={List}>
                List
            </SegmentedControlItem>
            <SegmentedControlItem value="grid" icon={LayoutGrid}>
                Grid
            </SegmentedControlItem>
            <SegmentedControlItem value="map" icon={MapIcon}>
                Map
            </SegmentedControlItem>
        </SegmentedControl>
    ),
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Language: Story = {
    render: () => (
        <SegmentedControl label="Language" size="sm" defaultValue="de">
            <SegmentedControlItem value="de">DE</SegmentedControlItem>
            <SegmentedControlItem value="en">EN</SegmentedControlItem>
        </SegmentedControl>
    ),
};

/** Only icons: `label` names each segment for screen readers, the icon sits in the middle */
export const IconOnly: Story = {
    name: 'Icon only',
    render: () => (
        <SegmentedControl label="View" defaultValue="list">
            <SegmentedControlItem value="list" icon={List} label="List" />
            <SegmentedControlItem value="tiles" icon={LayoutGrid} label="Tiles" />
        </SegmentedControl>
    ),
};
