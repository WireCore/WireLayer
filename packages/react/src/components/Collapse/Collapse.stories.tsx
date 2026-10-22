import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from 'react';
import { Button } from '../Button/Button.js';
import { Collapse } from './Collapse.js';

function Demo({ orientation }: { orientation?: 'vertical' | 'horizontal' }) {
    const [open, setOpen] = useState(false);
    const id = useId();
    return (
        <div className={orientation === 'horizontal' ? 'flex items-start gap-3' : 'flex max-w-md flex-col gap-3'}>
            <Button variant="outline" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
                {orientation === 'horizontal' ? 'Filter' : 'Details'}
            </Button>
            <Collapse id={id} open={open} orientation={orientation}>
                <div className="w-64 rounded-lg border border-line p-4 text-sm text-muted">
                    24-month term, renewing for 12 months at a time, three months' notice to cancel.
                </div>
            </Collapse>
        </div>
    );
}

const meta = {
    title: 'Layout/Collapse',
    component: Collapse,
    render: () => <Demo />,
} satisfies Meta<typeof Collapse>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Animated height (motion-safe); the button carries aria-expanded and aria-controls */
export const Playground: Story = {};

/** Animated width */
export const Horizontal: Story = { render: () => <Demo orientation="horizontal" /> };
