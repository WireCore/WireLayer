import type { Meta, StoryObj } from '@storybook/react-vite';
import { File, FileText, Folder, Image } from 'lucide-react';
import { insertTreeNode, moveTreeNode, removeTreeNode, type TreeCheckedStrategy } from '@wirecore/wirelayer-recipes';
import { useRef, useState } from 'react';
import { Tree, type TreeHandle, type TreeNode, type TreeProps, type TreeTransfer } from './Tree.js';

const files: TreeNode[] = [
    {
        id: 'documents',
        label: 'Documents',
        icon: Folder,
        children: [
            { id: 'quote', label: 'Quote.pdf', icon: FileText },
            { id: 'contract', label: 'Contract.pdf', icon: FileText },
            {
                id: 'archive',
                label: 'Archive',
                icon: Folder,
                children: [{ id: 'report-2025', label: 'Report 2025.pdf', icon: FileText }],
            },
        ],
    },
    {
        id: 'images',
        label: 'Images',
        icon: Folder,
        children: [
            { id: 'logo', label: 'Logo.svg', icon: Image },
            { id: 'team', label: 'Team.jpg', icon: Image, disabled: true },
        ],
    },
    { id: 'notes', label: 'Notes.txt', icon: File },
];

function Demo(args: TreeProps) {
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Tree
                {...args}
                selectedValue={selected}
                onSelectionChange={setSelected}
                defaultExpandedValue={['documents']}
            />
            <span className="text-xs text-muted">Selected: {selected.join(', ') || '–'}</span>
        </div>
    );
}

