import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Card from '../Card/Card.vue';
import SimpleGrid from './SimpleGrid.vue';

const cards = ['Hosting', 'Cloud', 'Software', 'AI', 'Security', 'Support'];

const meta = {
    title: 'Layout/SimpleGrid',
    component: SimpleGrid,
    args: { columns: { base: 1, sm: 2, lg: 3 }, gap: 'md' },
    argTypes: { gap: { control: 'inline-radio', options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'] } },
    render: (args) => ({
        components: { Card, SimpleGrid },
        setup: () => ({ args, cards }),
        template: `<SimpleGrid v-bind="args"><Card v-for="card in cards" :key="card">{{ card }}</Card></SimpleGrid>`,
    }),
} satisfies Meta<typeof SimpleGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 1 column, from sm 2, from lg 3 */
export const Playground: Story = {};

/** As many columns as fit, each at least 12rem wide */
export const AutoFit: Story = { args: { minColumnWidth: '12rem' } };
