import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@wirecore/wirelayer-react';
import { ArrowRight, Hexagon } from 'lucide-react';
import { ModeToggle } from '../ModeToggle/ModeToggle.js';
import { SiteHeader } from './SiteHeader.js';

const items = ['Software', 'AI', 'Hosting', 'Cloud', 'Hardware', 'About us'].map((label, index) => ({
    label,
    href: `#${label.toLowerCase()}`,
    current: index === 0,
}));

const meta = {
    title: 'Blocks/SiteHeader',
    component: SiteHeader,
    args: {
        brand: 'WireLayer',
        items,
        navLabel: 'Main navigation',
        menuLabel: 'Menu',
        logo: <Hexagon />,
        actions: (
            <>
                <ModeToggle size="sm" />
                <Button size="sm" trailingIcon={ArrowRight}>
                    Start project
                </Button>
            </>
        ),
    },
    argTypes: { items: { control: false }, logo: { control: false }, actions: { control: false } },
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Mobile: Story = {
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
