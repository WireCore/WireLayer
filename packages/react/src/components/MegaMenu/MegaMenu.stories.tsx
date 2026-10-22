import type { Meta, StoryObj } from '@storybook/react-vite';
import {
    Building2,
    ChartColumn,
    Cloud,
    Code,
    Cpu,
    Handshake,
    LifeBuoy,
    Newspaper,
    Server,
    Shield,
    Sparkles,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { MegaMenu, type MegaMenuItem } from './MegaMenu.js';

const items: MegaMenuItem[] = [
    {
        label: 'Services',
        columns: [
            {
                groups: [
                    {
                        title: 'Engineering',
                        items: [
                            {
                                label: 'Software & Web',
                                href: '#software',
                                description: 'Portals and business applications',
                                icon: Code,
                            },
                            {
                                label: 'AI integration',
                                href: '#ai',
                                description: 'Assistants and automation',
                                icon: Sparkles,
                                badge: 'New',
                                badgeVariant: 'info',
                            },
                        ],
                        moreHref: '#engineering',
                    },
                ],
            },
            {
                groups: [
                    {
                        title: 'Operations',
                        items: [
                            {
                                label: 'Hosting',
                                href: '#hosting',
                                description: 'Data centers in Frankfurt and Nuremberg',
                                icon: Server,
                            },
                            {
                                label: 'Cloud & DevOps',
                                href: '#cloud',
                                description: 'Kubernetes, CI/CD, Monitoring',
                                icon: Cloud,
                            },
                            {
                                label: 'Security',
                                href: '#security',
                                description: 'ISO 27001, penetration testing',
                                icon: Shield,
                            },
                        ],
                        moreHref: '#operations',
                    },
                ],
            },
        ],
        featured: {
            eyebrow: 'Case study',
            title: 'Customer portal for Northside Utilities',
            description: '200,000 customers, billing and meter readings in one place.',
            href: '#northside',
        },
        allHref: '#services',
        allLabel: 'All services',
    },
    {
        label: 'Products',
        href: '#products',
        columns: [
            {
                groups: [
                    {
                        title: 'Platform',
                        items: [
                            {
                                label: 'WireLayer',
                                href: '#wirecore',
                                description: 'Components for Vue, React and HTML',
                                icon: Cpu,
                            },
                            {
                                label: 'Monitoring',
                                href: '#monitoring',
                                description: 'Load and warnings',
                                icon: ChartColumn,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    {
        label: 'Company',
        columns: [
            {
                groups: [
                    {
                        title: 'About us',
                        items: [
                            { label: 'Team', href: '#team', icon: Users },
                            { label: 'Locations', href: '#locations', icon: Building2 },
                            { label: 'Partner', href: '#partner', icon: Handshake },
                        ],
                    },
                ],
            },
            {
                groups: [
                    {
                        title: 'News',
                        items: [
                            { label: 'Press', href: '#press', icon: Newspaper },
                            {
                                label: 'Support',
                                href: '#support',
                                description: 'Available around the clock',
                                icon: LifeBuoy,
                            },
                        ],
                    },
                ],
            },
        ],
    },
    { label: 'Contact', href: '#contact' },
];

function Demo(args: Parameters<typeof MegaMenu>[0]) {
    const [current, setCurrent] = useState(args.currentHref);
    return (
        <MegaMenu
            {...args}
            currentHref={current}
            onNavigate={(link, event) => {
                event.preventDefault();
                setCurrent(link.href);
            }}
        />
    );
}

const meta = {
    title: 'Navigation/MegaMenu',
    component: MegaMenu,
    args: { items, currentHref: '#hosting' },
    argTypes: {
        items: { control: false },
        openOn: { control: 'inline-radio', options: ['click', 'hover'] },
        orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
        collapse: { control: 'inline-radio', options: ['md', 'lg', 'xl', 'container', 'never'] },
    },
    parameters: { layout: 'padded' },
    render: (args) => (
        <div className="flex min-h-[34rem] flex-col gap-6">
            <Demo {...args} />
            <a href="#content" className="self-start text-sm underline">
                Skip to content
            </a>
        </div>
    ),
} satisfies Meta<typeof MegaMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opens on click; a link with its own chevron button (Products), featured area and "All services" */
export const Playground: Story = {};

/** Opens on hover with the mouse (with delay and safe triangle), on click and touch as before */
export const Hover: Story = { args: { openOn: 'hover' } };

/** Arrow keys switched off: only Tab and Shift+Tab move */
export const WithoutArrowKeys: Story = { args: { arrowKeys: false } };

/** A column of entries; the panels open beside it */
export const Vertical: Story = {
    args: { orientation: 'vertical', collapse: 'never' },
    render: (args) => (
        <div className="min-h-[30rem] w-56">
            <Demo {...args} />
        </div>
    ),
};

/** Own content for the featured area and the links */
export const CustomContent: Story = {
    args: {
        renderFeatured: (item) => (
            <div className="flex flex-col gap-2 text-sm">
                <strong>{item.label} at a glance</strong>
                <span className="text-muted">Book a consultation.</span>
                <a href="#consultation" className="font-semibold underline">
                    Request a consultation
                </a>
            </div>
        ),
        renderItem: (link) => (
            <span className="flex flex-col">
                <span className="text-sm font-semibold">{link.label}</span>
                <span className="text-xs text-muted">{link.href}</span>
            </span>
        ),
    },
};

/** Below 1024px: menu button and drawer with one accordion section per entry */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
