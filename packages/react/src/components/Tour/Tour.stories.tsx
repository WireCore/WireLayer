import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { Tour, type TourStep } from './Tour.js';

const steps: TourStep[] = [
    { id: 'welcome', title: 'Welcome', description: 'Your first server in three steps.' },
    {
        id: 'create',
        title: 'Create server',
        description: 'Create new servers here.',
        target: '#tour-create',
        placement: 'bottom',
    },
    {
        id: 'reports',
        title: 'Reports',
        description: 'Load and costs at a glance.',
        target: '#tour-reports',
        placement: 'bottom',
    },
];

function Demo({ steps }: { steps: readonly TourStep[] }) {
    const [open, setOpen] = useState(false);
    const [done, setDone] = useState(false);
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex gap-3">
                <Button id="tour-create" variant="outline">
                    Create server
                </Button>
                <Button id="tour-reports" variant="outline">
                    Reports
                </Button>
            </div>
            <Button onClick={() => setOpen(true)}>Start tour</Button>
            <p className="h-4 text-xs text-muted" aria-live="polite">
                {done ? 'Tour completed' : ''}
            </p>
            <Tour steps={steps} open={open} onOpenChange={setOpen} onComplete={() => setDone(true)} />
        </div>
    );
}

const meta = {
    title: 'Overlays/Tour',
    component: Tour,
    args: { steps },
    argTypes: { steps: { control: false } },
    render: (args) => <Demo steps={args.steps} />,
} satisfies Meta<typeof Tour>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
