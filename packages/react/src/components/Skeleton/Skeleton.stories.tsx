import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton.js';

const meta = {
    title: 'Feedback/Skeleton',
    component: Skeleton,
    args: { shape: 'line', width: '100%' },
    argTypes: { shape: { control: 'inline-radio', options: ['line', 'rect', 'circle'] } },
    render: (args) => (
        <div className="w-80">
            <Skeleton {...args} />
        </div>
    ),
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The region is marked busy; the placeholders themselves are hidden from assistive tech */
export const Card: Story = {
    render: () => (
        <div
            className="flex w-80 flex-col gap-3 rounded-card border border-line p-6"
            role="group"
            aria-busy="true"
            aria-label="Loading servers"
        >
            <div className="flex items-center gap-3">
                <Skeleton shape="circle" />
                <div className="flex flex-1 flex-col gap-2">
                    <Skeleton width="60%" />
                    <Skeleton width="40%" />
                </div>
            </div>
            <Skeleton shape="rect" />
            <Skeleton />
            <Skeleton width="80%" />
        </div>
    ),
};
