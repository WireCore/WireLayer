import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Compare, type CompareProps } from './Compare.js';

// Pictures as inline SVG, so Storybook and the tests need no network
const picture = (title: string, from: string, to: string) =>
    `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><text x="800" y="480" text-anchor="middle" font-family="sans-serif" font-size="96" fill="#fff">${title}</text></svg>`
    )}`;

const before = { src: picture('Old design', '#6b7280', '#374151'), alt: 'Home page before the relaunch' };
const after = { src: picture('New design', '#1e66f5', '#7c3aed'), alt: 'Home page after the relaunch' };

function Demo(args: CompareProps) {
    const [value, setValue] = useState(40);
    return (
        <div className="flex max-w-2xl flex-col gap-2">
            <Compare {...args} value={value} onValueChange={setValue} />
            <span className="text-xs text-muted">Before: {value}%</span>
        </div>
    );
}

const meta = {
    title: 'Media/Compare',
    component: Compare,
    args: { before, after, defaultValue: 50 },
    parameters: { layout: 'padded' },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Compare>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
