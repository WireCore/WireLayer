import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../Badge/Badge.js';
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
        <div className="flex w-80 flex-col gap-3">
            <Sortable {...args} value={items} onValueChange={setItems} />
            <span className="text-xs text-muted">{items.map((item) => item.label).join(' → ')}</span>
        </div>
    );
}

const meta = {
    title: 'Data/Sortable',
    component: Sortable,
    args: { label: 'Order', orientation: 'vertical', disabled: false },
    argTypes: { orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] } },
    render: (args) => <Demo {...(args as SortableProps<Task>)} />,
} satisfies Meta<typeof Sortable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Drag the handle – or Space, arrow keys, Space (Escape cancels) – or click it and click the target */
export const Playground: Story = {};

const card = (item: Task) => (
    <span className="flex items-center justify-between gap-2">
        {item.label} {item.tag && <Badge>{item.tag}</Badge>}
    </span>
);

function Board() {
    const [open, setOpen] = useState<Task[]>([
        { id: 'a', label: 'Login page', tag: 'Frontend' },
        { id: 'b', label: 'Check backup', tag: 'Operations' },
    ]);
    const [doing, setDoing] = useState<Task[]>([{ id: 'c', label: 'API documentation', tag: 'Backend' }]);
    const [done, setDone] = useState<Task[]>([]);
    return (
        <div className="grid w-[720px] grid-cols-3 gap-4">
            <Sortable value={open} onValueChange={setOpen} group="board" label="Open" renderItem={card} />
            <Sortable value={doing} onValueChange={setDoing} group="board" label="In progress" renderItem={card} />
            <Sortable value={done} onValueChange={setDone} group="board" label="Done" />
        </div>
    );
}

/** Kanban: lists of one group exchange cards (arrow keys left/right move to the next column) */
export const Kanban: Story = { render: () => <Board /> };

function Tiles() {
    const [items, setItems] = useState(['A', 'B', 'C', 'D', 'E', 'F']);
    return (
        <Sortable
            value={items}
            onValueChange={setItems}
            orientation="grid"
            columns={3}
            aria-label="Tiles"
            className="w-96"
        />
    );
}

/** Tiles in a grid */
export const Grid: Story = { render: () => <Tiles /> };

function TileGroups() {
    const [chosen, setChosen] = useState(['A', 'B', 'C', 'D']);
    const [pool, setPool] = useState(['E', 'F', 'G']);
    return (
        <div className="flex w-96 flex-col gap-4">
            <Sortable
                value={chosen}
                onValueChange={setChosen}
                group="tiles"
                orientation="grid"
                columns={3}
                label="Selected"
            />
            <Sortable
                value={pool}
                onValueChange={setPool}
                group="tiles"
                orientation="grid"
                columns={3}
                label="Available"
            />
        </div>
    );
}

/** Two grids of one group: the arrows past the first or last tile move it into the other grid */
export const GridGroup: Story = { render: () => <TileGroups /> };
