import type { Meta, StoryObj } from '@storybook/vue3-vite';
import ModeToggle from './ModeToggle.vue';

const meta = {
    title: 'Blocks/ModeToggle',
    component: ModeToggle,
    args: { variant: 'outline', size: 'md' },
} satisfies Meta<typeof ModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
