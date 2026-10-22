import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleCheck, Info, OctagonX, TriangleAlert } from 'lucide-react';
import { Badge } from './Badge.js';

const meta = {
    title: 'Data/Badge',
    component: Badge,
    args: { variant: 'soft', children: 'BETA' },
    argTypes: {
        variant: { control: 'select', options: ['solid', 'soft', 'outline', 'success', 'info', 'warn', 'danger'] },
        icon: { control: false },
    },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overview: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="solid">NEW</Badge>
            <Badge>BETA</Badge>
            <Badge variant="outline">v2.4.1</Badge>
            <Badge variant="success" icon={CircleCheck}>
                Online
            </Badge>
            <Badge variant="info" icon={Info}>
                Maintenance
            </Badge>
            <Badge variant="warn" icon={TriangleAlert}>
                High load
            </Badge>
            <Badge variant="danger" icon={OctagonX}>
                Offline
            </Badge>
        </div>
    ),
};

/** Round badge for a count or a single character */
export const Circle: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="solid" circle>
                4
            </Badge>
            <Badge variant="danger" circle>
                12
            </Badge>
            <Badge variant="outline" circle>
                A
            </Badge>
        </div>
    ),
};
