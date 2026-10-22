import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cloud, Code, LifeBuoy, Server, Shield, Sparkles } from 'lucide-react';
import { NavigationMenu, type NavigationMenuEntry } from './NavigationMenu.js';

const items: NavigationMenuEntry[] = [
    {
        label: 'Services',
        children: [
            { label: 'Software & Web', href: '#software', description: 'Web applications and portals', icon: Code },
            { label: 'Hosting', href: '#hosting', description: 'Operated in Frankfurt and Nuremberg', icon: Server },
            { label: 'Cloud & DevOps', href: '#cloud', description: 'Kubernetes, CI/CD, Monitoring', icon: Cloud },
            { label: 'AI integration', href: '#ai', description: 'Assistants and automation', icon: Sparkles },
        ],
    },
    {
        label: 'Company',
        children: [
            { label: 'Security', href: '#security', description: 'ISO 27001, data protection', icon: Shield },
            { label: 'Support', href: '#support', description: 'Available around the clock', icon: LifeBuoy },
        ],
    },
    { label: 'References', href: '#references' },
    { label: 'Contact', href: '#contact', current: true },
];

const meta = {
    title: 'Navigation/NavigationMenu',
    component: NavigationMenu,
    args: { items },
    argTypes: { items: { control: false } },
    parameters: { layout: 'padded' },
    render: (args) => (
        <div className="h-96">
            <NavigationMenu {...args} />
        </div>
    ),
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
