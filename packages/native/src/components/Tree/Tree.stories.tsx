import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { FileText, Folder, Globe } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from '../Text/Text.js';
import { Tree, type TreeNode } from './Tree.js';

const items: TreeNode[] = [
    {
        id: 'europe',
        label: 'Europe',
        icon: Globe,
        children: [
            {
                id: 'de',
                label: 'Germany',
                children: [
                    { id: 'berlin', label: 'Berlin' },
                    { id: 'hamburg', label: 'Hamburg' },
                    { id: 'munich', label: 'Munich' },
                ],
            },
            {
                id: 'at',
                label: 'Austria',
                children: [
                    { id: 'vienna', label: 'Vienna' },
                    { id: 'graz', label: 'Graz' },
                ],
            },
            { id: 'ch', label: 'Switzerland', children: [{ id: 'zurich', label: 'Zurich' }] },
        ],
    },
    {
        id: 'north-america',
        label: 'North America',
        icon: Globe,
        children: [
            {
                id: 'usa',
                label: 'USA',
                children: [
                    { id: 'new-york', label: 'New York' },
                    { id: 'san-francisco', label: 'San Francisco' },
                ],
            },
            { id: 'canada', label: 'Canada', children: [{ id: 'toronto', label: 'Toronto' }] },
        ],
    },
    { id: 'asia', label: 'Asia', icon: Globe, disabled: true, children: [{ id: 'tokyo', label: 'Tokyo' }] },
];

const meta = {
    title: 'Data/Tree',
    component: Tree,
    args: { items, label: 'Locations', defaultExpandedValue: ['europe'] },
    argTypes: {
        selectionMode: { control: 'inline-radio', options: ['single', 'multiple'] },
        filterMode: { control: 'inline-radio', options: ['filter', 'highlight'] },
    },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Several nodes: each node is a checkbox */
export const Multiple: Story = {
    name: 'Multiple selection',
    args: {
        selectionMode: 'multiple',
        defaultSelectedValue: ['berlin', 'vienna'],
        defaultExpandedValue: ['europe', 'de', 'at'],
    },
};

function CheckboxDemo() {
    const [checked, setChecked] = useState<string[]>(['hamburg', 'at']);
    return (
        <View className="gap-3">
            <Tree
                items={items}
                label="Locations"
                checkable
                checkedValue={checked}
                onCheckedChange={setChecked}
                checkedStrategy="parent"
                defaultExpandedValue={['europe', 'de', 'at']}
            />
            <Text variant="muted">Selected: {checked.join(', ') || '–'}</Text>
        </View>
    );
}

/** Check boxes with cascade: a branch is checked when all its children are, partly checked (mixed) when some are */
export const Checkboxes: Story = { name: 'Checkboxes', render: () => <CheckboxDemo /> };

/** Check boxes without cascade (`checkStrictly`) */
export const CheckStrictly: Story = {
    name: 'Checkboxes without cascade',
    args: { checkable: true, checkStrictly: true, defaultCheckedValue: ['europe'], defaultExpandedValue: ['europe'] },
};

/** Search field and expand/collapse buttons: only the hits stay, with their ancestors opened */
export const Search: Story = {
    name: 'Search',
    args: { filter: true, expandControls: true, defaultExpandedValue: [] },
};

/** Search that keeps all nodes and marks the hits; the search key of the keyboard jumps to the next hit */
export const Highlight: Story = {
    name: 'Search with highlighting',
    args: {
        filter: true,
        filterMode: 'highlight',
        defaultExpandedValue: ['europe', 'de', 'at', 'north-america', 'usa'],
    },
};

const folders: TreeNode[] = [
    { id: 'projects', label: 'Projects', icon: Folder, hasChildren: true },
    { id: 'archive', label: 'Archive', icon: Folder, hasChildren: true },
    { id: 'readme', label: 'Readme.txt', icon: FileText },
];

const childrenOf = (node: TreeNode): TreeNode[] =>
    node.id === 'archive'
        ? [
              { id: 'archive/2024', label: '2024', icon: Folder, hasChildren: true },
              { id: 'archive/2025', label: '2025', icon: Folder, hasChildren: true },
          ]
        : node.id === 'projects'
          ? [
                { id: 'projects/website', label: 'Website', icon: Folder, hasChildren: true },
                { id: 'projects/app', label: 'App', icon: Folder, hasChildren: true },
                { id: 'projects/plan', label: 'Project plan.pdf', icon: FileText },
            ]
          : [
                { id: `${node.id}/quote`, label: 'Quote.pdf', icon: FileText },
                { id: `${node.id}/invoice`, label: 'Invoice.pdf', icon: FileText },
            ];

const abortError = () => Object.assign(new Error('Canceled'), { name: 'AbortError' });

function LazyDemo() {
    // "Archive" fails the first time – the retry row loads it again
    const failedOnce = useRef(false);
    const loadChildren = (node: TreeNode, { signal }: { signal: AbortSignal }) =>
        new Promise<TreeNode[]>((resolve, reject) => {
            const timer = setTimeout(() => {
                if (node.id === 'archive' && !failedOnce.current) {
                    failedOnce.current = true;
                    reject(new Error('Network error'));
                    return;
                }
                resolve(childrenOf(node));
            }, 800);
            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(abortError());
            });
        });
    return <Tree items={folders} label="Files" loadChildren={loadChildren} />;
}

/**
 * Children loaded when a folder opens (loadChildren, answer after 0.8 s): a loading row, announcements, and
 * "Archive" fails the first time – its retry row loads it again
 */
export const LazyLoading: Story = { name: 'Lazy loading', render: () => <LazyDemo /> };

const withChildren = (list: TreeNode[], id: string, children: TreeNode[]): TreeNode[] =>
    list.map((node) =>
        node.id === id
            ? { ...node, children }
            : node.children
              ? { ...node, children: withChildren(node.children, id, children) }
              : node
    );

function ManualDemo() {
    const [tree, setTree] = useState(folders.filter((node) => node.id !== 'archive'));
    return (
        <Tree
            items={tree}
            label="Files"
            checkable
            onLoadChildren={(node) =>
                setTimeout(() => setTree((before) => withChildren(before, node.id, childrenOf(node))), 800)
            }
        />
    );
}

/** The page adds the children itself (onLoadChildren) – with check boxes that cascade into loaded children */
export const ManualLoading: Story = { name: 'Loading by the page', render: () => <ManualDemo /> };

/** Own content per node (renderNode) and guide lines along open branches */
export const CustomNodes: Story = {
    name: 'Custom rendering',
    args: {
        showLines: true,
        defaultExpandedValue: ['europe', 'de', 'at'],
        renderNode: (node, state) => (
            <View className="min-w-0 flex-1 flex-row items-center justify-between gap-2">
                <Text className={state.branch ? 'font-sans-semibold' : undefined}>{node.label}</Text>
                {!!node.children?.length && <Text variant="muted">{node.children.length}</Text>}
            </View>
        ),
    },
};

export const Empty: Story = { name: 'Empty', args: { items: [], emptyText: 'No locations added yet' } };
