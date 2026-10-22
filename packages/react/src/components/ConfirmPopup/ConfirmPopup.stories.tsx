import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { ConfirmPopup, type ConfirmPopupProps } from './ConfirmPopup.js';

function Demo(args: Omit<ConfirmPopupProps, 'children'>) {
    const [answer, setAnswer] = useState('');
    return (
        <div className="flex flex-col items-center gap-3">
            <ConfirmPopup {...args} onConfirm={() => setAnswer('deleted')} onCancel={() => setAnswer('canceled')}>
                <Button variant="outline" leadingIcon={Trash2}>
                    Delete
                </Button>
            </ConfirmPopup>
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {answer && `Answer: ${answer}`}
            </p>
        </div>
    );
}

const meta = {
    title: 'Overlays/ConfirmPopup',
    component: ConfirmPopup,
    args: { message: 'Really delete server web-01?', confirmLabel: 'Delete', danger: true, children: <span /> },
    argTypes: { children: { control: false } },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof ConfirmPopup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
