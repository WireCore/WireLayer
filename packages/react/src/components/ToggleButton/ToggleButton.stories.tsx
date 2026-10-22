import type { Meta, StoryObj } from '@storybook/react-vite';
import { Filter } from 'lucide-react';
import { useState } from 'react';
import { ToggleButton, type ToggleButtonProps } from './ToggleButton.js';

function Demo(args: ToggleButtonProps) {
    const [pressed, setPressed] = useState(false);
    return (
        <div className="flex flex-col items-start gap-3">
            <ToggleButton {...args} pressed={pressed} onPressedChange={setPressed} icon={Filter}>
                Active only
            </ToggleButton>
            <span className="text-xs text-muted">Pressed: {pressed ? 'yes' : 'no'}</span>
        </div>
    );
}

const meta = {
    title: 'Buttons/ToggleButton',
    component: ToggleButton,
    args: { size: 'md', disabled: false },
    argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
