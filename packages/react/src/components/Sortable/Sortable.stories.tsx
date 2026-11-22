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

/** A list of blocks; a group shows its own list inside (lists in lists) */
function BlockList({
    blocks,
    label,
    onChange,
}: {
    blocks: Block[];
    label: string;
    onChange: (blocks: Block[]) => void;
}) {
    return (
        <Sortable
            value={blocks}
            onValueChange={onChange}
            group="page"
            label={label}
            renderItem={(block) => (
                <div className="flex flex-col gap-2">
                    {block.label}
                    {block.children && (
                        <BlockList
                            blocks={block.children}
                            label={`${block.label} content`}
                            onChange={(children) =>
                                onChange(
                                    blocks.map((entry) => (entry.id === block.id ? { ...entry, children } : entry))
                                )
                            }
                        />
                    )}
                </div>
            )}
        />
    );
}

function Builder() {
    const [page, setPage] = useState<Block[]>([]);
    return (
        <div className="flex w-[560px] gap-6">
            <Sortable defaultValue={palette} group="page" label="Blocks" clone={copyBlock} className="w-40" />
            <div className="flex flex-1 flex-col gap-3">
                <BlockList blocks={page} label="Page" onChange={setPage} />
                <span className="text-xs text-muted">{outline(page) || 'Empty page'}</span>
            </div>
        </div>
    );
}

/**
 * clone: the palette copies its blocks into the page (it keeps them, takes none in); groups hold lists of their own.
 * Keyboard: Space on a block of the palette, arrow right into the page (and on into the groups), Space drops.
 */
export const Palette: Story = { render: () => <Builder /> };

const steps = Array.from({ length: 30 }, (_, index) => ({ id: `s${index + 1}`, label: `Step ${index + 1}` }));

function LongList() {
    const [items, setItems] = useState(steps);
    return (
        <div className="flex w-80 flex-col gap-3">
            <div className="h-64 overflow-y-auto rounded-lg border border-line p-3" data-testid="scroll-area">
                <Sortable value={items} onValueChange={setItems} label="Steps" />
            </div>
            <span className="text-xs text-muted">First: {items[0]!.label}</span>
        </div>
    );
}

/** In a scrolling area: dragging an item near its edge scrolls it; a copy of the item follows the pointer */
export const Scrolling: Story = { render: () => <LongList /> };
