import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { ArrowRight, Bell, Check, Download, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from './Button.js';

const meta = {
    title: 'Buttons/Button',
    component: Button,
    args: {
        variant: 'primary',
        size: 'md',
        loading: false,
        disabled: false,
        trailingIcon: ArrowRight,
        children: 'Start project',
    },
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'success', 'danger', 'outline', 'text', 'link'],
        },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        leadingIcon: { control: false },
        trailingIcon: { control: false },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
    render: () => (
        <View className="flex-row flex-wrap items-center gap-2">
            <Button trailingIcon={ArrowRight}>Start project</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success" leadingIcon={Check}>
                Save
            </Button>
            <Button variant="danger" leadingIcon={Trash2}>
                Delete
            </Button>
            <Button variant="outline">View services</Button>
            <Button variant="text" leadingIcon={Download}>
                Text
            </Button>
            <Button variant="link" role="link">
                Link
            </Button>
        </View>
    ),
};

export const Sizes: Story = {
    render: () => (
        <View className="flex-row flex-wrap items-center gap-2">
            <Button size="sm" trailingIcon={ArrowRight}>
                Small
            </Button>
            <Button size="md" trailingIcon={ArrowRight}>
                Default
            </Button>
            <Button size="lg" trailingIcon={ArrowRight}>
                Large
            </Button>
        </View>
    ),
};

function StatesDemo() {
    const [loading, setLoading] = useState(false);
    const send = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 1800);
    };

    return (
        <View className="flex-row flex-wrap items-center gap-2">
            <Button className="min-w-[150px]" loading={loading} onPress={send}>
                {loading ? 'Sending' : 'Send request'}
            </Button>
            <Button disabled>Disabled</Button>
        </View>
    );
}

export const States: Story = {
    render: () => <StatesDemo />,
};

export const Colors: Story = {
    render: () => (
        <View className="w-[360px] gap-3">
            <View className="flex-row flex-wrap items-center gap-2">
                <Button variant="info">Info</Button>
                <Button variant="warn">Warning</Button>
                <Button variant="soft">Tinted</Button>
                <Button variant="outline" color="danger" leadingIcon={Trash2}>
                    Delete
                </Button>
                <Button variant="text" color="danger">
                    Remove
                </Button>
                <Button variant="soft" color="success" leadingIcon={Check}>
                    Approve
                </Button>
                <Button color="contrast">Contrast</Button>
            </View>
            <View className="flex-row flex-wrap items-center gap-2">
                <Button shape="rounded">Rounded</Button>
                <Button shape="square" variant="outline">
                    Square
                </Button>
                <Button variant="outline" leadingIcon={Bell} badge={4}>
                    Notifications
                </Button>
            </View>
            <Button block trailingIcon={ArrowRight}>
                Full width
            </Button>
        </View>
    ),
};
