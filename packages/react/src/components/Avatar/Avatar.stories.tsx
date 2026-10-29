import type { Meta, StoryObj } from '@storybook/react-vite';
import { Building2 } from 'lucide-react';
import { Avatar } from './Avatar.js';
import { AvatarGroup } from './AvatarGroup.js';

const meta = {
    title: 'Data/Avatar',
    component: Avatar,
    args: { name: 'Julia Klein', variant: 'solid', size: 'lg', shape: 'circle' },
    argTypes: {
        variant: { control: 'inline-radio', options: ['solid', 'outline', 'soft'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
        color: { control: 'select', options: [undefined, 'auto', 'primary', 'success', 'info', 'warn', 'danger'] },
        shape: { control: 'inline-radio', options: ['circle', 'square'] },
        icon: { control: false },
    },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Overview: Story = {
    render: () => (
        <div className="flex items-center gap-2.5">
            <Avatar name="Julia Klein" variant="solid" size="lg" />
            <Avatar name="Max Schulz" variant="outline" />
            <Avatar size="sm" />
            <Avatar icon={Building2} variant="outline" shape="square" />
        </div>
    ),
};

export const Group: Story = {
    render: () => (
        <AvatarGroup label="Project team" more={5}>
            <Avatar name="Julia Klein" />
            <Avatar name="Max Schulz" />
            <Avatar name="Anna Berg" />
            <Avatar name="Lena Wolf" />
        </AvatarGroup>
    ),
};

export const Sizes: Story = {
    render: () => (
        <div className="flex items-center gap-2.5">
            {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
                <Avatar key={size} name="Julia Klein" size={size} color="auto" />
            ))}
        </div>
    ),
};

/** `color="auto"`: the same name always gets the same token colour (all meet 4.5:1); a broken image falls back */
export const Colors: Story = {
    render: () => (
        <div className="flex items-center gap-2.5">
            {['Julia Klein', 'Max Schulz', 'Anna Berg', 'Lena Wolf', 'Tom Hahn'].map((name) => (
                <Avatar key={name} name={name} color="auto" size="lg" />
            ))}
            <Avatar name="Missing image" src="/does-not-exist.jpg" color="auto" size="lg" shape="square" />
        </div>
    ),
};

/** `initials`: own initials instead of the ones from `name` (which takes the first letters of the words) */
export const OwnInitials: Story = {
    name: 'Own initials',
    render: () => (
        <div className="flex items-center gap-2.5">
            <Avatar name="my-server" color="auto" />
            <Avatar name="my-server" initials="MS" color="auto" />
            <Avatar name="db_primary" initials="DB" color="info" shape="square" />
        </div>
    ),
};
