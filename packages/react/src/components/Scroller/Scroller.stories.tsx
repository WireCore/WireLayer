import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button.js';
import { Scroller } from './Scroller.js';

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
    render: (args) => (
        <Scroller {...args} className="max-w-md">
            {topics.map((topic) => (
                <Button key={topic} size="sm" variant="outline">
                    {topic}
                </Button>
            ))}
        </Scroller>
    ),
} satisfies Meta<typeof Scroller>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Scrolls sideways: arrows and faded edges while there is more; focused, the arrow keys scroll */
export const Playground: Story = {};
