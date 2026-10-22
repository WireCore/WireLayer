import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { OrgChart, type OrgChartNode, type OrgChartProps } from './OrgChart.js';

const company: OrgChartNode = {
    label: 'Florian Laabs',
    title: 'Management',
    children: [
        {
            label: 'Julia Klein',
            title: 'Engineering',
            children: [
                { label: 'Max Schulz', title: 'Frontend' },
                { label: 'Ana Lopez', title: 'Backend' },
            ],
        },
        { label: 'Tom Becker', title: 'Operations', children: [{ label: 'Sara Wolf', title: 'Platform' }] },
        { label: 'Lena Roth', title: 'Sales' },
    ],
};

const meta = {
    title: 'Data/OrgChart',
    component: OrgChart,
    args: { node: company, label: 'Org chart' },
    argTypes: { node: { control: false } },
    parameters: { layout: 'padded' },
} satisfies Meta<typeof OrgChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

// Departments whose teams load when they are opened
const departments: OrgChartNode = {
    id: 'management',
    label: 'Florian Laabs',
    title: 'Management',
    children: [
        { id: 'engineering', label: 'Julia Klein', title: 'Engineering', hasChildren: true },
        { id: 'operations', label: 'Tom Becker', title: 'Operations', hasChildren: true },
    ],
};
async function loadTeam(node: OrgChartNode): Promise<OrgChartNode[]> {
    await new Promise((done) => setTimeout(done, 700));
    return [1, 2].map((index) => ({ id: `${node.id}-${index}`, label: `Member ${index}`, title: node.title }));
}

function CollapsibleDemo(args: OrgChartProps) {
    const [collapsed, setCollapsed] = useState(['0-1']);
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <div className="flex flex-col gap-3">
            <OrgChart
                {...args}
                collapsible
                collapsedKeys={collapsed}
                onCollapsedKeysChange={setCollapsed}
                selectionMode="multiple"
                selectedKeys={selected}
                onSelectedKeysChange={setSelected}
            />
            <span className="text-xs text-muted">Selected: {selected.join(', ') || '–'}</span>
        </div>
    );
}

/** A button below each manager shows or hides the team; the boxes can be chosen (toggle buttons) */
export const CollapsibleSelectable: Story = {
    name: 'Collapse, expand and select',
    render: (args) => <CollapsibleDemo {...args} />,
};

/** Teams load when they are opened */
export const LazyTeams: Story = {
    name: 'Lazy-loaded teams',
    render: () => <OrgChart node={departments} label="Org chart" collapsible loadChildren={loadTeam} />,
};

/** Own content of the boxes (renderContent) */
export const OwnContent: Story = {
    name: 'Custom content',
    render: (args) => (
        <OrgChart
            {...args}
            renderContent={(node) => (
                <>
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-on-primary">
                        {node.label
                            .split(' ')
                            .map((part) => part[0])
                            .join('')}
                    </span>
                    <span className="text-sm font-semibold">{node.label}</span>
                    <span className="text-xs text-muted">{node.title}</span>
                </>
            )}
        />
    ),
};
