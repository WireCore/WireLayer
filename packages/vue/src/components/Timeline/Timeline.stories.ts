import { CircleAlert, CircleCheck, GitCommitHorizontal, Rocket } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed, ref } from 'vue';
import Timeline, { type TimelineItem } from './Timeline.vue';

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
    args: { items, label: 'History' },
    argTypes: {
        items: { control: false },
        align: { control: 'inline-radio', options: ['start', 'end', 'alternate'] },
        orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    },
    render: (args) => ({
        components: { Timeline },
        setup: () => ({ args }),
        template: `<Timeline v-bind="args" class="max-w-md" />`,
    }),
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
    args: { align: 'alternate', items: steps, activeIndex: 1 },
    render: (args) => ({
        components: { Timeline },
        setup: () => ({ args }),
        template: `<Timeline v-bind="args" class="max-w-2xl" />`,
    }),
};

export const AlignEnd: Story = { args: { align: 'end' } };

/** Events side by side; the active event is marked (aria-current="step") */
export const Horizontal: Story = {
    args: { orientation: 'horizontal', items: steps, activeIndex: 1 },
    render: (args) => ({
        components: { Timeline },
        setup: () => ({ args }),
        template: `<Timeline v-bind="args" class="max-w-3xl" />`,
    }),
};

/** Own content per event via the slots #content, #opposite and #marker */
export const OwnContent: Story = {
    render: () => ({
        components: { Timeline },
        setup: () => ({ steps }),
        template: `
            <Timeline :items="steps" label="Project plan" class="max-w-md">
                <template #marker="{ index }"><span class="text-xs font-semibold">{{ index + 1 }}</span></template>
                <template #opposite="{ item }"><span class="font-mono text-xs">{{ item.time }}</span></template>
                <template #content="{ item }">
                    <span class="text-sm font-semibold">{{ item.title }}</span>
                    <span class="text-xs text-muted">Status: {{ item.opposite }}</span>
                </template>
            </Timeline>`,
    }),
};

// Activity of a ticket: newest first, older entries load at the end
const activity = (from: number, count: number): TimelineItem[] =>
    Array.from({ length: count }, (_, index) => ({
        time: `Oct ${21 - Math.floor((from + index) / 4)}, 2026, ${['5:00 PM', '3:00 PM', '1:00 PM', '11:00 AM'][(from + index) % 4]}`,
        title: ['Comment', 'Status changed', 'File attached', 'Assigned'][(from + index) % 4]!,
        description: `Entry ${from + index + 1}`,
    }));

/**
 * A feed (role="feed"): each entry is an article, Page Up/Down move between them; "Load older entries" (and
 * scrolling to the end) loads more – aria-busy while loading
 */
export const Feed: Story = {
    name: 'Feed with loading more',
    render: () => ({
        components: { Timeline },
        setup: () => {
            const items = ref(activity(0, 6));
            const loading = ref(false);
            const loadMore = async () => {
                loading.value = true;
                await new Promise((done) => setTimeout(done, 600));
                items.value = [...items.value, ...activity(items.value.length, 6)];
                loading.value = false;
            };
            return { items, loading, loadMore, hasMore: computed(() => items.value.length < 24) };
        },
        template: `
            <div class="max-h-96 w-96 overflow-y-auto p-2">
                <Timeline :items="items" label="Activity" feed :has-more="hasMore" :loading="loading" :set-size="24" auto-load @load-more="loadMore" />
            </div>`,
    }),
};
