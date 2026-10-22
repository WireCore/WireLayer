import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { Kanban, type KanbanProps } from './Kanban.js';
import type { KanbanColumn, KanbanMove } from './types.js';

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

function Demo(args: KanbanProps<Card>) {
    const [columns, setColumns] = useState(start);
    const [last, setLast] = useState<KanbanMove<Card> | null>(null);
    const loadMore = (id: string) => {
        setColumns((all) => all.map((column) => (column.id === id ? { ...column, loading: true } : column)));
        setTimeout(
            () =>
                setColumns((all) =>
                    all.map((column) =>
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
                    )
                ),
            600
        );
    };
    const add = (id: string) =>
        setColumns((all) =>
            all.map((column) =>
                column.id === id
                    ? {
                          ...column,
                          items: [...column.items, { id: `n${Date.now()}`, label: 'New card', tag: 'New' }],
                      }
                    : column
            )
        );
    return (
        <div className="flex flex-col gap-3">
            <Kanban
                {...args}
                columns={columns}
                onColumnsChange={setColumns}
                onMove={setLast}
                onLoadMore={loadMore}
                renderCard={(card) => (
                    <>
                        <span>{card.label}</span>
                        <Badge variant="soft">{card.tag}</Badge>
                    </>
                )}
                renderAdd={(column) => (
                    <Button size="sm" variant="text" leadingIcon={Plus} onClick={() => add(column.id)}>
                        Add card
                    </Button>
                )}
            />
            <span className="text-xs text-muted">
                {last
                    ? `${last.item.label}: ${last.from.column} (${last.from.index + 1}) → ${last.to.column} (${last.to.index + 1})`
                    : 'Nothing moved yet'}
            </span>
        </div>
    );
}

const meta = {
    title: 'Data/Kanban',
    component: Kanban,
    args: { label: 'Customer portal project', disabled: false },
    parameters: { layout: 'padded' },
    render: (args) => <Demo {...(args as KanbanProps<Card>)} />,
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
    render: () => (
        <Kanban
            label="Support"
            defaultColumns={[
                { id: 'new', title: 'New', items: [{ id: '1', label: 'Reset password' }] },
                {
                    id: 'wait',
                    title: 'Waiting for customer',
                    collapsed: true,
                    items: [{ id: '2', label: 'Invoice missing' }],
                },
                { id: 'closed', title: 'Closed', items: [] },
            ]}
        />
    ),
};
