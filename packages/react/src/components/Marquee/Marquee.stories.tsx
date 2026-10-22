import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge/Badge.js';
import { Marquee } from './Marquee.js';

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
    render: (args) => (
        <Marquee {...args} className="w-[480px]">
            {partners.map((partner) => (
                <Badge key={partner} variant="soft">
                    {partner}
                </Badge>
            ))}
        </Marquee>
    ),
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stops on hover and focus; the button pauses it (WCAG 2.2.2); with reduced motion it does not move */
export const Playground: Story = {};

/** News ticker in the other direction, slower */
export const News: Story = {
    name: 'News',
    render: () => (
        <Marquee label="News" side="end" speed={30} spacing="3rem" className="w-[480px]">
            <span className="text-sm">Maintenance on Saturday 2:00–4:00 AM</span>
            <span className="text-sm">New data center in Nuremberg</span>
        </Marquee>
    ),
};
