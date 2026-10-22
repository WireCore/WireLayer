import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { Text } from '../Text/Text.js';
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

const older: Card[] = [
    { id: 'g', label: 'Certificate renewed', tag: 'Operations' },
    { id: 'h', label: 'Newsletter sent', tag: 'Marketing' },
];

function Demo(args: KanbanProps<Card>) {
    const [columns, setColumns] = useState(start);
    const [last, setLast] = useState<KanbanMove<Card> | null>(null);
    const lastText = last
        ? `${last.item.label}: ${last.from.column} (${last.from.index + 1}) → ${last.to.column} (${last.to.index + 1})`
        : 'Nothing moved yet';
    const update = (id: string, change: (column: KanbanColumn<Card>) => KanbanColumn<Card>) =>
        setColumns((all) => all.map((column) => (column.id === id ? change(column) : column)));
    const loadMore = (id: string) => {
        update(id, (column) => ({ ...column, loading: true }));
        setTimeout(
            () =>
                update(id, (column) => ({
                    ...column,
                    loading: false,
                    hasMore: false,
                    items: [...column.items, ...older],
                })),
            600
        );
    };
    const add = (id: string) =>
        update(id, (column) => ({
            ...column,
            items: [...column.items, { id: `n${Date.now()}`, label: 'New card', tag: 'New' }],
        }));
    return (
        <View className="gap-3">
            <Kanban
                {...args}
                columns={columns}
                onColumnsChange={setColumns}
                onMove={setLast}
                onLoadMore={loadMore}
                renderCard={(card) => (
                    <View className="flex-row items-center justify-between gap-2">
                        <Text className="shrink">{card.label}</Text>
                        <Badge variant="soft">{card.tag}</Badge>
                    </View>
                )}
                renderAdd={(column) => (
                    <Button variant="text" leadingIcon={Plus} hitSlop={2} onPress={() => add(column.id)}>
                        {`Add card to “${column.title}”`}
                    </Button>
                )}
            />
            <Text variant="muted">{lastText}</Text>
        </View>
    );
}

const meta = {
    title: 'Data/Kanban',
    component: Kanban,
    args: { label: 'Customer portal project', disabled: false },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
    render: (args) => <Demo {...(args as KanbanProps<Card>)} />,
} satisfies Meta<typeof Kanban>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Four columns side by side (swipe sideways). The button of a card ("Move …") opens its actions: another
 * column or "Move up"/"Move down" …; screen readers find the same moves as actions of the button. A long press on
 * it drags the card within its column. WIP limits show a hint, "Done" loads more cards.
 */
export const Playground: Story = {};

/** A column collapsed from the start (its number of cards stays visible) and an empty column */
export const Collapsed: Story = {
    name: 'Collapsed and empty',
    render: () => (
        <Kanban
            label="Support"
            titleTag="h2"
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
