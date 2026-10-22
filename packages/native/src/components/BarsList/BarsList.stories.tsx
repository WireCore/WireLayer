import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BarsList } from './BarsList.js';

const pages = [
    { label: '/pricing', value: 4820 },
    { label: '/products/customer-portal', value: 3210 },
    { label: '/blog/accessibility', value: 1940 },
    { label: '/contact', value: 860, tone: 'warn' as const },
    { label: '/legal-notice', value: 120 },
];

const meta = {
    title: 'Data/BarsList',
    component: BarsList,
    args: {
        label: 'Most visited pages',
        showTitle: true,
        items: pages,
        labelHeader: 'Page',
        valueHeader: 'Views',
        tone: 'primary',
    },
    argTypes: {
        items: { control: false },
        tone: { control: 'inline-radio', options: ['primary', 'info', 'success', 'warn', 'danger'] },
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof BarsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function LinksDemo() {
    const [opened, setOpened] = useState('');
    return (
        <View className="gap-3">
            <BarsList
                label="Referrers"
                showTitle
                tone="info"
                items={[
                    { label: 'Search engine', value: 5400, onPress: () => setOpened('Search engine') },
                    { label: 'Newsletter', value: 1250, onPress: () => setOpened('Newsletter') },
                    { label: 'Partner sites', value: 730, onPress: () => setOpened('Partner sites') },
                ]}
            />
            <Text className="font-sans text-xs text-muted">{opened ? `Opened: ${opened}` : 'Nothing opened yet'}</Text>
        </View>
    );
}

/** Rows that open something (the web's links): the whole row is the target */
export const Links: Story = { name: 'With links', render: () => <LinksDemo /> };
