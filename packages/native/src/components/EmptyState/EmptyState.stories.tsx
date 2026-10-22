import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Inbox, SearchX } from 'lucide-react-native';
import { View } from 'react-native';
import { Button } from '../Button/Button.js';
import { EmptyState } from './EmptyState.js';

const meta = {
    title: 'Feedback/EmptyState',
    component: EmptyState,
    args: {
        title: 'No projects yet',
        description: 'Create your first project – it will then appear here.',
        icon: Inbox,
        headingLevel: 2,
        actions: <Button size="sm">Create project</Button>,
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Search: Story = {
    name: 'Search without results',
    args: {
        icon: SearchX,
        title: 'No results for “Invoice 2019”',
        description: 'Check the spelling or try a broader search.',
        variant: 'dashed',
        size: 'sm',
        actions: (
            <Button size="sm" variant="outline">
                Reset filters
            </Button>
        ),
    },
};
