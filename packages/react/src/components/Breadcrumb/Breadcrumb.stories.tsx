import type { Meta, StoryObj } from '@storybook/react-vite';
import { House } from 'lucide-react';
import { useState } from 'react';
import { Breadcrumb } from './Breadcrumb.js';
import { BreadcrumbItem } from './BreadcrumbItem.js';

const meta = {
    title: 'Navigation/Breadcrumb',
    component: Breadcrumb,
    args: { label: 'Path' },
    render: (args) => (
        <Breadcrumb {...args}>
            <BreadcrumbItem href="#" icon={House} iconOnly>
                Home
            </BreadcrumbItem>
            <BreadcrumbItem href="#">Services</BreadcrumbItem>
            <BreadcrumbItem current>Hosting</BreadcrumbItem>
        </Breadcrumb>
    ),
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const path = [
    { label: 'Home', href: '#', icon: House, iconOnly: true },
    { label: 'Services', href: '#' },
    { label: 'Hosting', href: '#' },
    { label: 'Managed Server', href: '#' },
    { label: 'Pricing', current: true },
];

function CollapsedDemo() {
    const [chosen, setChosen] = useState('');
    return (
        <div className="flex flex-col gap-3">
            <Breadcrumb items={path} maxItems={3} onNavigate={(item) => setChosen(item.label)} />
            <span className="text-xs text-muted" aria-live="polite">
                {chosen && `Selected: ${chosen}`}
            </span>
        </div>
    );
}

/** maxItems: the middle steps collapse into "…" – a menu with the hidden steps */
export const Collapsed: Story = { render: () => <CollapsedDemo /> };