function CheckableDemo(args: TreeProps) {
    const [checked, setChecked] = useState(['quote']);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Tree
                {...args}
                checkable
                checkedValue={checked}
                onCheckedChange={setChecked}
                defaultExpandedValue={['documents']}
            />
            <span className="text-xs text-muted">Checked: {checked.join(', ') || '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Data/Tree',
    component: Tree,
    args: { items: files, label: 'Files', selectionMode: 'single', checkable: false },
    argTypes: {
        items: { control: false },
        selectionMode: { control: 'inline-radio', options: ['single', 'multiple'] },
    },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Checkable: Story = { render: (args) => <CheckableDemo {...args} /> };

function ReorderableDemo(args: TreeProps) {
    const [items, setItems] = useState(files);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Tree
                {...args}
                items={items}
                reorderable
                defaultExpandedValue={['documents', 'images']}
                onMove={(move) => setItems((old) => moveTreeNode(old, move))}
            />
            <span className="text-xs text-muted">Drag or Alt+arrow keys</span>
        </div>
    );
}

/** Nodes by drag and drop or Alt+arrow keys; the story applies the moves with moveTreeNode */
export const Reorderable: Story = { render: (args) => <ReorderableDemo {...args} /> };

/** A server that answers after a pause; "Archive" fails on the first try */
const serverFolders: TreeNode[] = [
    { id: 'projects', label: 'Projects', icon: Folder, hasChildren: true },
    { id: 'archive', label: 'Archive', icon: Folder, hasChildren: true },
    { id: 'empty', label: 'Empty folder', icon: Folder, hasChildren: true },
];
function createServer() {
    let archiveTries = 0;
    return async (node: TreeNode, { signal }: { signal: AbortSignal }): Promise<TreeNode[]> => {
        await new Promise((done) => setTimeout(done, 800));
        if (signal.aborted) throw new DOMException('canceled', 'AbortError');
        if (node.id === 'archive' && archiveTries++ === 0) throw new Error('Server unreachable');
        if (node.id === 'empty') return [];
        return [1, 2, 3].map((index) => ({
            id: `${node.id}-${index}`,
            label: index === 3 ? `${node.label} ${index} (folder)` : `${node.label} file ${index}.pdf`,
            icon: index === 3 ? Folder : FileText,
            hasChildren: index === 3,
        }));
    };
}

function LazyDemo(args: TreeProps) {
    const [loadChildren] = useState(createServer);
    const tree = useRef<TreeHandle>(null);
    return (
        <div className="flex w-80 flex-col gap-3">
            <Tree ref={tree} {...args} items={serverFolders} loadChildren={loadChildren} />
            <button
                type="button"
                className="self-start text-xs text-primary underline"
                onClick={() => tree.current?.invalidate()}
            >
                Reload
            </button>
        </div>
    );
}

/** Children load when a folder opens (spinner, aria-busy, announcement); "Archive" fails once – "Try again" */
export const LazyChildren: Story = { name: 'Lazy-loaded children', render: (args) => <LazyDemo {...args} /> };

/** Folders whose files a server sends; moves among loaded files carry the whole tree (moveTreeNode applies it) */
const sortFolders: TreeNode[] = [
    { id: 'projects', label: 'Projects', icon: Folder, hasChildren: true },
    { id: 'templates', label: 'Templates', icon: Folder, hasChildren: true },
];
const loadFiles = async (node: TreeNode): Promise<TreeNode[]> => {
    await new Promise((done) => setTimeout(done, 300));
    return [1, 2, 3].map((index) => ({
        id: `${node.id}-${index}`,
        label: `${node.label} file ${index}.pdf`,
        icon: FileText,
    }));
};

function ReorderLazyDemo(args: TreeProps) {
    const [items, setItems] = useState(sortFolders);
    return (
        <div className="flex w-80 flex-col gap-3">
            <Tree
                {...args}
                items={items}
                loadChildren={loadFiles}
                reorderable
                onMove={(move) => setItems((current) => moveTreeNode(current, move))}
            />
            <span className="text-xs text-muted">Drag or Alt+arrow keys</span>
        </div>
    );
}

/** Reordering with loaded children: Alt+arrow keys or dragging; a closed folder loads its files before taking any */
export const ReorderLazy: Story = {
    name: 'Reordering with lazy loading',
    render: (args) => <ReorderLazyDemo {...args} />,
};

/** Search field above the tree: hits stay with their ancestors (opened); buttons open or close all branches */
export const Search: Story = {
    name: 'Search in tree',
    render: (args) => (
        <div className="w-80">
            <Tree {...args} filter expandControls showLines />
        </div>
    ),
};

function HighlightDemo(args: TreeProps) {
    const [query, setQuery] = useState('pdf');
    return (
        <div className="flex w-80 flex-col gap-3">
            <Tree {...args} filter filterMode="highlight" filterValue={query} onFilterValueChange={setQuery} />
            <span className="text-xs text-muted">Enter jumps to the next match</span>
        </div>
    );
}

/** All nodes stay; the hits are marked, Enter in the search field jumps to the next one */
export const SearchHighlight: Story = {
    name: 'Search: highlight matches',
    render: (args) => <HighlightDemo {...args} />,
};

function StrictDemo(args: TreeProps) {
    const [checked, setChecked] = useState(['documents']);
    return (
        <div className="flex w-72 flex-col gap-3">
            <Tree
                {...args}
                checkable
                checkStrictly
                checkedValue={checked}
                onCheckedChange={setChecked}
                defaultExpandedValue={['documents']}
            />
            <span className="text-xs text-muted">Checked: {checked.join(', ') || '–'}</span>
        </div>
    );
}

/** Parents and children are checked on their own (checkStrictly) */
export const CheckStrictly: Story = { name: 'Checks without cascade', render: (args) => <StrictDemo {...args} /> };

function StrategyDemo(args: TreeProps) {
    const [checked, setChecked] = useState(['archive']);
    const [strategy, setStrategy] = useState<TreeCheckedStrategy>('parent');
    return (
        <div className="flex w-72 flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
                Output
                <select
                    value={strategy}
                    onChange={(event) => setStrategy(event.target.value as TreeCheckedStrategy)}
                    className="rounded border border-line-strong bg-bg px-2 py-1"
                >
                    <option value="all">all</option>
                    <option value="parent">topmost</option>
                    <option value="child">files only</option>
                </select>
            </label>
            <Tree
                {...args}
                checkable
                checkedStrategy={strategy}
                checkedValue={checked}
                onCheckedChange={setChecked}
                defaultExpandedValue={['documents', 'archive']}
            />
            <span className="text-xs text-muted">Value: {checked.join(', ') || '–'}</span>
        </div>
    );
}

/** checkedStrategy "parent": a fully checked folder is reported instead of its files */
export const CheckedStrategy: Story = { name: 'Checked value output', render: (args) => <StrategyDemo {...args} /> };

/** Own content per node (renderNode) – chevron and check box stay */
export const OwnContent: Story = {
    name: 'Custom node content',
    render: (args) => (
        <div className="w-72">
            <Tree
                {...args}
                defaultExpandedValue={['documents']}
                renderNode={(node, state) => (
                    <>
                        <span className="min-w-0 flex-1 truncate">{node.label}</span>
                        {state.branch && (
                            <span className="rounded-full bg-line px-1.5 text-xs text-muted">
                                {node.children?.length ?? 0}
                            </span>
                        )}
                    </>
                )}
            />
        </div>
    ),
};

function BetweenDemo() {
    const [trees, setTrees] = useState<Record<'left' | 'right', TreeNode[]>>({
        left: files,
        right: [{ id: 'storage', label: 'Storage', icon: Folder, children: [] }],
    });
    const onTransfer = (transfer: TreeTransfer) =>
        setTrees((old) => {
            const from = transfer.sourceTree as 'left' | 'right';
            const to = transfer.targetTree as 'left' | 'right';
            return {
                ...old,
                [from]: removeTreeNode(old[from], transfer.node.id),
                [to]: insertTreeNode(old[to], transfer.node, transfer.parentId, transfer.index),
            };
        });
    const allowDrop = (source: TreeNode, target: TreeNode | null, position: 'before' | 'after' | 'inside') =>
        target?.id !== 'images' || position !== 'inside' || /\.(svg|jpg|png)$/.test(source.label);
    return (
        <div className="grid w-[36rem] grid-cols-2 gap-6">
            <Tree
                items={trees.left}
                label="My files"
                group="storage"
                name="left"
                reorderable
                allowDrop={allowDrop}
                defaultExpandedValue={['documents']}
                onTransfer={onTransfer}
                onMove={(move) => setTrees((old) => ({ ...old, left: moveTreeNode(old.left, move) }))}
            />
            <Tree
                items={trees.right}
                label="Team storage"
                group="storage"
                name="right"
                reorderable
                allowDrop={allowDrop}
                defaultExpandedValue={['storage']}
                onTransfer={onTransfer}
                onMove={(move) => setTrees((old) => ({ ...old, right: moveTreeNode(old.right, move) }))}
            />
        </div>
    );
}

/**
 * Two trees of one group: drag a node across, or Ctrl+X in one tree and Ctrl+V on a node of the other; the story
 * applies the transfer with removeTreeNode/insertTreeNode. allowDrop lets only pictures into "Images".
 */
export const BetweenTrees: Story = { name: 'Between two trees', render: () => <BetweenDemo /> };

/** Without nodes: the empty text (`empty`) */
export const Empty: Story = {
    name: 'Empty',
    render: (args) => (
        <div className="w-72">
            <Tree {...args} items={[]} empty="No files uploaded yet" />
        </div>
    ),
};
