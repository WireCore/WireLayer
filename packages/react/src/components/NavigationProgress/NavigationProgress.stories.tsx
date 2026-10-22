import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { NavigationProgress } from './NavigationProgress.js';
import { navigationProgress } from './progress.js';

const meta = {
    title: 'Feedback/NavigationProgress',
    component: NavigationProgress,
    render: () => (
        <div className="flex gap-3">
            <NavigationProgress />
            <Button variant="outline" onClick={navigationProgress.start}>
                Start loading
            </Button>
            <Button variant="outline" onClick={navigationProgress.done}>
                Done
            </Button>
        </div>
    ),
} satisfies Meta<typeof NavigationProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
