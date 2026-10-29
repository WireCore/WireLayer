import type { Meta, StoryObj } from '@storybook/react-vite';
import { Code } from './Code.js';

const meta = {
    title: 'Data/Code',
    component: Code,
    args: { code: 'data-theme' },
    render: (args) => (
        <p className="max-w-md text-sm">
            Set the theme with <Code {...args} /> on the <Code>{'<html>'}</Code> element – the look of InlineCode,
            without syntax colours and without shiki.
        </p>
    ),
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
