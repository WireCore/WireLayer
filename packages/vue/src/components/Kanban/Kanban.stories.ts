import { Plus } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref, type ConcreteComponent } from 'vue';
import Badge from '../Badge/Badge.vue';
import Button from '../Button/Button.vue';
import KanbanComponent from './Kanban.vue';
import type { KanbanColumn, KanbanMove } from './types.js';

// Generic component: Storybook's Vue types can't infer args here
const Kanban = KanbanComponent as unknown as ConcreteComponent;

interface Card {
    id: string;
    label: string;
    tag: string;
}

const start = (): KanbanColumn<Card>[] => [
    {
        id: 'open',
        title: 'Open',
        limit: 4,
        items: [
            { id: 'a', label: 'Login page', tag: 'Frontend' },
            { id: 'b', label: 'Check backup', tag: 'Operations' },
            { id: 'c', label: 'Invoice export', tag: 'Backend' },
        ],
    },
    { id: 'doing', title: 'In progress', limit: 2, items: [{ id: 'd', label: 'API documentation', tag: 'Backend' }] },
    { id: 'review', title: 'Review', limit: 1, items: [{ id: 'e', label: 'Search field', tag: 'Frontend' }] },
    { id: 'done', title: 'Done', items: [{ id: 'f', label: 'Migrate domain', tag: 'Operations' }], hasMore: true },
];

const meta = {
    title: 'Data/Kanban',
    component: Kanban,
    args: { label: 'Customer portal project', disabled: false },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Badge, Button, Kanban },
        setup: () => {
            const columns = ref(start());
            const last = ref<KanbanMove<Card> | null>(null);
            const loadMore = (id: string) => {
                columns.value = columns.value.map((column) =>
                    column.id === id ? { ...column, loading: true } : column
                );
                setTimeout(
                    () =>
                        (columns.value = columns.value.map((column) =>
                            column.id === id
                                ? {
                                      ...column,
                                      loading: false,
                                      hasMore: false,
                                      items: [
                                          ...column.items,
                                          { id: 'g', label: 'Certificate renewed', tag: 'Operations' },
                                      ],
                                  }
                                : column
                        )),
                    600
                );
            };
            const add = (id: string) =>
                (columns.value = columns.value.map((column) =>
                    column.id === id
                        ? {
                              ...column,
                              items: [...column.items, { id: `n${Date.now()}`, label: 'New card', tag: 'New' }],
                          }
                        : column
                ));
            return { args, columns, last, loadMore, add, Plus };
        },
        template: `
            <div class="flex flex-col gap-3">
                <Kanban v-bind="args" v-model:columns="columns" @move="last = $event" @load-more="loadMore">
                    <template #card="{ item }">
                        <span>{{ item.label }}</span>
                        <Badge variant="soft">{{ item.tag }}</Badge>
                    </template>
                    <template #add="{ column }">
                        <Button size="sm" variant="text" :leading-icon="Plus" @click="add(column.id)">Add card</Button>
                    </template>
                </Kanban>
                <span class="text-xs text-muted">{{
                    last
                        ? \`\${last.item.label}: \${last.from.column} (\${last.from.index + 1}) → \${last.to.column} (\${last.to.index + 1})\`
                        : 'Nothing moved yet'
                }}</span>
            </div>`,
    }),
} satisfies Meta<typeof Kanban>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Drag a card at its handle – or Space, arrow keys (left/right into the next column), Space – or click the handle and
 * then the target. WIP limits show a hint when reached or exceeded; columns collapse.
 */
export const Playground: Story = {};

/** A column collapsed from the start (its number of cards stays visible) */
export const Collapsed: Story = {
    render: () => ({
        components: { Kanban },
        setup: () => ({
            columns: [
                { id: 'new', title: 'New', items: [{ id: '1', label: 'Reset password' }] },
                {
                    id: 'wait',
                    title: 'Waiting for customer',
                    collapsed: true,
                    items: [{ id: '2', label: 'Invoice missing' }],
                },
                { id: 'closed', title: 'Closed', items: [] },
            ],
        }),
        template: `<Kanban label="Support" :default-columns="columns" />`,
    }),
};
