import { Plus } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Badge from '../Badge/Badge.vue';
import Button from '../Button/Button.vue';
import Card from '../Card/Card.vue';
import RecipesProvider from './RecipesProvider.vue';

const meta = {
    title: 'Layout/RecipesProvider',
    component: RecipesProvider,
    args: {
        recipes: {
            button: { defaultVariants: { size: 'sm', variant: 'outline' }, classes: { base: 'rounded-md' } },
            badge: { defaultVariants: { variant: 'outline' } },
            card: { classes: { base: 'rounded-md border-dashed' } },
        },
    },
    render: (args) => ({
        components: { Badge, Button, Card, RecipesProvider },
        setup: () => ({ args, Plus }),
        template: `
            <div class="grid max-w-3xl gap-6 sm:grid-cols-2">
                <Card>
                    <p class="label-mono text-muted">Without provider</p>
                    <div class="flex flex-wrap items-center gap-2">
                        <Button :leading-icon="Plus">Create</Button>
                        <Button variant="secondary">Cancel</Button>
                        <Badge>New</Badge>
                    </div>
                </Card>
                <RecipesProvider v-bind="args">
                    <Card>
                        <p class="label-mono text-muted">With provider</p>
                        <div class="flex flex-wrap items-center gap-2">
                            <Button :leading-icon="Plus" :classes="{ icon: 'text-success' }">Create</Button>
                            <Button variant="secondary">Cancel</Button>
                            <Badge>New</Badge>
                        </div>
                    </Card>
                </RecipesProvider>
            </div>`,
    }),
} satisfies Meta<typeof RecipesProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
