import { ArrowRight, Hexagon } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { Button } from '@wirecore/wirelayer-vue';
import ModeToggle from '../ModeToggle/ModeToggle.vue';
import SiteHeader from './SiteHeader.vue';

const items = ['Software', 'AI', 'Hosting', 'Cloud', 'Hardware', 'About us'].map((label, index) => ({
    label,
    href: `#${label.toLowerCase()}`,
    current: index === 0,
}));

const meta = {
    title: 'Blocks/SiteHeader',
    component: SiteHeader,
    args: { brand: 'WireLayer', items, navLabel: 'Main navigation', menuLabel: 'Menu' },
    argTypes: { items: { control: false } },
    parameters: { layout: 'fullscreen' },
    render: (args) => ({
        components: { Button, Hexagon, ModeToggle, SiteHeader },
        setup: () => ({ args, ArrowRight }),
        template: `
            <SiteHeader v-bind="args">
                <template #logo><Hexagon /></template>
                <template #actions>
                    <ModeToggle size="sm" />
                    <Button size="sm" :trailing-icon="ArrowRight">Start project</Button>
                </template>
            </SiteHeader>`,
    }),
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Mobile: Story = {
    globals: { viewport: { value: 'mobile1', isRotated: false } },
};
