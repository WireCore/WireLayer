import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import Button from '../Button/Button.vue';
import Tour, { type TourStep } from './Tour.vue';

const steps: TourStep[] = [
    { id: 'welcome', title: 'Welcome', description: 'Your first server in three steps.' },
    {
        id: 'create',
        title: 'Create server',
        description: 'Create new servers here.',
        target: '#tour-create',
        placement: 'bottom',
    },
    {
        id: 'reports',
        title: 'Reports',
        description: 'Load and costs at a glance.',
        target: '#tour-reports',
        placement: 'bottom',
    },
];

const meta = {
    title: 'Overlays/Tour',
    component: Tour,
    args: { steps },
    argTypes: { steps: { control: false } },
    render: (args) => ({
        components: { Button, Tour },
        setup: () => ({ args, open: ref(false), done: ref(false) }),
        template: `
            <div class="flex flex-col items-center gap-6">
                <div class="flex gap-3">
                    <Button id="tour-create" variant="outline">Create server</Button>
                    <Button id="tour-reports" variant="outline">Reports</Button>
                </div>
                <Button @click="open = true">Start tour</Button>
                <p class="h-4 text-xs text-muted" aria-live="polite">{{ done ? 'Tour completed' : '' }}</p>
                <Tour v-bind="args" v-model:open="open" @complete="done = true" />
            </div>`,
    }),
} satisfies Meta<typeof Tour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
