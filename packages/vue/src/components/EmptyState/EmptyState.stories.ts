import { Plus, SearchX } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Button from '../Button/Button.vue';
import EmptyState from './EmptyState.vue';

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
    render: (args) => ({
        components: { Button, EmptyState },
        setup: () => ({ args, Plus, SearchX }),
        template: `
            <EmptyState v-bind="args" :icon="SearchX" class="w-[28rem]">
                <template #actions>
                    <Button :leading-icon="Plus">Create server</Button>
                    <Button variant="outline">Guide</Button>
                </template>
            </EmptyState>`,
    }),
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
    render: (args) => ({
        components: { EmptyState },
        setup: () => ({ args, SearchX }),
        template: `<EmptyState v-bind="args" :icon="SearchX" class="w-80" />`,
    }),
};
