import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../Card/Card.js';
import { SimpleGrid } from './SimpleGrid.js';

const cards = ['Hosting', 'Cloud', 'Software', 'AI', 'Security', 'Support'];

const meta = {
    title: 'Layout/SimpleGrid',
    component: SimpleGrid,
    args: { columns: { base: 1, sm: 2, lg: 3 }, gap: 'md' },
    argTypes: { gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] } },
    render: (args) => (
        <SimpleGrid {...args}>
            {cards.map((card) => (
                <Card key={card}>{card}</Card>
            ))}
        </SimpleGrid>
    ),
} satisfies Meta<typeof SimpleGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 1 column, from sm 2, from lg 3 */
export const Playground: Story = {};

/** As many columns as fit, each at least 12rem wide */
export const AutoFit: Story = { args: { minColumnWidth: '12rem' } };
