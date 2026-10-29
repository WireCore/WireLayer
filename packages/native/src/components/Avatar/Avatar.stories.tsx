import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Building2 } from 'lucide-react-native';
import { View } from 'react-native';
import { Avatar } from './Avatar.js';

const meta = {
    title: 'Data/Avatar',
    component: Avatar,
    args: { name: 'Max Mustermann', variant: 'soft', size: 'md', shape: 'circle' },
    argTypes: {
        variant: { control: 'inline-radio', options: ['solid', 'outline', 'soft'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        shape: { control: 'inline-radio', options: ['circle', 'square'] },
        icon: { control: false },
    },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
    render: () => (
        <View className="flex-row flex-wrap items-center gap-3">
            <Avatar name="Max Mustermann" variant="solid" />
            <Avatar name="Erika Musterfrau" variant="outline" />
            <Avatar name="WireLayer Inc." shape="square" icon={Building2} />
            <Avatar />
            <Avatar name="Max Mustermann" size="sm" />
            <Avatar name="Max Mustermann" size="lg" />
        </View>
    ),
};

export const SizesAndColors: Story = {
    render: () => (
        <View className="gap-3">
            <View className="flex-row items-center gap-2">
                <Avatar name="Julia Klein" size="sm" color="auto" />
                <Avatar name="Max Mustermann" size="md" color="auto" />
                <Avatar name="Anna Berg" size="lg" color="auto" />
                <Avatar name="Tom Weber" size="xl" color="auto" />
                <Avatar name="Lena Fischer" size="2xl" color="auto" />
            </View>
            <View className="flex-row items-center gap-2">
                <Avatar name="Server North" color="info" shape="square" size="xl" />
                {/* A missing image falls back to the initials */}
                <Avatar name="Missing image" src="data:image/png;base64,AAAA" size="xl" />
                <Avatar size="xl" />
            </View>
        </View>
    ),
};

/** `initials`: own initials instead of the ones from `name` (which takes the first letters of the words) */
export const OwnInitials: Story = {
    name: 'Own initials',
    render: () => (
        <View className="flex-row items-center gap-2">
            <Avatar name="my-server" color="auto" />
            <Avatar name="my-server" initials="MS" color="auto" />
            <Avatar name="db_primary" initials="DB" color="info" shape="square" />
        </View>
    ),
};
