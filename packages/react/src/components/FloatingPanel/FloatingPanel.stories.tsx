import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../Button/Button.js';
import { FloatingPanel } from './FloatingPanel.js';

const meta = {
    title: 'Overlays/FloatingPanel',
    component: FloatingPanel,
    args: { title: 'Notes', resizable: true, draggable: true },
    render: (args) => (
        <FloatingPanel {...args} trigger={<Button variant="outline">Open notes</Button>}>
            <p>A window that stays open next to the page. Drag the header to move it, or the edges to resize it.</p>
            <p className="mt-2 text-muted">
                Keyboard: Alt + arrow keys move, Alt + Shift + arrow keys resize, Escape closes.
            </p>
        </FloatingPanel>
    ),
} satisfies Meta<typeof FloatingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Not modal: the page stays usable; minimize, maximize and close in the header */
export const Playground: Story = {};

function Remembered() {
    const [open, setOpen] = useState(true);
    return (
        <div className="flex flex-col items-start gap-2">
            <Button variant="outline" onClick={() => setOpen(!open)}>
                {open ? 'Close' : 'Open'}
            </Button>
            <FloatingPanel
                open={open}
                onOpenChange={setOpen}
                title="Tools"
                storageKey="wirecore-story-panel"
                defaultPosition={{ x: 40, y: 120 }}
                defaultSize={{ width: 320, height: 220 }}
            >
                <p>Move it, reload – the window opens again in the same place.</p>
            </FloatingPanel>
        </div>
    );
}

/** Position and size are kept in localStorage (storageKey) */
export const RememberPosition: Story = { render: () => <Remembered /> };
