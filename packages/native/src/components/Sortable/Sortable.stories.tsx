import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { useState } from 'react';
import { View } from 'react-native';
import { Badge } from '../Badge/Badge.js';
import { Text } from '../Text/Text.js';
import { Sortable, type SortableProps } from './Sortable.js';

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

function Demo(args: SortableProps<Task>) {
    const [items, setItems] = useState(tasks);
    return (
        <View className="gap-3">
            <Sortable {...args} value={items} onValueChange={setItems} />
            <Text variant="muted">{items.map((item) => item.label).join(' → ')}</Text>
        </View>
    );
}

const meta = {
    title: 'Data/Sortable',
    component: Sortable,
    args: { label: 'Order', orientation: 'vertical', disabled: false },
    argTypes: {
        orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
        // View props reach the outermost view (react-native-web: data-testid)
        testID: { control: 'text' },
    },
    decorators: [(Story) => <View className="w-[340px]">{Story()}</View>],
    render: (args) => <Demo {...(args as SortableProps<Task>)} />,
} satisfies Meta<typeof Sortable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Long press on the handle and drag – or tap the handle and then the target; screen readers: the actions of the
 * handle. Web: Space picks up, arrow keys move, Space drops, Escape cancels.
 */
export const Playground: Story = {};

const card = (item: Task) => (
    <View className="flex-row items-center justify-between gap-2">
        <Text>{item.label}</Text>
        {!!item.tag && <Badge variant="soft">{item.tag}</Badge>}
    </View>
);

function Lists() {
    const [open, setOpen] = useState<Task[]>([
        { id: 'a', label: 'Login page', tag: 'Frontend' },
        { id: 'b', label: 'Check backup', tag: 'Operations' },
        { id: 'c', label: 'API documentation', tag: 'Backend' },
    ]);
    const [done, setDone] = useState<Task[]>([]);
    const [last, setLast] = useState('Nothing moved yet');
    return (
        <View className="gap-4">
            <Sortable
                value={open}
                onValueChange={setOpen}
                group="tasks"
                name="open"
                label="Open"
                renderItem={card}
                onMove={(move) => setLast(`${move.item.label}: ${move.from.container} → ${move.to.container}`)}
            />
            <Sortable
                value={done}
                onValueChange={setDone}
                group="tasks"
                name="done"
                label="Done"
                renderItem={card}
                onMove={(move) => setLast(`${move.item.label}: ${move.from.container} → ${move.to.container}`)}
            />
            <Text variant="muted">{last}</Text>
        </View>
    );
}

/**
 * Two lists of one group: tap a handle and then a handle (or the empty list) of the other list; screen readers:
 * the action "Move to “Done”"; web: arrow left/right moves a picked-up item into the other list
 */
export const Group: Story = { name: 'Two lists (group)', render: () => <Lists /> };

function Row() {
    const [phases, setPhases] = useState(['Plan', 'Build', 'Test']);
    return <Sortable value={phases} onValueChange={setPhases} orientation="horizontal" label="Phases" />;
}

/** A row of items (orientation horizontal): drag sideways */
export const Horizontal: Story = { name: 'Horizontal', render: () => <Row /> };

const palette = [
    { id: 'heading', label: 'Heading' },
    { id: 'text', label: 'Text' },
    { id: 'image', label: 'Image' },
];
let copies = 0;

function Builder() {
    const [page, setPage] = useState<{ id: string; label: string }[]>([]);
    return (
        <View className="gap-4">
            <Sortable
                defaultValue={palette}
                group="page"
                label="Blocks"
                clone={(block) => ({ id: `${block.id}-${++copies}`, label: block.label })}
            />
            <Sortable value={page} onValueChange={setPage} group="page" label="Page" />
            <Text variant="muted">{page.map((block) => block.label).join(' → ') || 'Empty page'}</Text>
        </View>
    );
}

/**
 * clone: the palette copies its blocks into the page and keeps them. Tap a block of the palette and then the page
 * (or one of its blocks); screen readers: the action "Copy to “Page”"; web: Space, then arrow right moves the
 * copy into the page
 */
export const Palette: Story = { render: () => <Builder /> };
