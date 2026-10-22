import { screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { moveTreeNode } from '@wirecore/wirelayer-recipes';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Trees and hierarchical selects: children loaded on demand, search, check box strategies, moves between trees

const files = () => [
    {
        id: 'documents',
        label: 'Documents',
        children: [
            { id: 'proposal', label: 'Proposal.pdf' },
            { id: 'contract', label: 'Contract.pdf' },
            { id: 'archive', label: 'Archive', children: [{ id: 'report', label: 'Report 2025.pdf' }] },
        ],
    },
    { id: 'images', label: 'Images', children: [{ id: 'logo', label: 'Logo.svg' }] },
    { id: 'notes', label: 'Notes.txt' },
];

/** A promise with its resolve/reject outside */
function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
}

describe.each(frameworks)('%s', (framework) => {
    const onChecked = framework === 'vue' ? 'onUpdate:checkedValue' : 'onCheckedChange';

    describe('Tree lazy children', () => {
        it('loads children when a node opens, shows the loading state and announces the result', async () => {
            const pending = deferred<{ id: string; label: string }[]>();
            const loadChildren = vi.fn<(node: { id: string }) => Promise<{ id: string; label: string }[]>>(
                () => pending.promise
            );
            await render(
                framework,
                el('Tree', {
                    label: 'Folder',
                    items: [{ id: 'server', label: 'Server', hasChildren: true }],
                    loadChildren,
                })
            );
            const server = screen.getByRole('treeitem', { name: 'Server' });
            await userEvent.click(within(server).getByText('Server'));
            expect(loadChildren).toHaveBeenCalledTimes(1);
            expect(loadChildren.mock.calls[0]![0]).toMatchObject({ id: 'server' });
            await waitFor(() => expect(server).toHaveAttribute('aria-busy', 'true'));
            expect(screen.getByText('Loading …')).toBeInTheDocument();
            expect(screen.getByRole('status')).toHaveTextContent('Server: Loading');
            pending.resolve([
                { id: 'web', label: 'web-01' },
                { id: 'db', label: 'db-01' },
            ]);
            expect(await screen.findByRole('treeitem', { name: 'web-01' })).toBeInTheDocument();
            expect(server).not.toHaveAttribute('aria-busy');
            expect(server).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('status')).toHaveTextContent('Server: 2 items loaded');
        });

        it('shows a retry row after an error; activating it loads again', async () => {
            let attempt = 0;
            const loadChildren = vi.fn(async () => {
                attempt++;
                if (attempt === 1) throw new Error('offline');
                return [{ id: 'web', label: 'web-01' }];
            });
            const onSelect = vi.fn();
            await render(
                framework,
                el('Tree', {
                    label: 'Folder',
                    items: [{ id: 'server', label: 'Server', leaf: false }],
                    loadChildren,
                    [framework === 'vue' ? 'onUpdate:selectedValue' : 'onSelectionChange']: onSelect,
                })
            );
            await userEvent.click(screen.getByText('Server'));
            const retry = await screen.findByRole('treeitem', { name: 'Loading failed – try again' });
            expect(screen.getByRole('status')).toHaveTextContent('Server could not be loaded');
            onSelect.mockClear();
            await userEvent.click(retry);
            expect(await screen.findByRole('treeitem', { name: 'web-01' })).toBeInTheDocument();
            expect(loadChildren).toHaveBeenCalledTimes(2);
            // The retry row is not selected
            expect(onSelect).not.toHaveBeenCalled();
        });

        it('without loadChildren asks the parent (loadChildren event)', async () => {
            const onLoadChildren = vi.fn();
            await render(
                framework,
                el('Tree', {
                    label: 'Folder',
                    items: [{ id: 'server', label: 'Server', hasChildren: true }],
                    onLoadChildren,
                })
            );
            await userEvent.click(screen.getByText('Server'));
            expect(onLoadChildren).toHaveBeenCalledWith(expect.objectContaining({ id: 'server' }));
            expect(screen.getByRole('treeitem', { name: 'Server' })).toHaveAttribute('aria-busy', 'true');
        });

        it('takes the children of a data source', async () => {
            const getChildren = vi.fn<
                (
                    parent: { id: string },
                    request: { signal: AbortSignal }
                ) => Promise<{ items: { id: string; label: string }[] }>
            >(async (parent) => ({ items: [{ id: `${parent.id}-1`, label: 'Kind 1' }] }));
            await render(
                framework,
                el('Tree', {
                    label: 'Folder',
                    items: [{ id: 'a', label: 'Folder A', hasChildren: true }],
                    dataSource: { getItems: async () => ({ items: [] }), getChildren },
                })
            );
            await userEvent.click(screen.getByText('Folder A'));
            expect(await screen.findByRole('treeitem', { name: 'Kind 1' })).toBeInTheDocument();
            expect(getChildren.mock.calls[0]![1].signal).toBeInstanceOf(AbortSignal);
        });

        it('a checked lazy branch passes its check to the loaded children', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('Tree', {
                    label: 'Folder',
                    checkable: true,
                    checkedStrategy: 'child',
                    items: [{ id: 'a', label: 'Folder A', hasChildren: true }],
                    loadChildren: async () => [{ id: 'a1', label: 'File 1' }],
                    [onChecked]: onChange,
                })
            );
            const folder = screen.getByRole('treeitem', { name: 'Folder A' });
            expect(folder).toHaveAttribute('aria-checked', 'false');
            folder.querySelector<HTMLElement>('[data-part="node-checkbox"]')!.click();
            await waitFor(() => expect(folder).toHaveAttribute('aria-checked', 'true'));
            expect(onChange).toHaveBeenLastCalledWith(['a']);
            await userEvent.click(within(folder).getByText('Folder A'));
            const child = await screen.findByRole('treeitem', { name: 'File 1' });
            expect(child).toHaveAttribute('aria-checked', 'true');
        });
    });

    describe('Tree search', () => {
        it('keeps the hits with their ancestors open, marks them and announces the count', async () => {
            await render(framework, el('Tree', { label: 'Files', items: files(), filter: true }));
            await userEvent.type(screen.getByRole('searchbox', { name: 'Search the tree' }), 'report');
            await waitFor(() => expect(screen.getAllByRole('treeitem')).toHaveLength(3));
            expect(screen.getByRole('treeitem', { name: /^Documents/ })).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByRole('treeitem', { name: 'Report 2025.pdf' }).querySelector('mark')).toHaveTextContent(
                'Report'
            );
            expect(screen.getByRole('status')).toHaveTextContent('1 match');
            await userEvent.clear(screen.getByRole('searchbox'));
            await waitFor(() => expect(screen.getByRole('treeitem', { name: 'Notes.txt' })).toBeInTheDocument());
            // The open nodes from before the search come back
            expect(screen.getByRole('treeitem', { name: /^Documents/ })).toHaveAttribute('aria-expanded', 'false');
        });

        it('highlight mode keeps every node; Enter jumps to the next hit', async () => {
            await render(
                framework,
                el('Tree', { label: 'Files', items: files(), filter: true, filterMode: 'highlight' })
            );
            const search = screen.getByRole('searchbox', { name: 'Search the tree' });
            await userEvent.type(search, 'pdf');
            await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('3 matches'));
            expect(screen.getByRole('treeitem', { name: 'Notes.txt' })).toBeInTheDocument();
            await userEvent.type(search, '{Enter}');
            await waitFor(() => expect(screen.getByRole('treeitem', { name: 'Proposal.pdf' })).toHaveFocus());
        });

        it('shows the empty text without hits', async () => {
            await render(framework, el('Tree', { label: 'Files', items: files(), filterValue: 'xyz' }));
            expect(screen.getByText('No matches', { selector: 'div' })).toBeInTheDocument();
            expect(screen.getByRole('tree', { hidden: true })).toHaveAttribute('hidden');
        });
    });

    describe('Tree check boxes', () => {
        it('checkStrictly checks only the node itself', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('Tree', {
                    label: 'Files',
                    items: files(),
                    checkable: true,
                    checkStrictly: true,
                    defaultExpandedValue: ['documents'],
                    [onChecked]: onChange,
                })
            );
            const folder = screen.getByRole('treeitem', { name: /^Documents/ });
            folder.querySelector<HTMLElement>('[data-part="node-checkbox"]')!.click();
            await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(['documents']));
            expect(folder).toHaveAttribute('aria-checked', 'true');
            expect(screen.getByRole('treeitem', { name: 'Proposal.pdf' })).toHaveAttribute('aria-checked', 'false');
        });

        it('reports the topmost checked nodes with checkedStrategy "parent"', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('Tree', {
                    label: 'Files',
                    items: files(),
                    checkable: true,
                    checkedStrategy: 'parent',
                    defaultExpandedValue: ['documents'],
                    defaultCheckedValue: ['proposal', 'contract'],
                    [onChecked]: onChange,
                })
            );
            const archive = screen.getByRole('treeitem', { name: /^Archive/ });
            archive.querySelector<HTMLElement>('[data-part="node-checkbox"]')!.click();
            await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(['documents']));
            expect(screen.getByRole('treeitem', { name: /^Documents/ })).toHaveAttribute('aria-checked', 'true');
        });

        it('Shift+click selects a range in multiple selection', async () => {
            const onSelect = vi.fn();
            await render(
                framework,
                el('Tree', {
                    label: 'Files',
                    items: files(),
                    selectionMode: 'multiple',
                    defaultExpandedValue: ['documents'],
                    [framework === 'vue' ? 'onUpdate:selectedValue' : 'onSelectionChange']: onSelect,
                })
            );
            const user = userEvent.setup();
            await user.click(screen.getByText('Proposal.pdf'));
            await user.keyboard('{Shift>}');
            await user.click(screen.getByText('Images'));
            await user.keyboard('{/Shift}');
            expect([...onSelect.mock.lastCall![0]].sort()).toEqual(['archive', 'contract', 'images', 'proposal']);
        });
    });

    describe('Tree expand all and moves between trees', () => {
        it('the buttons open and close every branch', async () => {
            const onExpanded = vi.fn();
            await render(
                framework,
                el('Tree', {
                    label: 'Files',
                    items: files(),
                    expandControls: true,
                    [framework === 'vue' ? 'onUpdate:expandedValue' : 'onExpandedChange']: onExpanded,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Expand all' }));
            expect(onExpanded).toHaveBeenLastCalledWith(['documents', 'archive', 'images']);
            expect(screen.getByRole('treeitem', { name: 'Report 2025.pdf' })).toBeVisible();
            await userEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
            expect(onExpanded).toHaveBeenLastCalledWith([]);
        });

        it('Ctrl+X in one tree and Ctrl+V in another (same group) reports a transfer', async () => {
            const onTransfer = vi.fn();
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('Tree', { label: 'Source', items: files(), group: 'folder', name: 'source' }),
                    el('Tree', {
                        label: 'Target',
                        items: [{ id: 'inbox', label: 'Inbox', children: [] }],
                        group: 'folder',
                        name: 'target',
                        onTransfer,
                    })
                )
            );
            screen.getByRole('treeitem', { name: 'Notes.txt' }).focus();
            await userEvent.keyboard('{Control>}x{/Control}');
            expect(
                within(screen.getByRole('tree', { name: 'Source' }).parentElement!).getByRole('status')
            ).toHaveTextContent('Notes.txt cut');
            const inbox = within(screen.getByRole('tree', { name: 'Target' })).getByRole('treeitem', {
                name: 'Inbox',
            });
            inbox.querySelector<HTMLElement>('[data-part="branch-control"]')!.focus();
            await userEvent.keyboard('{Control>}v{/Control}');
            expect(onTransfer).toHaveBeenCalledWith({
                node: expect.objectContaining({ id: 'notes' }),
                sourceTree: 'source',
                targetTree: 'target',
                parentId: 'inbox',
                index: 0,
            });
        });

        it('loadChildren: moves among loaded children carry the whole tree (moveTreeNode applies it)', async () => {
            const onMove = vi.fn();
            const loadChildren = async () => [
                { id: 'web', label: 'web-01' },
                { id: 'db', label: 'db-01' },
            ];
            const items = [
                { id: 'archive', label: 'Archive', hasChildren: true },
                { id: 'server', label: 'Server', hasChildren: true },
            ];
            await render(
                framework,
                el('Tree', {
                    label: 'Folder',
                    items,
                    reorderable: true,
                    defaultExpandedValue: ['server'],
                    loadChildren,
                    onMove,
                })
            );
            const db = await screen.findByRole('treeitem', { name: 'db-01' });
            db.focus();
            await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
            const move = onMove.mock.lastCall![0];
            expect(move).toMatchObject({ id: 'db', parentId: 'server', index: 0 });
            const next = moveTreeNode(items, move);
            expect(next[1]).toMatchObject({ id: 'server', children: [{ id: 'db' }, { id: 'web' }] });
            expect(next[0]).toEqual(items[0]);
        });

        it('allowDrop refuses a keyboard move', async () => {
            const onMove = vi.fn();
            await render(
                framework,
                el('Tree', {
                    label: 'Files',
                    items: files(),
                    reorderable: true,
                    allowDrop: (_source: unknown, target: { id: string } | null) => target?.id !== 'images',
                    onMove,
                })
            );
            screen.getByRole('treeitem', { name: 'Notes.txt' }).focus();
            await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
            expect(onMove).not.toHaveBeenCalled();
            expect(screen.getByRole('status')).toHaveTextContent('Not possible here');
        });
    });

    describe('TreeSelect', () => {
        const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';

        it('searches in the panel and chooses a hit', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('TreeSelect', { items: files(), 'aria-label': 'Folder', filter: true, [onValue]: onChange })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Folder: Select' }));
            await userEvent.type(await screen.findByRole('searchbox', { name: 'Search the tree' }), 'logo');
            await userEvent.click(await screen.findByText('Logo', { selector: 'mark' }));
            expect(onChange).toHaveBeenCalledWith('logo');
            await waitFor(() => expect(screen.getByRole('button', { name: 'Folder: Logo.svg' })).toBeInTheDocument());
        });

        it('multiple: chips with "+N", removing a chip and clearing', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('TreeSelect', {
                    items: files(),
                    'aria-label': 'Folder',
                    multiple: true,
                    maxShown: 1,
                    clearable: true,
                    defaultValue: ['proposal', 'logo'],
                    [onValue]: onChange,
                })
            );
            expect(screen.getByText('Proposal.pdf')).toBeInTheDocument();
            expect(screen.getByText('+1')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Remove Proposal.pdf' }));
            expect(onChange).toHaveBeenLastCalledWith(['logo']);
            await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
            expect(onChange).toHaveBeenLastCalledWith([]);
        });

        it('multiple: checking a branch reports it (checkedStrategy "parent")', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('TreeSelect', { items: files(), 'aria-label': 'Folder', multiple: true, [onValue]: onChange })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Folder: Select' }));
            const images = await screen.findByRole('treeitem', { name: /^Images/ });
            images.querySelector<HTMLElement>('[data-part="node-checkbox"]')!.click();
            await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(['images']));
        });
    });

    describe('CascadeSelect', () => {
        const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';
        const places = () => [
            {
                value: 'de',
                label: 'Germany',
                children: [
                    { value: 'muc', label: 'Munich' },
                    { value: 'fra', label: 'Frankfurt' },
                ],
            },
            { value: 'at', label: 'Austria', hasChildren: true },
        ];

        it('search: hits with their path, choosing one takes its value', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('CascadeSelect', { items: places(), 'aria-label': 'Location', filter: true, [onValue]: onChange })
            );
            await userEvent.type(screen.getByRole('combobox', { name: 'Location' }), 'mun');
            const hit = await screen.findByRole('option', { name: 'Germany › Munich' });
            await userEvent.click(hit);
            expect(onChange).toHaveBeenCalledWith('muc');
            await waitFor(() =>
                expect(screen.getByRole('combobox', { name: 'Location' })).toHaveValue('Germany › Munich')
            );
        });

        it('changeOnSelect: a level can be chosen itself', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('CascadeSelect', {
                    items: places(),
                    'aria-label': 'Location',
                    changeOnSelect: true,
                    [onValue]: onChange,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Location: Select' }));
            await userEvent.click(await screen.findByRole('menuitem', { name: 'Germany' }));
            await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Choose Germany' }));
            expect(onChange).toHaveBeenCalledWith('de');
        });

        it('loads the options of a level when it opens', async () => {
            const loadChildren = vi.fn(async () => [{ value: 'vie', label: 'Vienna' }]);
            await render(framework, el('CascadeSelect', { items: places(), 'aria-label': 'Location', loadChildren }));
            await userEvent.click(screen.getByRole('button', { name: 'Location: Select' }));
            await userEvent.click(await screen.findByRole('menuitem', { name: 'Austria' }));
            expect(await screen.findByRole('menuitemradio', { name: 'Vienna' })).toBeInTheDocument();
            expect(loadChildren).toHaveBeenCalledWith(
                expect.objectContaining({ value: 'at' }),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
        });

        it('object values with valueKey and a clear button', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('CascadeSelect', {
                    items: [
                        { value: { id: 1 }, label: 'One' },
                        { value: { id: 2 }, label: 'Two' },
                    ],
                    'aria-label': 'Number',
                    valueKey: 'id',
                    defaultValue: { id: 2 },
                    clearable: true,
                    [onValue]: onChange,
                })
            );
            expect(screen.getByRole('button', { name: 'Number: Two' })).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Number: Two' }));
            await userEvent.click(await screen.findByRole('menuitemradio', { name: 'One' }));
            expect(onChange).toHaveBeenLastCalledWith({ id: 1 });
            await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
            expect(onChange).toHaveBeenLastCalledWith(null);
        });
    });

    describe('OrgChart', () => {
        it('hides and shows a team, chooses nodes and loads a lazy team', async () => {
            const onSelected = vi.fn();
            const loadChildren = vi.fn(async () => [{ id: 'inside', label: 'Inside sales' }]);
            await render(
                framework,
                el('OrgChart', {
                    label: 'Org chart',
                    collapsible: true,
                    selectionMode: 'multiple',
                    loadChildren,
                    [framework === 'vue' ? 'onUpdate:selectedKeys' : 'onSelectedKeysChange']: onSelected,
                    node: {
                        id: 'management',
                        label: 'Management',
                        children: [
                            { id: 'development', label: 'Development', children: [{ label: 'Frontend' }] },
                            { id: 'sales', label: 'Sales', hasChildren: true },
                        ],
                    },
                })
            );
            const toggle = screen.getByRole('button', { name: 'Hide the team of Development' });
            expect(toggle).toHaveAttribute('aria-expanded', 'true');
            await userEvent.click(toggle);
            expect(screen.queryByText('Frontend')).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Show the team of Development' })).toHaveAttribute(
                'aria-expanded',
                'false'
            );
            await userEvent.click(screen.getByRole('button', { name: 'Management' }));
            await userEvent.click(screen.getByRole('button', { name: 'Sales' }));
            expect(onSelected).toHaveBeenLastCalledWith(['management', 'sales']);
            expect(screen.getByRole('button', { name: 'Management' })).toHaveAttribute('aria-pressed', 'true');
            await userEvent.click(screen.getByRole('button', { name: 'Show the team of Sales' }));
            expect(await screen.findByText('Inside sales')).toBeInTheDocument();
            expect(loadChildren).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'sales' }),
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            expect(screen.getByRole('status')).toHaveTextContent('Sales: 1 item loaded');
        });
    });
});
