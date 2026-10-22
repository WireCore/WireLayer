import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Cloud, Code, LifeBuoy, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { NavigationMenu, type NavigationMenuEntry } from './NavigationMenu.js';

const items: NavigationMenuEntry[] = [
    { label: 'Home', href: '/' },
    {
        label: 'Services',
        href: '/services',
        groups: [
            {
                title: 'Engineering',
                items: [
                    {
                        label: 'Software & Web',
                        href: '/software',
                        icon: Code,
                        description: 'Applications, shops, APIs',
                    },
                    { label: 'Security', href: '/security', icon: ShieldCheck, description: 'Audits and hardening' },
                ],
            },
            {
                title: 'Operations',
                items: [
                    {
                        label: 'Managed Hosting',
                        href: '/hosting',
                        icon: Cloud,
                        description: 'Data centers in Germany',
                    },
                    { label: 'Support', href: '/support', icon: LifeBuoy },
                ],
            },
        ],
    },
    {
        label: 'Company',
        children: [
            { label: 'About us', href: '/about-us' },
            { label: 'Careers', href: '/careers' },
        ],
    },
    { label: 'Contact', href: '/contact' },
];

function Demo() {
    const [current, setCurrent] = useState('/hosting');
    return (
        <View className="w-[320px] flex-row items-center gap-3">
            <NavigationMenu items={items} currentHref={current} onNavigate={(link) => setCurrent(link.href ?? '')} />
            <Text variant="muted">{`Page: ${current}`}</Text>
        </View>
    );
}

const meta = {
    title: 'Navigation/NavigationMenu',
    component: NavigationMenu,
    args: { items },
    render: () => <Demo />,
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
