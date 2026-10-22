import type { Meta, StoryObj } from '@storybook/react-vite';
import type { DataSource } from '@wirecore/wirelayer-recipes';
import { useRef } from 'react';
import { VirtualList, type VirtualListHandle } from './VirtualList.js';

const entries = Array.from({ length: 10_000 }, (_, index) => ({
    id: index + 1,
    message: `Request ${index + 1} handled`,
    time: `${String(Math.floor(index / 60) % 24).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
}));

function Demo(args: { label: string; height?: string; itemHeight?: number }) {
    return (
        <VirtualList {...args} items={entries} className="w-96">
            {(item) => (
                <div className="flex h-10 items-center gap-3 border-b border-line px-3 text-sm">
                    <span className="font-mono text-xs text-muted">{item.time}</span>
                    {item.message}
                </div>
            )}
        </VirtualList>
    );
}

const meta = {
    title: 'Data/VirtualList',
    component: Demo,
    args: { label: 'Log', height: '20rem', itemHeight: 40 },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const logSource: DataSource<(typeof entries)[number]> = {
    async getItems({ page = 1, pageSize = 50 }) {
        await new Promise((done) => setTimeout(done, 500));
        return { items: entries.slice((page - 1) * pageSize, page * pageSize), totalCount: 1000 };
    },
};
const row = (item: (typeof entries)[number]) => (
    <div className="flex h-10 items-center gap-3 border-b border-line px-3 text-sm">
        <span className="font-mono text-xs text-muted">{item.time}</span>
        {item.message}
    </div>
);

/** A data source fills the list while scrolling (pages of 50); a loading row at the end, announced */
export const Infinite: Story = {
    name: 'Infinite loading',
    render: () => (
        <VirtualList label="Log" dataSource={logSource} className="w-96">
            {row}
        </VirtualList>
    ),
};

const messages = entries.slice(0, 600).map((entry) => ({
    ...entry,
    hour: `${entry.time.slice(0, 2)}:00`,
    detail: entry.id % 4 === 0 ? 'Reply with attachment, forwarded to the department, follow-up question' : '',
}));

/** Group headings that stick to the top, rows of different heights */
export const Groups: Story = {
    name: 'Groups and variable heights',
    render: () => (
        <VirtualList
            label="Log"
            items={messages}
            itemGroup="hour"
            estimateSize={(item) => (item.detail ? 64 : 40)}
            className="w-96"
        >
            {(item) => (
                <div className="flex flex-col justify-center gap-0.5 border-b border-line px-3 py-2 text-sm">
                    <span>
                        <span className="font-mono text-xs text-muted">{item.time}</span> {item.message}
                    </span>
                    {item.detail && <span className="text-xs text-muted">{item.detail}</span>}
                </div>
            )}
        </VirtualList>
    ),
};

function ScrollDemo() {
    const list = useRef<VirtualListHandle>(null);
    return (
        <div className="flex w-96 flex-col gap-3">
            <button
                type="button"
                className="self-start text-sm text-primary underline"
                onClick={() => list.current?.scrollToIndex(4999, { align: 'start' })}
            >
                Jump to request 5000
            </button>
            <VirtualList ref={list} label="Log" items={entries}>
                {row}
            </VirtualList>
        </div>
    );
}

/** scrollToIndex (ref): jump to an entry */
export const ScrollTo: Story = { name: 'Jump to entry', render: () => <ScrollDemo /> };
