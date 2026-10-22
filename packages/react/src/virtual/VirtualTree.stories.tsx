import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Folder } from 'lucide-react';
import { useState } from 'react';
import type { TreeNode } from '../components/Tree/Tree.js';
import { VirtualTree, type VirtualTreeProps } from './VirtualTree.js';

// 200 folders with 50 files each – 10 200 nodes, only the rows in view are in the DOM
const folders: TreeNode[] = Array.from({ length: 200 }, (_, folder) => ({
    id: `folder-${folder + 1}`,
    label: `Folder ${folder + 1}`,
    icon: Folder,
    children: Array.from({ length: 50 }, (_, file) => ({
        id: `folder-${folder + 1}-${file + 1}`,
        label: `File ${folder + 1}.${file + 1}.pdf`,
        icon: FileText,
    })),
}));

function Demo(args: VirtualTreeProps) {
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <div className="flex w-80 flex-col gap-3">
            <VirtualTree
                {...args}
                selectedValue={selected}
                onSelectionChange={setSelected}
                filter
                expandControls
                defaultExpandedValue={['folder-1']}
            />
            <span className="text-xs text-muted">Selected: {selected.join(', ') || '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Data/VirtualTree',
    component: VirtualTree,
    args: { items: folders, label: 'Storage', height: '24rem', checkable: false, selectionMode: 'single' },
    argTypes: {
        items: { control: false },
        selectionMode: { control: 'inline-radio', options: ['single', 'multiple'] },
    },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof VirtualTree>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 10 200 nodes: arrow keys, Home/End and typing scroll the node into view; search and "Expand all" work, too */
export const Playground: Story = { name: 'Large tree (virtual)' };

const servers: TreeNode[] = Array.from({ length: 30 }, (_, index) => ({
    id: `server-${index + 1}`,
    label: `Server ${index + 1}`,
    icon: Folder,
    hasChildren: true,
}));
async function loadLogs(node: TreeNode): Promise<TreeNode[]> {
    await new Promise((done) => setTimeout(done, 600));
    return Array.from({ length: 20 }, (_, index) => ({
        id: `${node.id}-${index + 1}`,
        label: `${node.label} · Log ${index + 1}`,
        icon: FileText,
    }));
}

/** Folders whose files load when they open */
export const LazyChildren: Story = {
    name: 'Lazy-loaded children',
    render: (args) => <VirtualTree {...args} items={servers} loadChildren={loadLogs} className="w-80" />,
};
