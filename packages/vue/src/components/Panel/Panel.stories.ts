import { Pencil } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import Panel from './Panel.vue';

const meta = {
    title: 'Layout/Panel',
    component: Panel,
    args: { title: 'Contract details', toggleable: false, headingLevel: 3 },
    render: (args) => ({
        components: { Button, IconButton, Panel },
        setup: () => ({ args, Pencil }),
        template: `
            <Panel v-bind="args" class="max-w-lg">
                <template #actions><IconButton :icon="Pencil" label="Edit contract details" variant="text" size="sm" /></template>
                24-month term, renewing for 12 months at a time, three months' notice to cancel.
                <template #footer><Button size="sm" variant="outline">Download contract</Button></template>
            </Panel>`,
    }),
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Toggleable: Story = { args: { toggleable: true } };
