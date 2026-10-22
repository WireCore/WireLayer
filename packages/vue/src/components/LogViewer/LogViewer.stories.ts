import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { LogLine } from '@wirecore/wirelayer-recipes';
import { onBeforeUnmount, ref } from 'vue';
import LogViewer from './LogViewer.vue';

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
    args: { lines: initial, search: true, levelFilter: true, lineNumbers: true, autoScroll: true },
    argTypes: { lines: { control: false } },
    render: (args) => ({
        components: { LogViewer },
        setup: () => ({ args }),
        template: `<LogViewer v-bind="args" class="w-[640px]" />`,
    }),
} satisfies Meta<typeof LogViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 2000 lines – only the visible ones are rendered; search filters and marks, levels with icon and text */
export const Playground: Story = {};

/** New lines arrive; scrolling up pauses following, "Jump to end" resumes; older lines load at the top */
export const Live: Story = {
    render: () => ({
        components: { LogViewer },
        setup: () => {
            const lines = ref<LogLine[]>(
                Array.from({ length: 50 }, (_, index) => ({ id: index, text: line(index), time: new Date() }))
            );
            let next = 50;
            const timer = setInterval(() => {
                lines.value = [...lines.value, { id: next, text: line(next), time: new Date() }];
                next++;
            }, 1000);
            onBeforeUnmount(() => clearInterval(timer));
            let older = 0;
            const loading = ref(false);
            const loadMore = () => {
                loading.value = true;
                setTimeout(() => {
                    older -= 20;
                    const before = Array.from({ length: 20 }, (_, index) => ({
                        id: older + index,
                        text: `DEBUG Older line ${older + index}`,
                    }));
                    lines.value = [...before, ...lines.value];
                    loading.value = false;
                }, 500);
            };
            return { lines, loading, loadMore };
        },
        template: `<LogViewer :lines="lines" has-more :loading="loading" class="w-[640px]" @load-more="loadMore" />`,
    }),
};
