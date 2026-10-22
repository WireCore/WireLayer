import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleAlert, CircleCheck, GitCommitHorizontal, Rocket } from 'lucide-react';
import { useState } from 'react';
import { Timeline, type TimelineItem } from './Timeline.js';

const items: TimelineItem[] = [
    {
        time: 'Oct 20, 2026, 9:12 AM',
        datetime: '2026-10-20T09:12',
        title: 'Change submitted',
        description: 'Merge request !412 by Julia Klein',
        icon: GitCommitHorizontal,
    },
    {
        time: 'Oct 20, 2026, 9:40 AM',
        datetime: '2026-10-20T09:40',
        title: 'Tests failed',
        description: '2 of 1,504 checks failing',
        icon: CircleAlert,
        status: 'danger',
    },
    {
        time: 'Oct 20, 2026, 10:05 AM',
        datetime: '2026-10-20T10:05',
        title: 'Tests passed',
        icon: CircleCheck,
        status: 'success',
    },
    {
        time: 'Oct 20, 2026, 10:30 AM',
        datetime: '2026-10-20T10:30',
        title: 'Rolled out',
        description: 'Production, Frankfurt',
        icon: Rocket,
        status: 'info',
    },
];

const meta = {
    title: 'Data/Timeline',
    component: Timeline,
    args: { items, label: 'History', className: 'max-w-md' },
    argTypes: {
        items: { control: false },
        align: { control: 'inline-radio', options: ['start', 'end', 'alternate'] },
        orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

const steps: TimelineItem[] = [
    { time: 'Q1 2026', title: 'Planning', opposite: 'Completed' },
    { time: 'Q2 2026', title: 'Implementation', opposite: 'In progress' },
    { time: 'Q3 2026', title: 'Pilot', opposite: 'Planned' },
    { time: 'Q4 2026', title: 'Rollout', opposite: 'Planned' },
];

/** Marker in the middle, the content alternates sides; `opposite` fills the other side */
export const Alternate: Story = {
    args: { align: 'alternate', items: steps, activeIndex: 1, className: 'max-w-2xl' },
};

export const AlignEnd: Story = { args: { align: 'end' } };

/** Events side by side; the active event is marked (aria-current="step") */
export const Horizontal: Story = {
    args: { orientation: 'horizontal', items: steps, activeIndex: 1, className: 'max-w-3xl' },
};

/** Own content per event via renderContent, renderOpposite and renderMarker */
export const OwnContent: Story = {
    render: () => (
        <Timeline
            items={steps}
            label="Project plan"
            className="max-w-md"
            renderMarker={(_, index) => <span className="text-xs font-semibold">{index + 1}</span>}
            renderOpposite={(item) => <span className="font-mono text-xs">{item.time}</span>}
            renderContent={(item) => (
                <>
                    <span className="text-sm font-semibold">{item.title}</span>
                    <span className="text-xs text-muted">Status: {item.opposite}</span>
                </>
            )}
        />
    ),
};

// Activity of a ticket: newest first, older entries load at the end
const activity = (from: number, count: number): TimelineItem[] =>
    Array.from({ length: count }, (_, index) => ({
        time: `Oct ${21 - Math.floor((from + index) / 4)}, 2026, ${['5:00 PM', '3:00 PM', '1:00 PM', '11:00 AM'][(from + index) % 4]}`,
        title: ['Comment', 'Status changed', 'File attached', 'Assigned'][(from + index) % 4]!,
        description: `Entry ${from + index + 1}`,
    }));

function FeedDemo() {
    const [items, setItems] = useState(() => activity(0, 6));
    const [loading, setLoading] = useState(false);
    const loadMore = async () => {
        setLoading(true);
        await new Promise((done) => setTimeout(done, 600));
        setItems((old) => [...old, ...activity(old.length, 6)]);
        setLoading(false);
    };
    return (
        <div className="max-h-96 w-96 overflow-y-auto p-2">
            <Timeline
                items={items}
                label="Activity"
                feed
                hasMore={items.length < 24}
                loading={loading}
                setSize={24}
                autoLoad
                onLoadMore={() => void loadMore()}
            />
        </div>
    );
}

/**
 * A feed (role="feed"): each entry is an article, Page Up/Down move between them; "Load older entries" (and
 * scrolling to the end) loads more – aria-busy while loading
 */
export const Feed: Story = { name: 'Feed with loading more', render: () => <FeedDemo /> };
