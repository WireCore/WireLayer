import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { House } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Breadcrumb, type BreadcrumbEntry } from './Breadcrumb.js';

const items: BreadcrumbEntry[] = [
    { label: 'Home', href: '/', icon: House, iconOnly: true },
    { label: 'Customers', href: '/customers' },
    { label: 'Northside Utilities', href: '/customers/northside' },
    { label: 'Projects', href: '/customers/northside/projects' },
    { label: 'Customer portal relaunch' },
];

function Demo({ maxItems }: { maxItems?: number }) {
    const [href, setHref] = useState('–');
    return (
        <View className="w-[320px] gap-3">
            <Breadcrumb items={items} maxItems={maxItems} onNavigate={(item) => setHref(item.href ?? '')} />
            <Text variant="muted">{`Target: ${href}`}</Text>
        </View>
    );
}

const meta = {
    title: 'Navigation/Breadcrumb',
    component: Breadcrumb,
    args: { items },
    render: () => <Demo />,
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The middle levels collapse into a "…" menu */
export const Collapsed: Story = { name: 'Collapsed', render: () => <Demo maxItems={3} /> };
