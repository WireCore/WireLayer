import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModeToggle } from './ModeToggle.js';

const meta = {
    title: 'Blocks/ModeToggle',
    component: ModeToggle,
    args: { variant: 'outline', size: 'md' },
} satisfies Meta<typeof ModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
