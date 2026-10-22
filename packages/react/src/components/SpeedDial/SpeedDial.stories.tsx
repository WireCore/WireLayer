import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilePlus, ServerCog, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { SpeedDial, type SpeedDialProps } from './SpeedDial.js';

const items = [
    { value: 'server', label: 'Create server', icon: ServerCog },
    { value: 'user', label: 'Invite person', icon: UserPlus },
    { value: 'doc', label: 'Create document', icon: FilePlus },
];

function Demo(args: SpeedDialProps) {
    const [chosen, setChosen] = useState('');
    return (
        <div className="flex h-80 flex-col items-end justify-end gap-3">
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {chosen && `Selected: ${chosen}`}
            </p>
            <SpeedDial {...args} onSelect={setChosen} />
        </div>
    );
}

const meta = {
    title: 'Buttons/SpeedDial',
    component: SpeedDial,
    args: { items, label: 'Create new' },
    argTypes: { items: { control: false } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof SpeedDial>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** In a full circle around the button; the labels show as tooltips on hover and focus */
export const Circle: Story = {
    args: { layout: 'circle', direction: 'up' },
    render: (args) => (
        <div className="flex h-80 items-center justify-center">
            <SpeedDial {...args} />
        </div>
    ),
};

/** Half circle above the button */
export const Semicircle: Story = {
    args: { layout: 'semicircle' },
    render: (args) => (
        <div className="flex h-72 items-end justify-center pb-6">
            <SpeedDial {...args} />
        </div>
    ),
};

/** Quarter circle from a button in the bottom-end corner */
export const Quarter: Story = { args: { layout: 'quarter', radius: 96 } };
