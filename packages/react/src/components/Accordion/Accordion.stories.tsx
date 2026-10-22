import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cloud, CodeXml, Plus, Server } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton.js';
import { Accordion, AccordionItem } from './Accordion.js';

const meta = {
    title: 'Layout/Accordion',
    component: Accordion,
    args: { multiple: false, collapsible: true, defaultValue: ['software'] },
    render: (args) => (
        <Accordion {...args} className="w-[440px]">
            <AccordionItem value="software" title="Software & Web" icon={CodeXml}>
                Web applications, websites, internal tools, APIs and automation.
            </AccordionItem>
            <AccordionItem value="hosting" title="Managed Hosting" icon={Server}>
                Operations, updates and monitoring in German data centers.
            </AccordionItem>
            <AccordionItem value="cloud" title="Cloud & DevOps" icon={Cloud}>
                Migration, Kubernetes, CI/CD and infrastructure as code.
            </AccordionItem>
            <AccordionItem value="support" title="Support (coming soon)" disabled>
                Around the clock.
            </AccordionItem>
        </Accordion>
    ),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = { args: { multiple: true, defaultValue: ['software', 'hosting'] } };

/** collapsible=false: the open item stays open; own actions beside the heading (not inside its button) */
export const ActionsNotCollapsible: Story = {
    render: () => (
        <Accordion defaultValue={['server']} collapsible={false} className="w-[440px]">
            <AccordionItem
                value="server"
                title="Server"
                icon={Server}
                actions={<IconButton icon={Plus} label="Create server" variant="text" size="sm" />}
            >
                web-01, db-primary, backup-02
            </AccordionItem>
            <AccordionItem
                value="cloud"
                title="Cloud projects"
                icon={Cloud}
                actions={<IconButton icon={Plus} label="Create project" variant="text" size="sm" />}
            >
                customer-portal, intranet
            </AccordionItem>
        </Accordion>
    ),
};
