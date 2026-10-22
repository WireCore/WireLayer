import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { CreditCard, LifeBuoy, Pencil, Server } from 'lucide-react-native';
import { IconButton } from '../IconButton/IconButton.js';
import { Accordion, AccordionItem } from './Accordion.js';

const meta = {
    title: 'Layout/Accordion',
    component: Accordion,
    args: { defaultValue: ['hosting'], multiple: false },
    render: (args) => (
        <Accordion {...args} className="w-80">
            <AccordionItem value="hosting" title="What does managed hosting include?">
                Operations, updates, backups and monitoring around the clock – in German data centers.
            </AccordionItem>
            <AccordionItem value="support" title="How do I reach support?">
                By phone and ticket, weekdays from 8 AM to 6 PM, any time for outages.
            </AccordionItem>
            <AccordionItem value="contract" title="How long do contracts run?">
                Twelve months, then cancelable monthly.
            </AccordionItem>
        </Accordion>
    ),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Multiple: Story = { args: { multiple: true, defaultValue: ['hosting', 'support'] } };

/** Icons, own actions beside the heading and an item that stays open (collapsible false) */
export const IconsAndActions: Story = {
    render: () => (
        <Accordion defaultValue={['hosting']} collapsible={false} className="w-80">
            <AccordionItem
                value="hosting"
                title="Managed Hosting"
                icon={Server}
                actions={<IconButton icon={Pencil} label="Edit hosting" variant="text" size="sm" />}
            >
                Operations, updates, backups and monitoring.
            </AccordionItem>
            <AccordionItem value="support" title="Support" icon={LifeBuoy}>
                By phone and ticket.
            </AccordionItem>
            <AccordionItem value="billing" title="Billing" icon={CreditCard} disabled>
                Monthly by invoice.
            </AccordionItem>
        </Accordion>
    ),
};
