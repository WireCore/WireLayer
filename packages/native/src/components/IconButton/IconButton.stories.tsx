import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Bell, Check, Ellipsis, Mail, Plus, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';
import { IconButton } from './IconButton.js';

const meta = {
    title: 'Buttons/IconButton',
    component: IconButton,
    args: { icon: Bell, label: 'Notifications', variant: 'outline', size: 'md', badge: 4 },
    argTypes: {
        icon: { control: false },
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'danger', 'outline', 'text'],
        },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
    render: () => (
        <View className="flex-row flex-wrap items-center gap-2">
            <IconButton icon={Plus} label="Add" variant="primary" />
            <IconButton icon={Mail} label="Messages" variant="secondary" badge={12} />
            <IconButton icon={Bell} label="Notifications" badge />
            <IconButton icon={Ellipsis} label="More actions" variant="text" />
            <IconButton icon={Plus} label="Add" size="sm" />
            <IconButton icon={Plus} label="Add" size="lg" />
        </View>
    ),
};

export const Colors: Story = {
    render: () => (
        <View className="flex-row flex-wrap items-center gap-2">
            <IconButton icon={Trash2} label="Delete" variant="text" color="danger" />
            <IconButton icon={Trash2} label="Delete" variant="outline" color="danger" />
            <IconButton icon={Check} label="Approve" variant="soft" color="success" />
            <IconButton icon={Check} label="Approve" shape="rounded" />
        </View>
    ),
};

/** `loading`: a spinner instead of the icon, the name stays; presses are ignored (like Button) */
export const Loading: Story = {
    render: () => (
        <View className="flex-row items-center gap-2">
            <IconButton icon={Plus} label="Add" loading />
            <IconButton icon={Trash2} label="Delete" variant="outline" color="danger" loading />
        </View>
    ),
};
