import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { DataSource, LogLine } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { LogViewer } from './LogViewer.js';

const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'DEBUG'];
const messages = [
    'Request handled',
    'Cache updated',
    'Response time high: /api/invoices?year=2026&month=10&status=open took 2.4 s',
    'Lost connection to the database',
    'Job started',
];
const line = (index: number) => `${levels[index % levels.length]} ${messages[index % messages.length]} (#${index + 1})`;
const initial = Array.from({ length: 300 }, (_, index) => line(index));

const meta = {
    title: 'Data/LogViewer',
    component: LogViewer,
    args: { lines: initial, search: true, levelFilter: true, lineNumbers: true, autoScroll: true },
    argTypes: { lines: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof LogViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 300 lines that wrap; search filters and marks, level chips, the newest line in view */
export const Playground: Story = {};

function LiveDemo() {
    const [lines, setLines] = useState<LogLine[]>(() =>
        Array.from({ length: 40 }, (_, index) => ({ id: index, text: line(index), time: new Date(2026, 9, 21, 9) }))
    );
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        let next = 40;
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
        }, 600);
    };
    return <LogViewer lines={lines} hasMore loading={loading} onLoadMore={loadMore} />;
}

/** A new line every second: it stays in view until you scroll up (paused) – "Jump to end" follows again */
export const Live: Story = { name: 'Live', render: () => <LiveDemo /> };

// Stands in for a server: pages of 50 older lines, newest first, three pages in all
const olderSource: DataSource<LogLine | string> = {
    getItems: ({ page = 1, pageSize = 50, signal }) =>
        new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                const end = 150 - (page - 1) * pageSize;
                const items = Array.from({ length: Math.max(0, Math.min(pageSize, end)) }, (_, index) => ({
                    id: `server-${end - index}`,
                    text: `INFO Archive line ${end - index}`,
                }));
                resolve({ items, totalCount: 150 });
            }, 600);
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(signal.reason);
            });
        }),
};

/** Older lines from a server, 50 per page – "Load older entries" loads the next */
export const FromServer: Story = {
    name: 'Loading more from the server',
    args: { lines: ['INFO Live: service running'], dataSource: olderSource, pageSize: 50 },
};

/** No lines */
export const Empty: Story = { name: 'Empty', args: { lines: [] } };
