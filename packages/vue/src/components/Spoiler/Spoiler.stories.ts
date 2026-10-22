import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Spoiler from './Spoiler.vue';

const meta = {
    title: 'Layout/Spoiler',
    component: Spoiler,
    args: { maxHeight: 72 },
    render: (args) => ({
        components: { Spoiler },
        setup: () => ({ args }),
        template: `
            <Spoiler v-bind="args" class="max-w-md text-sm leading-relaxed">
                <p>We run your applications in two data centers in Frankfurt and Nuremberg. Backups are stored encrypted at a third site.</p>
                <p class="mt-2">Around-the-clock monitoring, updates in fixed maintenance windows, contacts from the team that knows your application.</p>
                <p class="mt-2">On request with weekend on-call and a dedicated phone number for outages.</p>
            </Spoiler>`,
    }),
} satisfies Meta<typeof Spoiler>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
