import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import VirtualList from './VirtualList.vue';

const entries = Array.from({ length: 10_000 }, (_, index) => ({
    id: index + 1,
    message: `Request ${index + 1} handled`,
    time: `${String(Math.floor(index / 60) % 24).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
}));

const meta = {
    title: 'Data/VirtualList',
    // Generic component: Storybook's Vue types can't infer args here
    component: VirtualList as unknown as ConcreteComponent,
    args: { label: 'Log', height: '20rem', itemHeight: 40 },
    render: (args) => ({
        components: { VirtualList: VirtualList as unknown as ConcreteComponent },
        setup: () => ({ args, entries }),
        template: `
            <VirtualList v-bind="args" :items="entries" class="w-96">
                <template #default="{ item }">
                    <div class="flex h-10 items-center gap-3 border-b border-line px-3 text-sm">
                        <span class="font-mono text-xs text-muted">{{ item.time }}</span>{{ item.message }}
                    </div>
                </template>
            </VirtualList>`,
    }),
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Playground: Story = {};

/** A data source fills the list while scrolling (pages of 50); a loading row at the end, announced */
export const Infinite: Story = {
    name: 'Infinite loading',
    render: () => ({
        components: { VirtualList: VirtualList as unknown as ConcreteComponent },
        setup: () => ({
            logSource: {
                async getItems({ page = 1, pageSize = 50 }: { page?: number; pageSize?: number }) {
                    await new Promise((done) => setTimeout(done, 500));
                    return { items: entries.slice((page - 1) * pageSize, page * pageSize), totalCount: 1000 };
                },
            },
        }),
        template: `
            <VirtualList label="Log" :data-source="logSource" class="w-96">
                <template #default="{ item }">
                    <div class="flex h-10 items-center gap-3 border-b border-line px-3 text-sm">
                        <span class="font-mono text-xs text-muted">{{ item.time }}</span>{{ item.message }}
                    </div>
                </template>
            </VirtualList>`,
    }),
};

/** Group headings that stick to the top, rows of different heights */
export const Groups: Story = {
    name: 'Groups and variable heights',
    render: () => ({
        components: { VirtualList: VirtualList as unknown as ConcreteComponent },
        setup: () => ({
            messages: entries.slice(0, 600).map((entry) => ({
                ...entry,
                hour: `${entry.time.slice(0, 2)}:00`,
                detail:
                    entry.id % 4 === 0 ? 'Reply with attachment, forwarded to the department, follow-up question' : '',
            })),
        }),
        template: `
            <VirtualList label="Log" :items="messages" item-group="hour" :estimate-size="(item) => (item.detail ? 64 : 40)" class="w-96">
                <template #default="{ item }">
                    <div class="flex flex-col justify-center gap-0.5 border-b border-line px-3 py-2 text-sm">
                        <span><span class="font-mono text-xs text-muted">{{ item.time }}</span> {{ item.message }}</span>
                        <span v-if="item.detail" class="text-xs text-muted">{{ item.detail }}</span>
                    </div>
                </template>
            </VirtualList>`,
    }),
};

/** scrollToIndex (ref): jump to an entry */
export const ScrollTo: Story = {
    name: 'Jump to entry',
    render: () => ({
        components: { VirtualList: VirtualList as unknown as ConcreteComponent },
        setup: () => ({
            entries,
            list: ref<{ scrollToIndex: (index: number, options?: { align?: 'start' }) => void } | null>(null),
        }),
        template: `
            <div class="flex w-96 flex-col gap-3">
                <button type="button" class="self-start text-sm text-primary underline" @click="list?.scrollToIndex(4999, { align: 'start' })">
                    Jump to request 5000
                </button>
                <VirtualList ref="list" label="Log" :items="entries">
                    <template #default="{ item }">
                        <div class="flex h-10 items-center gap-3 border-b border-line px-3 text-sm">
                            <span class="font-mono text-xs text-muted">{{ item.time }}</span>{{ item.message }}
                        </div>
                    </template>
                </VirtualList>
            </div>`,
    }),
};
