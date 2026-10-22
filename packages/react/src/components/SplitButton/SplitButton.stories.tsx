import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, Save, Send } from 'lucide-react';
import { useState } from 'react';
import { SplitButton, type SplitButtonProps } from './SplitButton.js';

const items = [
    { value: 'save-draft', label: 'Save as draft', icon: Save },
    { value: 'save-copy', label: 'Save as copy', icon: Copy },
];

function Demo(args: SplitButtonProps) {
    const [action, setAction] = useState('');
    return (
        <div className="flex flex-col items-start gap-3">
            <SplitButton {...args} onClick={() => setAction('send')} onSelect={setAction} />
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {action && `Action: ${action}`}
            </p>
        </div>
    );
}

const meta = {
    title: 'Buttons/SplitButton',
    component: SplitButton,
    args: { label: 'Send', icon: Send, items, variant: 'primary', size: 'md', disabled: false },
    argTypes: {
        items: { control: false },
        icon: { control: false },
        variant: { control: 'inline-radio', options: ['primary', 'secondary', 'outline', 'soft', 'danger'] },
        color: {
            control: 'select',
            options: [undefined, 'primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
        },
        size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
        shape: { control: 'inline-radio', options: ['pill', 'rounded', 'square'] },
    },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof SplitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Outline: Story = { args: { variant: 'outline' } };

/** Color and shape like Button: here a danger outline with rounded corners */
export const ColorAndShape: Story = {
    args: { variant: 'outline', color: 'danger', shape: 'rounded', label: 'Delete' },
};
