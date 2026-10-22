import type { Meta, StoryObj } from '@storybook/react-vite';
import { Mail } from 'lucide-react';
import { Avatar } from '../Avatar/Avatar.js';
import { OverlayBadge } from './OverlayBadge.js';

const meta = {
    title: 'Data/OverlayBadge',
    component: OverlayBadge,
    args: { count: 3, max: 99, label: '3 unread messages', children: null },
    argTypes: { children: { control: false } },
    render: (args) => (
        <div className="flex items-center gap-8">
            <OverlayBadge {...args}>
                <Avatar name="Julia Klein" />
            </OverlayBadge>
            <OverlayBadge count={120} label="120 new notifications">
                <Mail className="size-6" aria-hidden="true" />
            </OverlayBadge>
            <OverlayBadge label="Online">
                <Avatar name="Max Schulz" variant="solid" />
            </OverlayBadge>
        </div>
    ),
} satisfies Meta<typeof OverlayBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
