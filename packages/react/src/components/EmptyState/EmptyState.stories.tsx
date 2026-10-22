import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, SearchX } from 'lucide-react';
import { Button } from '../Button/Button.js';
import { EmptyState } from './EmptyState.js';

const meta = {
    title: 'Feedback/EmptyState',
    component: EmptyState,
    args: {
        title: 'No servers yet',
        description: 'Create your first server – it will be ready in two minutes.',
        variant: 'dashed',
        size: 'md',
    },
    argTypes: {
        variant: { control: 'inline-radio', options: ['plain', 'dashed'] },
        size: { control: 'inline-radio', options: ['sm', 'md'] },
    },
    render: (args) => (
        <EmptyState
            {...args}
            icon={SearchX}
            className="w-[28rem]"
            actions={
                <>
                    <Button leadingIcon={Plus}>Create server</Button>
                    <Button variant="outline">Guide</Button>
                </>
            }
        />
    ),
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Small, without frame – e.g. inside a card or below a search */
export const Small: Story = {
    args: {
        title: 'No results',
        description: 'Try a different search term.',
        variant: 'plain',
        size: 'sm',
    },
    render: (args) => <EmptyState {...args} icon={SearchX} className="w-80" />,
};
