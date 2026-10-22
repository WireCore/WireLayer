import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageCircle } from 'lucide-react';
import { Button } from '../Button/Button.js';
import { Affix } from './Affix.js';

const meta = {
    title: 'Layout/Affix',
    component: Affix,
    args: { position: 'bottom-end' },
    argTypes: {
        position: { control: 'inline-radio', options: ['bottom-end', 'bottom-start', 'top-end', 'top-start'] },
    },
    parameters: { layout: 'fullscreen' },
    render: (args) => (
        <div className="min-h-64 p-6">
            <p className="text-sm text-muted">The button stays in the corner of the window.</p>
            <Affix {...args}>
                <Button leadingIcon={MessageCircle}>Help</Button>
            </Affix>
        </div>
    ),
} satisfies Meta<typeof Affix>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fixed in a corner of the window */
export const Playground: Story = {};
