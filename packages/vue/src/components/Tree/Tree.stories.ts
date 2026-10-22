import { File, FileText, Folder, Image } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { insertTreeNode, moveTreeNode, removeTreeNode, type TreeMove } from '@wirecore/wirelayer-recipes';
import { ref } from 'vue';
import Tree from './Tree.vue';
import type { TreeNode, TreeTransfer } from './types.js';

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

const meta = {
    title: 'Data/Tree',
    component: Tree,
    args: { items: files, label: 'Files', selectionMode: 'single', checkable: false },
    argTypes: {
        items: { control: false },
        selectionMode: { control: 'inline-radio', options: ['single', 'multiple'] },
    },
    render: (args) => ({
        components: { Tree },
        setup: () => ({ args, selected: ref<string[]>([]) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Tree v-bind="args" v-model:selected-value="selected" :default-expanded-value="['documents']" />
                <span class="text-xs text-muted">Selected: {{ selected.join(', ') || '–' }}</span>
            </div>`,
    }),
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Checkable: Story = {
    render: (args) => ({
        components: { Tree },
        setup: () => ({ args, checked: ref(['quote']) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Tree v-bind="args" v-model:checked-value="checked" checkable :default-expanded-value="['documents']" />
                <span class="text-xs text-muted">Checked: {{ checked.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** Nodes by drag and drop or Alt+arrow keys; the story applies the moves with moveTreeNode */
export const Reorderable: Story = {
    render: (args) => ({
        components: { Tree },
        setup: () => {
            const items = ref(files);
            return {
                args,
                items,
                onMove: (move: TreeMove) => (items.value = moveTreeNode(items.value, move)),
            };
        },
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Tree v-bind="args" :items="items" reorderable :default-expanded-value="['documents', 'images']" @move="onMove" />
                <span class="text-xs text-muted">Drag or Alt+arrow keys</span>
            </div>`,
    }),
};

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

/** Children load when a folder opens (spinner, aria-busy, announcement); "Archive" fails once – "Try again" */
export const LazyChildren: Story = {
    name: 'Lazy-loaded children',
    render: (args) => ({
        components: { Tree },
        setup: () => {
            const tree = ref<{ invalidate: (id?: string) => void } | null>(null);
            return { args, items: serverFolders, loadChildren: createServer(), tree };
        },
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Tree ref="tree" v-bind="args" :items="items" :load-children="loadChildren" />
                <button type="button" class="self-start text-xs text-primary underline" @click="tree?.invalidate()">
                    Reload
                </button>
            </div>`,
    }),
};

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

/** Reordering with loaded children: Alt+arrow keys or dragging; a closed folder loads its files before taking any */
export const ReorderLazy: Story = {
    name: 'Reordering with lazy loading',
    render: (args) => ({
        components: { Tree },
        setup: () => {
            const items = ref(sortFolders);
            return {
                args,
                items,
                loadChildren: loadFiles,
                onMove: (move: TreeMove) => (items.value = moveTreeNode(items.value, move)),
            };
        },
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Tree v-bind="args" :items="items" :load-children="loadChildren" reorderable @move="onMove" />
                <span class="text-xs text-muted">Drag or Alt+arrow keys</span>
            </div>`,
    }),
};

/** Search field above the tree: hits stay with their ancestors (opened); buttons open or close all branches */
export const Search: Story = {
    name: 'Search in tree',
    render: (args) => ({
        components: { Tree },
        setup: () => ({ args }),
        template: `
            <div class="w-80">
                <Tree v-bind="args" filter expand-controls show-lines />
            </div>`,
    }),
};

/** All nodes stay; the hits are marked, Enter in the search field jumps to the next one */
export const SearchHighlight: Story = {
    name: 'Search: highlight matches',
    render: (args) => ({
        components: { Tree },
        setup: () => ({ args, query: ref('pdf') }),
        template: `
            <div class="flex w-80 flex-col gap-3">
                <Tree v-bind="args" v-model:filter-value="query" filter filter-mode="highlight" />
                <span class="text-xs text-muted">Enter jumps to the next match</span>
            </div>`,
    }),
};

/** Parents and children are checked on their own (checkStrictly) */
export const CheckStrictly: Story = {
    name: 'Checks without cascade',
    render: (args) => ({
        components: { Tree },
        setup: () => ({ args, checked: ref(['documents']) }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <Tree v-bind="args" v-model:checked-value="checked" checkable check-strictly :default-expanded-value="['documents']" />
                <span class="text-xs text-muted">Checked: {{ checked.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** checkedStrategy "parent": a fully checked folder is reported instead of its files */
export const CheckedStrategy: Story = {
    name: 'Checked value output',
    render: (args) => ({
        components: { Tree },
        setup: () => ({
            args,
            checked: ref<string[]>(['archive']),
            strategy: ref<'all' | 'parent' | 'child'>('parent'),
        }),
        template: `
            <div class="flex w-72 flex-col gap-3">
                <label class="flex items-center gap-2 text-sm">Output
                    <select v-model="strategy" class="rounded border border-line-strong bg-bg px-2 py-1">
                        <option value="all">all</option><option value="parent">topmost</option><option value="child">files only</option>
                    </select>
                </label>
                <Tree v-bind="args" v-model:checked-value="checked" checkable :checked-strategy="strategy" :default-expanded-value="['documents', 'archive']" />
                <span class="text-xs text-muted">Value: {{ checked.join(', ') || '–' }}</span>
            </div>`,
    }),
};

/** Own content per node (slot `node`) – chevron and check box stay */
export const OwnContent: Story = {
    name: 'Custom node content',
    render: (args) => ({
        components: { Tree },
        setup: () => ({ args }),
        template: `
            <div class="w-72">
                <Tree v-bind="args" :default-expanded-value="['documents']">
                    <template #node="{ node, branch }">
                        <span class="min-w-0 flex-1 truncate">{{ node.label }}</span>
                        <span v-if="branch" class="rounded-full bg-line px-1.5 text-xs text-muted">{{ node.children?.length ?? 0 }}</span>
                    </template>
                </Tree>
            </div>`,
    }),
};

/**
 * Two trees of one group: drag a node across, or Ctrl+X in one tree and Ctrl+V on a node of the other; the story
 * applies the transfer with removeTreeNode/insertTreeNode. allowDrop lets only pictures into "Images".
 */
export const BetweenTrees: Story = {
    name: 'Between two trees',
    render: () => ({
        components: { Tree },
        setup: () => {
            const left = ref<TreeNode[]>(files);
            const right = ref<TreeNode[]>([{ id: 'storage', label: 'Storage', icon: Folder, children: [] }]);
            const trees = { left, right };
            const onTransfer = (transfer: TreeTransfer) => {
                const from = trees[transfer.sourceTree as 'left' | 'right'];
                const to = trees[transfer.targetTree as 'left' | 'right'];
                from.value = removeTreeNode(from.value, transfer.node.id);
                to.value = insertTreeNode(to.value, transfer.node, transfer.parentId, transfer.index);
            };
            const allowDrop = (source: TreeNode, target: TreeNode | null, position: 'before' | 'after' | 'inside') =>
                target?.id !== 'images' || position !== 'inside' || /\.(svg|jpg|png)$/.test(source.label);
            return {
                left,
                right,
                onTransfer,
                allowDrop,
                moveLeft: (move: TreeMove) => (left.value = moveTreeNode(left.value, move)),
                moveRight: (move: TreeMove) => (right.value = moveTreeNode(right.value, move)),
            };
        },
        template: `
            <div class="grid w-[36rem] grid-cols-2 gap-6">
                <Tree :items="left" label="My files" group="storage" name="left" reorderable :allow-drop="allowDrop"
                    :default-expanded-value="['documents']" @transfer="onTransfer" @move="moveLeft" />
                <Tree :items="right" label="Team storage" group="storage" name="right" reorderable :allow-drop="allowDrop"
                    :default-expanded-value="['storage']" @transfer="onTransfer" @move="moveRight" />
            </div>`,
    }),
};

/** Without nodes: the empty text (slot `empty`) */
export const Empty: Story = {
    name: 'Empty',
    render: (args) => ({
        components: { Tree },
        setup: () => ({ args }),
        template: `
            <div class="w-72">
                <Tree v-bind="args" :items="[]">
                    <template #empty>No files uploaded yet</template>
                </Tree>
            </div>`,
    }),
};
