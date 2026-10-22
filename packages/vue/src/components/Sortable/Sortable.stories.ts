import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Badge from '../Badge/Badge.vue';
import SortableComponent from './Sortable.vue';

// Generic component: Storybook's Vue types can't infer args here
const Sortable = SortableComponent as unknown as ConcreteComponent;

interface Task {
    id: string;
    label: string;
    tag?: string;
}

const tasks: Task[] = [
    { id: 'p', label: 'Planning' },
    { id: 'u', label: 'Implementation' },
    { id: 't', label: 'Test' },
    { id: 'r', label: 'Release' },
];

const meta = {
    title: 'Data/Sortable',
    component: Sortable,
    args: { label: 'Order', orientation: 'vertical', disabled: false },
    argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] } },
    render: (args) => ({
        components: { Sortable },
        setup: () => ({ args, items: ref([...tasks]) }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Sortable v-bind="args" v-model="items" />
                <span class="text-xs text-muted">{{ items.map((item) => item.label).join(' → ') }}</span>
            </div>`,
    }),
} satisfies Meta<typeof Sortable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Drag the handle – or Space, arrow keys, Space (Escape cancels) – or click it and click the target */
export const Playground: Story = {};

/** Kanban: lists of one group exchange cards (arrow keys left/right move to the next column) */
export const Kanban: Story = {
    render: () => ({
        components: { Badge, Sortable },
        setup: () => ({
            open: ref<Task[]>([
                { id: 'a', label: 'Login page', tag: 'Frontend' },
                { id: 'b', label: 'Check backup', tag: 'Operations' },
            ]),
            doing: ref<Task[]>([{ id: 'c', label: 'API documentation', tag: 'Backend' }]),
            done: ref<Task[]>([]),
        }),
        template: `
            <div class="grid w-[720px] grid-cols-3 gap-4">
                <Sortable v-model="open" group="board" label="Open">
                    <template #item="{ item }"><span class="flex items-center justify-between gap-2">{{ item.label }} <Badge>{{ item.tag }}</Badge></span></template>
                </Sortable>
                <Sortable v-model="doing" group="board" label="In progress">
                    <template #item="{ item }"><span class="flex items-center justify-between gap-2">{{ item.label }} <Badge>{{ item.tag }}</Badge></span></template>
                </Sortable>
                <Sortable v-model="done" group="board" label="Done" />
            </div>`,
    }),
};

/** Tiles in a grid */
export const Grid: Story = {
    render: () => ({
        components: { Sortable },
        setup: () => ({ items: ref(['A', 'B', 'C', 'D', 'E', 'F']) }),
        template: `<Sortable v-model="items" orientation="grid" :columns="3" aria-label="Tiles" class="w-96" />`,
    }),
};

/** Two grids of one group: the arrows past the first or last tile move it into the other grid */
export const GridGroup: Story = {
    render: () => ({
        components: { Sortable },
        setup: () => ({ chosen: ref(['A', 'B', 'C', 'D']), pool: ref(['E', 'F', 'G']) }),
        template: `
            <div class="flex w-96 flex-col gap-4">
                <Sortable v-model="chosen" group="tiles" orientation="grid" :columns="3" label="Selected" />
                <Sortable v-model="pool" group="tiles" orientation="grid" :columns="3" label="Available" />
            </div>`,
    }),
};
