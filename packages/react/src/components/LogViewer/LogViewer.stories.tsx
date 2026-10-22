import type { Meta, StoryObj } from '@storybook/react-vite';
import type { LogLine } from '@wirecore/wirelayer-recipes';
import { useEffect, useState } from 'react';
import { LogViewer } from './LogViewer.js';

const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'DEBUG'];
const messages = [
    'Request handled',
    'Cache updated',
    'Response time high',
    'Lost connection to the database',
    'Job started',
];
const line = (index: number) => `${levels[index % levels.length]} ${messages[index % messages.length]} (#${index + 1})`;
const initial = Array.from({ length: 2000 }, (_, index) => line(index));

const meta = {
    title: 'Data/LogViewer',
    component: LogViewer,
    args: {
        lines: initial,
        search: true,
        levelFilter: true,
        lineNumbers: true,
        autoScroll: true,
        className: 'w-[640px]',
    },
    argTypes: { lines: { control: false } },
} satisfies Meta<typeof LogViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 2000 lines – only the visible ones are rendered; search filters and marks, levels with icon and text */
export const Playground: Story = {};

function LiveDemo() {
    const [lines, setLines] = useState<LogLine[]>(() =>
        Array.from({ length: 50 }, (_, index) => ({ id: index, text: line(index), time: new Date() }))
    );
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        let next = 50;
        const timer = setInterval(() => {
            const id = next++;
            setLines((current) => [...current, { id, text: line(id), time: new Date() }]);
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const loadMore = () => {
        setLoading(true);
        setTimeout(() => {
            setLines((current) => {
                const first = Number(current[0]?.id ?? 0);
                const before = Array.from({ length: 20 }, (_, index) => ({
                    id: first - 20 + index,
                    text: `DEBUG Older line ${first - 20 + index}`,
                }));
                return [...before, ...current];
            });
            setLoading(false);
        }, 500);
    };
    return <LogViewer lines={lines} hasMore loading={loading} onLoadMore={loadMore} className="w-[640px]" />;
}

/** New lines arrive; scrolling up pauses following, "Jump to end" resumes; older lines load at the top */
export const Live: Story = { render: () => <LiveDemo /> };
