import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { Card } from '../Card/Card.js';
import { Input } from '../Input/Input.js';
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

/**
 * Classes for single values of a variant (`variants`) and for combinations (`compoundVariants`): here only the medium
 * size of buttons and fields is 42px high, rounded medium buttons get a smaller radius. States still show – the invalid
 * field keeps its red border.
 */
export const PerVariant: Story = {
    name: 'Customizing per variant',
    args: {
        recipes: {
            button: {
                variants: { size: { md: { base: 'h-[2.625rem] text-base' } } },
                compoundVariants: [{ size: 'md', shape: 'rounded', classes: { base: 'rounded-md' } }],
            },
            input: { variants: { size: { md: { base: 'h-[2.625rem] border-line-2' } } } },
        },
    },
    render: (args) => (
        <RecipesProvider {...args}>
            <div className="flex max-w-md flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm">Small</Button>
                    <Button>Medium</Button>
                    <Button shape="rounded">Medium, rounded</Button>
                    <Button size="lg">Large</Button>
                </div>
                <Input aria-label="Name" placeholder="Medium field" />
                <Input aria-label="Email" placeholder="Invalid field" invalid />
                <Input aria-label="City" size="sm" placeholder="Small field" />
            </div>
        </RecipesProvider>
    ),
};
