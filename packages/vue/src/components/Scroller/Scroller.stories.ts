import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import Scroller from './Scroller.vue';

const topics = [
    'Hosting',
    'Cloud & DevOps',
    'Software & Web',
    'AI integration',
    'Security',
    'Databases',
    'Monitoring',
    'Backups',
    'Networks',
    'Support',
    'Training',
    'Consulting',
];

const meta = {
    title: 'Layout/Scroller',
    component: Scroller,
    args: { label: 'Topics' },
    render: (args) => ({
        components: { Button, Scroller },
        setup: () => ({ args, topics }),
        template: `
            <Scroller v-bind="args" class="max-w-md">
                <Button v-for="topic in topics" :key="topic" size="sm" variant="outline">{{ topic }}</Button>
            </Scroller>`,
    }),
} satisfies Meta<typeof Scroller>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Scrolls sideways: arrows and faded edges while there is more; focused, the arrow keys scroll */
export const Playground: Story = {};
