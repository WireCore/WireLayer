import { Cloud, CodeXml, Plus, Server } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import IconButton from '../IconButton/IconButton.vue';
import Accordion from './Accordion.vue';
import AccordionItem from './AccordionItem.vue';

const meta = {
    title: 'Layout/Accordion',
    component: Accordion,
    args: { multiple: false, collapsible: true, defaultValue: ['software'] },
    render: (args) => ({
        components: { Accordion, AccordionItem },
        setup: () => ({ args, Cloud, CodeXml, Server }),
        template: `
            <Accordion v-bind="args" class="w-[440px]">
                <AccordionItem value="software" title="Software & Web" :icon="CodeXml">
                    Web applications, websites, internal tools, APIs and automation.
                </AccordionItem>
                <AccordionItem value="hosting" title="Managed Hosting" :icon="Server">
                    Operations, updates and monitoring in German data centers.
                </AccordionItem>
                <AccordionItem value="cloud" title="Cloud & DevOps" :icon="Cloud">
                    Migration, Kubernetes, CI/CD and infrastructure as code.
                </AccordionItem>
                <AccordionItem value="support" title="Support (coming soon)" disabled>
                    Around the clock.
                </AccordionItem>
            </Accordion>`,
    }),
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Multiple: Story = { args: { multiple: true, defaultValue: ['software', 'hosting'] } };

/** collapsible=false: the open item stays open; own actions beside the heading (not inside its button) */
export const ActionsNotCollapsible: Story = {
    render: () => ({
        components: { Accordion, AccordionItem, IconButton },
        setup: () => ({ Plus, Server, Cloud }),
        template: `
            <Accordion :default-value="['server']" :collapsible="false" class="w-[440px]">
                <AccordionItem value="server" title="Server" :icon="Server">
                    <template #actions><IconButton :icon="Plus" label="Create server" variant="text" size="sm" /></template>
                    web-01, db-primary, backup-02
                </AccordionItem>
                <AccordionItem value="cloud" title="Cloud projects" :icon="Cloud">
                    <template #actions><IconButton :icon="Plus" label="Create project" variant="text" size="sm" /></template>
                    customer-portal, intranet
                </AccordionItem>
            </Accordion>`,
    }),
};
