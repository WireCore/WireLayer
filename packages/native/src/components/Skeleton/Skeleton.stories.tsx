import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Card } from '../Card/Card.js';
import { Skeleton } from './Skeleton.js';

const meta = {
    title: 'Feedback/Skeleton',
    component: Skeleton,
    render: () => (
        // The loading region is busy; the placeholders themselves are hidden from assistive tech
        <Card className="w-80" role="group" aria-busy aria-label="Loading servers">
            <View className="flex-row items-center gap-3">
                <Skeleton shape="circle" />
                <View className="flex-1 gap-2">
                    <Skeleton className="w-3/5" />
                    <Skeleton className="w-2/5" />
                </View>
            </View>
            <Skeleton shape="rect" />
            <Skeleton />
        </Card>
    ),
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A paragraph of lines and a list row with avatar – the region is busy while it loads */
export const Layouts: Story = {
    name: 'Placeholder layouts',
    render: () => (
        <View className="w-[320px] gap-5" aria-busy>
            <Skeleton lines={3} />
            <View className="flex-row items-center gap-3">
                <Skeleton shape="circle" />
                <View className="flex-1 gap-2">
                    <Skeleton width="60%" />
                    <Skeleton width="40%" height={10} />
                </View>
            </View>
            <Skeleton shape="rect" height={140} />
        </View>
    ),
};
