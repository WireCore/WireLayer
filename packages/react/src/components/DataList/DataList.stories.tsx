import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge/Badge.js';
import { DataList, DataListItem } from './DataList.js';

const meta = {
    title: 'Data/DataList',
    component: DataList,
    args: { orientation: 'horizontal', divided: false },
    argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] } },
    render: (args) => (
        <DataList {...args} className="w-96">
            <DataListItem label="Server">web-01</DataListItem>
            <DataListItem label="Location">Frankfurt</DataListItem>
            <DataListItem label="Status">
                <Badge variant="success">Online</Badge>
            </DataListItem>
            <DataListItem label="Created">10/20/2026</DataListItem>
        </DataList>
    ),
} satisfies Meta<typeof DataList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Labels above the values, in columns – e.g. key figures */
export const Vertical: Story = {
    args: { orientation: 'vertical' },
    render: (args) => (
        <DataList {...args} className="w-[32rem] grid-cols-3">
            <DataListItem label="Customer">Northside Utilities</DataListItem>
            <DataListItem label="Contract">Managed Hosting</DataListItem>
            <DataListItem label="Term">until 12/31/2027</DataListItem>
        </DataList>
    ),
};

export const Divided: Story = { args: { divided: true } };
