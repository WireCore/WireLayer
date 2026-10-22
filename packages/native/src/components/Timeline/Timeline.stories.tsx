import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { CircleCheck, GitPullRequest, Rocket } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Timeline, type TimelineItem } from './Timeline.js';

const items: TimelineItem[] = [
    {
        time: '09:12',
        title: 'Change submitted',
        description: 'Pull request #482 by Lea',
        icon: GitPullRequest,
        opposite: 'Mon',
    },
    {
        time: '10:40',
        title: 'Reviewed',
        description: 'Two approvals',
        icon: CircleCheck,
        status: 'success',
        opposite: 'Mon',
    },
    {
        time: '14:05',
        title: 'Rolled out',
        description: 'customer-portal · v2.4.1',
        icon: Rocket,
        status: 'info',
        opposite: 'Tue',
    },
];

const meta = {
    title: 'Data/Timeline',
    component: Timeline,
    args: { items, label: 'Deployment history', activeIndex: 2 },
    argTypes: { align: { control: 'inline-radio', options: ['start', 'end', 'alternate'] } },
    decorators: [(Story) => <View className="w-[340px]">{Story()}</View>],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Alternate: Story = { name: 'Alternating', args: { align: 'alternate' } };

const older: TimelineItem[] = Array.from({ length: 6 }, (_, index) => ({
    time: `Oct ${20 - index}`,
    title: `Backup ${index + 1}`,
    description: 'web-01 · successful',
    status: 'success',
}));

function FeedDemo() {
    const [shown, setShown] = useState(older.slice(0, 3));
    const [loading, setLoading] = useState(false);
    return (
        <Timeline
            feed
            label="Backups"
            items={shown}
            hasMore={shown.length < older.length}
            loading={loading}
            onLoadMore={() => {
                setLoading(true);
                setTimeout(() => {
                    setShown(older.slice(0, shown.length + 3));
                    setLoading(false);
                }, 500);
            }}
        />
    );
}

/** A feed (role feed) that loads older entries */
export const Feed: Story = { render: () => <FeedDemo /> };
