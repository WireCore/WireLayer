import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import NavigationProgress from './NavigationProgress.vue';
import { navigationProgress } from './progress.js';

const meta = {
    title: 'Feedback/NavigationProgress',
    component: NavigationProgress,
    render: () => ({
        components: { Button, NavigationProgress },
        setup: () => ({ start: navigationProgress.start, done: navigationProgress.done }),
        template: `
            <div class="flex gap-3">
                <NavigationProgress />
                <Button variant="outline" @click="start">Start loading</Button>
                <Button variant="outline" @click="done">Done</Button>
            </div>`,
    }),
} satisfies Meta<typeof NavigationProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
