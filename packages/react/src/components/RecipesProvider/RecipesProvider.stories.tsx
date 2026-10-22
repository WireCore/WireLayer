import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { Card } from '../Card/Card.js';
import { RecipesProvider } from './RecipesProvider.js';

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
    render: (args) => (
        <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
            <Card>
                <p className="label-mono text-muted">Without provider</p>
                <div className="flex flex-wrap items-center gap-2">
                    <Button leadingIcon={Plus}>Create</Button>
                    <Button variant="secondary">Cancel</Button>
                    <Badge>New</Badge>
                </div>
            </Card>
            <RecipesProvider {...args}>
                <Card>
                    <p className="label-mono text-muted">With provider</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button leadingIcon={Plus} classes={{ icon: 'text-success' }}>
                            Create
                        </Button>
                        <Button variant="secondary">Cancel</Button>
                        <Badge>New</Badge>
                    </div>
                </Card>
            </RecipesProvider>
        </div>
    ),
} satisfies Meta<typeof RecipesProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
