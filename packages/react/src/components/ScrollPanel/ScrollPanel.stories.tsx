import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ScrollPanel } from './ScrollPanel.js';

const paragraphs = Array.from({ length: 12 }, (_, index) => index + 1);

const meta = {
    title: 'Layout/ScrollPanel',
    component: ScrollPanel,
    args: {
        label: 'Terms of use',
        className: 'h-56 w-80 border border-line',
        children: (
            <div className="flex flex-col gap-3 p-4 text-sm">
                {paragraphs.map((n) => (
                    <p key={n}>§ {n} The provider delivers the services under this agreement.</p>
                ))}
            </div>
        ),
    },
    argTypes: { children: { control: false } },
} satisfies Meta<typeof ScrollPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function OptionsDemo() {
    const [reached, setReached] = useState('');
    const lines = Array.from({ length: 30 }, (_, index) => `Log line ${index + 1}`);
    return (
        <div className="flex flex-col gap-2">
            <ScrollPanel
                label="Log"
                scrollbars="hover"
                fade
                className="h-48 w-72 border border-line"
                onReachEnd={() => setReached('End reached')}
                onReachStart={() => setReached('Start reached')}
            >
                {lines.map((line) => (
                    <p key={line} className="px-3 py-1 font-mono text-xs">
                        {line}
                    </p>
                ))}
            </ScrollPanel>
            <span className="text-xs text-muted" aria-live="polite">
                {reached}
            </span>
        </div>
    );
}

/** Scrollbars only on hover, faded edges and an event at the end (e.g. to load more) */
export const Options: Story = { render: () => <OptionsDemo /> };
