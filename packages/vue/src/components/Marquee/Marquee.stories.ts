import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Badge from '../Badge/Badge.vue';
import Marquee from './Marquee.vue';

const partners = [
    'Northbank',
    'City Utilities',
    'Logistics Corp.',
    'City Hospital',
    'Trade Fair Inc.',
    'Publishing House',
];

const meta = {
    title: 'Data/Marquee',
    component: Marquee,
    args: { label: 'Partners', speed: 50, side: 'start', fade: true, pauseButton: true, pauseOnHover: true },
    argTypes: { side: { control: 'inline-radio', options: ['start', 'end'] } },
    render: (args) => ({
        components: { Badge, Marquee },
        setup: () => ({ args, partners }),
        template: `
            <Marquee v-bind="args" class="w-[480px]">
                <Badge v-for="partner in partners" :key="partner" variant="soft">{{ partner }}</Badge>
            </Marquee>`,
    }),
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stops on hover and focus; the button pauses it (WCAG 2.2.2); with reduced motion it does not move */
export const Playground: Story = {};

/** News ticker in the other direction, slower */
export const News: Story = {
    name: 'News',
    render: () => ({
        components: { Marquee },
        template: `
            <Marquee label="News" side="end" :speed="30" spacing="3rem" class="w-[480px]">
                <span class="text-sm">Maintenance on Saturday 2:00–4:00 AM</span>
                <span class="text-sm">New data center in Nuremberg</span>
            </Marquee>`,
    }),
};
