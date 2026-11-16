import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { defineComponent, ref, type ConcreteComponent, type PropType } from 'vue';
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

interface Block {
    id: string;
    label: string;
    /** Groups hold blocks */
    children?: Block[];
}

const palette: Block[] = [
    { id: 'heading', label: 'Heading' },
    { id: 'text', label: 'Text' },
    { id: 'group', label: 'Group', children: [] },
];
let copies = 0;
const copyBlock = (block: Block): Block => ({
    id: `${block.id}-${++copies}`,
    label: block.label,
    children: block.children ? [] : undefined,
});
const outline = (blocks: Block[]): string =>
    blocks.map((block) => (block.children ? `${block.label} (${outline(block.children)})` : block.label)).join(', ');

// A list of blocks; a group shows its own list inside (lists in lists)
const BlockList = defineComponent({
    name: 'BlockList',
    components: { Sortable },
    props: {
        modelValue: { type: Array as PropType<Block[]>, required: true },
        label: { type: String, required: true },
    },
    emits: ['update:modelValue'],
    template: `
        <Sortable :model-value="modelValue" group="page" :label="label" @update:model-value="$emit('update:modelValue', $event)">
            <template #item="{ item }">
                <div class="flex flex-col gap-2">
                    {{ item.label }}
                    <BlockList v-if="item.children" :model-value="item.children" :label="item.label + ' content'"
                        @update:model-value="item.children = $event" />
                </div>
            </template>
        </Sortable>`,
});

/**
 * clone: the palette copies its blocks into the page (it keeps them, takes none in); groups hold lists of their own.
 * Keyboard: Space on a block of the palette, arrow right into the page (and on into the groups), Space drops.
 */
export const Palette: Story = {
    render: () => ({
        components: { BlockList, Sortable },
        setup: () => ({ palette, copyBlock, outline, page: ref<Block[]>([]) }),
        template: `
            <div class="flex w-[560px] gap-6">
                <Sortable :default-value="palette" group="page" label="Blocks" :clone="copyBlock" class="w-40" />
                <div class="flex flex-1 flex-col gap-3">
                    <BlockList v-model="page" label="Page" />
                    <span class="text-xs text-muted">{{ outline(page) || 'Empty page' }}</span>
                </div>
            </div>`,
    }),
};
