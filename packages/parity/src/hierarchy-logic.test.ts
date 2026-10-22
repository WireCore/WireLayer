import {
    carouselBreakpoint,
    clampPan,
    createChildrenLoader,
    createDataList,
    DataKeyResolver,
    dataListAnnouncement,
    filterTree,
    flattenTree,
    isBranchNode,
    pinchZoom,
    pruneTree,
    searchCascade,
    stepZoom,
    swipeDirection,
    toggleTreeChecked,
    translations,
    treeBranchIds,
    treeCheckedValue,
    treeCheckStates,
    treeRetryId,
    treeRetryParent,
    withLoadedChildren,
    type DataRequest,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it, vi } from 'vitest';

interface Node {
    id: string;
    label: string;
    children?: Node[];
    hasChildren?: boolean;
    leaf?: boolean;
    disabled?: boolean;
}

const files: Node[] = [
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

describe('lazy children', () => {
    it('knows branches whose children load on demand', () => {
        expect(isBranchNode({ hasChildren: true })).toBe(true);
        expect(isBranchNode({ leaf: false })).toBe(true);
        expect(isBranchNode({})).toBe(false);
        expect(isBranchNode({ children: [] })).toBe(true);
    });

    it('puts loaded children into the items without touching the rest', () => {
        const items: Node[] = [
            { id: 'a', label: 'A', hasChildren: true },
            { id: 'b', label: 'B', children: [] },
        ];
        const next = withLoadedChildren(items, { a: [{ id: 'a1', label: 'A1', leaf: false }] });
        expect(next[0]!.children).toEqual([{ id: 'a1', label: 'A1', leaf: false }]);
        expect(next[1]).toBe(items[1]);
        // Nested: loaded children of a loaded node
        const deeper = withLoadedChildren(items, {
            a: [{ id: 'a1', label: 'A1', leaf: false }],
            a1: [{ id: 'a11', label: 'A11' }],
        });
        expect(deeper[0]!.children![0]!.children).toEqual([{ id: 'a11', label: 'A11' }]);
        expect(withLoadedChildren(items, {})).toBe(items);
    });

    it('loads once, reports errors, loads again on force and drops aborted answers', async () => {
        let fail = true;
        const load = vi.fn(async (node: Node, { signal }: { signal: AbortSignal }) => {
            await new Promise((done) => setTimeout(done, 5));
            if (signal.aborted) throw new DOMException('aborted', 'AbortError');
            if (fail) throw new Error('offline');
            return [{ id: `${node.id}-1`, label: 'Kind' }];
        });
        const states: string[] = [];
        const loader = createChildrenLoader<Node>({ load, onChange: (state) => states.push(state.status.a ?? '-') });
        const node = { id: 'a', label: 'A', hasChildren: true };
        await loader.load(node);
        expect(loader.current.status.a).toBe('error');
        expect(loader.current.errors.a).toBeInstanceOf(Error);
        fail = false;
        await loader.load(node, { force: true });
        expect(loader.current.status.a).toBe('loaded');
        expect(loader.current.children.a).toEqual([{ id: 'a-1', label: 'Kind' }]);
        await loader.load(node);
        expect(load).toHaveBeenCalledTimes(2);
        expect(states).toEqual(['loading', 'error', 'loading', 'loaded']);
        // Invalidate forgets, an abort while loading drops the answer
        loader.invalidate('a');
        expect(loader.current.status.a).toBeUndefined();
        const pending = loader.load(node);
        loader.abort('a');
        await pending;
        expect(loader.current.status.a).toBeUndefined();
        expect(loader.current.children.a).toBeUndefined();
    });

    it('names the retry row after its node', () => {
        expect(treeRetryParent(treeRetryId('documents'))).toBe('documents');
        expect(treeRetryParent('documents')).toBeUndefined();
    });
});

describe('tree search', () => {
    it('keeps the hits with their ancestors (opened) and descendants', () => {
        const result = filterTree(files, 'report', (node) => node.label);
        expect(result.matches).toEqual(['report']);
        expect(result.expand.sort()).toEqual(['archive', 'documents']);
        expect(pruneTree(files, result.visible)).toEqual([
            {
                id: 'documents',
                label: 'Documents',
                children: [{ id: 'archive', label: 'Archive', children: [{ id: 'report', label: 'Report 2025.pdf' }] }],
            },
        ]);
        // A matching branch keeps its children
        expect([...filterTree(files, 'images', (node) => node.label).visible!]).toEqual(['images', 'logo']);
    });

    it('ignores case and accents; highlight mode keeps every node', () => {
        const items: Node[] = [
            { id: 'm', label: 'Müller' },
            { id: 'x', label: 'Meier' },
        ];
        expect(filterTree(items, 'MULLER', (node) => node.label).matches).toEqual(['m']);
        const highlight = filterTree(files, '.pdf', (node) => node.label, 'highlight');
        expect(highlight.visible).toBeUndefined();
        expect(highlight.matches).toEqual(['proposal', 'contract', 'report']);
        expect(filterTree(files, '  ', (node) => node.label)).toEqual({ matches: [], visible: undefined, expand: [] });
    });

    it('lists branches and the visible rows with their position', () => {
        expect(treeBranchIds(files)).toEqual(['documents', 'archive', 'images']);
        const rows = flattenTree(files, ['documents']);
        expect(rows.map((row) => [row.node.id, row.level, row.posinset, row.setsize, row.expanded])).toEqual([
            ['documents', 1, 1, 3, true],
            ['proposal', 2, 1, 3, false],
            ['contract', 2, 2, 3, false],
            ['archive', 2, 3, 3, false],
            ['images', 1, 2, 3, false],
            ['notes', 1, 3, 3, false],
        ]);
        expect(rows[3]!.indexPath).toEqual([0, 2]);
        expect(rows[3]!.parentId).toBe('documents');
    });
});

describe('tree check boxes', () => {
    it('cascades: a branch checks its children, the parent follows when all are checked', () => {
        const checked = toggleTreeChecked(files, [], 'archive');
        expect(checked).toEqual(['archive', 'report']);
        const states = treeCheckStates(files, checked);
        expect(states.get('documents')).toBe('indeterminate');
        expect(states.get('archive')).toBe(true);
        const all = toggleTreeChecked(files, toggleTreeChecked(files, checked, 'proposal'), 'contract');
        expect(all).toEqual(['documents', 'proposal', 'contract', 'archive', 'report']);
        // Unchecking a child unchecks its ancestors
        expect(toggleTreeChecked(files, all, 'report')).toEqual(['proposal', 'contract']);
    });

    it('checkStrictly: parents and children are independent', () => {
        const checked = toggleTreeChecked(files, [], 'documents', true);
        expect(checked).toEqual(['documents']);
        const states = treeCheckStates(files, checked, true);
        expect(states.get('documents')).toBe(true);
        expect(states.get('proposal')).toBe(false);
    });

    it('reports by strategy: all, the topmost checked, only leaves', () => {
        const checked = ['documents'];
        expect(treeCheckedValue(files, checked, 'all')).toEqual([
            'documents',
            'proposal',
            'contract',
            'archive',
            'report',
        ]);
        expect(treeCheckedValue(files, checked, 'parent')).toEqual(['documents']);
        expect(treeCheckedValue(files, checked, 'child')).toEqual(['proposal', 'contract', 'report']);
        expect(treeCheckedValue(files, ['archive', 'logo'], 'parent')).toEqual(['archive', 'images']);
    });

    it('a lazy branch without loaded children keeps its own state', () => {
        const items: Node[] = [
            { id: 'a', label: 'A', hasChildren: true },
            { id: 'b', label: 'B' },
        ];
        expect(treeCheckStates(items, []).get('a')).toBe(false);
        expect(treeCheckStates(items, ['a']).get('a')).toBe(true);
        // Once loaded, the children of a checked branch are checked
        const loaded = withLoadedChildren(items, { a: [{ id: 'a1', label: 'A1' }] });
        expect(treeCheckedValue(loaded, ['a'], 'child')).toEqual(['a1']);
    });
});

interface Place {
    value: string;
    label: string;
    disabled?: boolean;
    children?: Place[];
}

describe('cascade search', () => {
    const places: Place[] = [
        {
            value: 'de',
            label: 'Germany',
            children: [
                { value: 'by', label: 'Bavaria', children: [{ value: 'muc', label: 'Munich' }] },
                { value: 'he', label: 'Hesse', children: [{ value: 'fra', label: 'Frankfurt', disabled: true }] },
            ],
        },
    ];
    it('finds selectable entries by the words of their path', () => {
        const hits = searchCascade(places, 'bav mun', (node) => node.label);
        expect(hits.map((hit) => hit.labels)).toEqual([['Germany', 'Bavaria', 'Munich']]);
        expect(searchCascade(places, 'frankfurt', (node) => node.label)).toEqual([]);
        expect(searchCascade(places, 'bavaria', (node) => node.label).map((hit) => hit.node.value)).toEqual(['muc']);
        expect(
            searchCascade(places, 'bavaria', (node) => node.label, { changeOnSelect: true }).map(
                (hit) => hit.node.value
            )
        ).toEqual(['by', 'muc']);
        expect(searchCascade(places, '', (node) => node.label)).toEqual([]);
    });
});

describe('growing lists from a data source', () => {
    const people = Array.from({ length: 23 }, (_, index) => `Person ${index + 1}`);
    const source = {
        getItems: vi.fn(async ({ page = 1, pageSize = 10, search = '' }: DataRequest) => {
            const found = people.filter((name) => name.includes(search));
            return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
        }),
    };

    it('appends pages until all are loaded and starts over for a search', async () => {
        const list = createDataList({ source, pageSize: 10 });
        await list.open();
        expect(list.current.items).toHaveLength(10);
        expect(list.current.hasMore).toBe(true);
        await list.loadMore();
        await list.loadMore();
        expect(list.current.items).toHaveLength(23);
        expect(list.current.hasMore).toBe(false);
        await list.search('Person 2', { debounce: false });
        expect(list.current.items).toEqual(['Person 2', 'Person 20', 'Person 21', 'Person 22', 'Person 23']);
        expect(dataListAnnouncement(list.current, translations, 'en-US')).toBe('5 items loaded');
    });

    it('continues by cursor and waits for a minimum search length', async () => {
        const getItems = vi.fn(async ({ cursor }: DataRequest) =>
            cursor ? { items: ['c', 'd'] } : { items: ['a', 'b'], nextCursor: 'next' }
        );
        const list = createDataList<string>({ source: { getItems }, pageSize: 2, minSearchLength: 2 });
        await list.search('a', { debounce: false });
        expect(list.current.tooShort).toBe(true);
        expect(getItems).not.toHaveBeenCalled();
        expect(dataListAnnouncement(list.current, translations, 'en-US', 2)).toBe('Please enter at least 2 characters');
        await list.search('ab', { debounce: false });
        expect(list.current.hasMore).toBe(true);
        await list.loadMore();
        expect(getItems.mock.calls[1]![0].cursor).toBe('next');
        expect(list.current.items).toEqual(['a', 'b', 'c', 'd']);
        expect(list.current.hasMore).toBe(false);
    });

    it('keeps the items when the next page fails, and retries', async () => {
        let fail = false;
        const list = createDataList<number>({
            source: {
                getItems: async ({ page = 1 }) => {
                    if (fail) throw new Error('offline');
                    return { items: [page], hasMore: page < 2 };
                },
            },
        });
        await list.open();
        fail = true;
        await list.loadMore();
        expect(list.current.status).toBe('error');
        expect(list.current.items).toEqual([1]);
        fail = false;
        await list.retry();
        expect(list.current.items).toEqual([1, 2]);
    });

    it('finds the items of keys once each', async () => {
        const getItemsByKeys = vi.fn(async (keys: string[]) =>
            keys.map((key) => ({ value: key, label: key.toUpperCase() }))
        );
        const onChange = vi.fn();
        const resolver = new DataKeyResolver<{ value: string; label: string }>({
            source: { getItems: async () => ({ items: [] }), getItemsByKeys },
            onChange,
        });
        await resolver.resolve(['a', 'b']);
        await resolver.resolve(['a', 'c']);
        expect(getItemsByKeys.mock.calls.map((call) => call[0])).toEqual([['a', 'b'], ['c']]);
        expect(resolver.items.map((item) => item.label)).toEqual(['A', 'B', 'C']);
        expect(onChange).toHaveBeenCalledTimes(2);
    });
});

describe('media logic', () => {
    it('zooms in steps within the limits and pinches relative to the start', () => {
        expect(stepZoom(1, 1)).toBe(1.5);
        expect(stepZoom(1, -1)).toBe(1);
        expect(stepZoom(5, 1)).toBe(5);
        expect(pinchZoom(2, 100, 150)).toBe(3);
        expect(pinchZoom(2, 100, 10)).toBe(1);
    });

    it('keeps a zoomed picture covering the stage', () => {
        const image = { width: 400, height: 300 };
        const stage = { width: 400, height: 300 };
        expect(clampPan({ x: 500, y: -500 }, 2, image, stage)).toEqual({ x: 200, y: -150 });
        expect(clampPan({ x: 50, y: 50 }, 1, image, stage)).toEqual({ x: 0, y: 0 });
    });

    it('tells swipes from taps and vertical moves, mirrored right-to-left', () => {
        expect(swipeDirection(-80, 5)).toBe(1);
        expect(swipeDirection(80, 5)).toBe(-1);
        expect(swipeDirection(80, 5, true)).toBe(1);
        expect(swipeDirection(30, 0)).toBe(0);
        expect(swipeDirection(80, 70)).toBe(0);
    });

    it('takes the settings of every breakpoint the width reaches', () => {
        const breakpoints = [
            { minWidth: 900, slidesPerPage: 3 },
            { minWidth: 600, slidesPerPage: 2, spacing: '8px' },
        ];
        expect(carouselBreakpoint(500, { slidesPerPage: 1 }, breakpoints)).toEqual({ slidesPerPage: 1 });
        expect(carouselBreakpoint(700, { slidesPerPage: 1 }, breakpoints)).toEqual({
            slidesPerPage: 2,
            spacing: '8px',
        });
        expect(carouselBreakpoint(1000, { slidesPerPage: 1 }, breakpoints)).toEqual({
            slidesPerPage: 3,
            spacing: '8px',
        });
    });
});
