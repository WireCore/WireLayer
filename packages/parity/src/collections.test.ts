import { screen, waitFor, within } from '@testing-library/dom';
import { act, render as renderReact } from '@testing-library/react';
import { render as renderVue } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import * as React from '@wirecore/wirelayer-react';
import type { DataRequest } from '@wirecore/wirelayer-recipes';
import * as Vue from '@wirecore/wirelayer-vue';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref, type Component } from 'vue';
import { el, frameworks, render } from './harness.js';

// Collections with server data: DataView, VirtualList, Listbox and the selects with a data source

const servers = Array.from({ length: 23 }, (_, index) => `server-${String(index + 1).padStart(2, '0')}`);
/** A paged source over the servers; `fail` makes the next request fail */
function serverSource() {
    // `gate`: the answers wait until the test opens it (instead of 20 ms) – for states while loading
    const state = { fail: false, gate: undefined as Promise<void> | undefined };
    const getItems = vi.fn(async ({ page = 1, pageSize = 10, search = '' }: DataRequest) => {
        await (state.gate ?? new Promise((done) => setTimeout(done, 20)));
        if (state.fail) throw new Error('offline');
        const found = servers.filter((name) => name.includes(search));
        return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
    });
    return { source: { getItems }, getItems, state };
}
const itemContent = {
    item: {
        react: 'children',
        args: (item: string) => ({ item }),
        render: ({ item }: { item: string }) => el('span', {}, item),
    },
};

describe.each(frameworks)('%s', (framework) => {
    describe('DataView with server data', () => {
        it('loads page by page from a data source and announces it', async () => {
            const { source, getItems } = serverSource();
            await render(
                framework,
                el('DataView', {
                    label: 'Server',
                    layoutToggle: false,
                    dataSource: source,
                    pageSize: 5,
                    $scoped: itemContent,
                })
            );
            expect(await screen.findByText('server-01')).toBeInTheDocument();
            expect(within(screen.getByRole('list', { name: 'Server' })).getAllByRole('listitem')).toHaveLength(5);
            expect(screen.getByRole('status')).toHaveTextContent('23 items loaded');
            await userEvent.click(screen.getByRole('button', { name: /Page 2/ }));
            expect(await screen.findByText('server-06')).toBeInTheDocument();
            expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2, pageSize: 5 }));
        });

        it('shows placeholders while the first page loads, an error with a retry button', async () => {
            const { source, state, getItems } = serverSource();
            state.fail = true;
            // The first answer waits – on a slow machine 20 ms were over before the placeholders were checked
            let answer!: () => void;
            state.gate = new Promise((done) => (answer = done));
            await render(
                framework,
                el('DataView', {
                    label: 'Server',
                    layoutToggle: false,
                    dataSource: source,
                    pageSize: 5,
                    $scoped: itemContent,
                })
            );
            expect(screen.getByRole('list', { name: 'Server' })).toHaveAttribute('aria-busy', 'true');
            state.gate = undefined;
            answer();
            const alert = await screen.findByRole('alert');
            expect(alert).toHaveTextContent('The data could not be loaded.');
            state.fail = false;
            await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
            expect(await screen.findByText('server-01')).toBeInTheDocument();
            expect(getItems).toHaveBeenCalledTimes(2);
        });

        it('manual: the parent pages, the pagination reports the page', async () => {
            const onPage = vi.fn();
            await render(
                framework,
                el('DataView', {
                    label: 'Server',
                    layoutToggle: false,
                    items: ['server-01', 'server-02'],
                    manual: true,
                    totalCount: 6,
                    pageSize: 2,
                    [framework === 'vue' ? 'onUpdate:page' : 'onPageChange']: onPage,
                    $scoped: itemContent,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: /Page 3/ }));
            expect(onPage).toHaveBeenCalledWith(3);
            // The items stay as given (the parent loads the page)
            expect(screen.getByText('server-01')).toBeInTheDocument();
        });

        it('infinite: "Load more" appends the next page', async () => {
            const { source } = serverSource();
            await render(
                framework,
                el('DataView', {
                    label: 'Server',
                    layoutToggle: false,
                    dataSource: source,
                    pageSize: 10,
                    loadMode: 'infinite',
                    $scoped: itemContent,
                })
            );
            expect(await screen.findByText('server-10')).toBeInTheDocument();
            expect(screen.getByText('10 of 23 shown')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
            expect(await screen.findByText('server-20')).toBeInTheDocument();
            expect(screen.getByText('server-01')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
            expect(await screen.findByText('server-23')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
        });

        it('a search in the query starts over and shows the no-results text', async () => {
            const { source, getItems } = serverSource();
            const view = (search: string) =>
                el('DataView', {
                    label: 'Server',
                    layoutToggle: false,
                    dataSource: source,
                    pageSize: 5,
                    query: { search },
                    $scoped: itemContent,
                });
            await render(framework, el('div', {}, view('nothing')));
            expect(await screen.findByText('No results')).toBeInTheDocument();
            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ search: 'nothing', page: 1 }));
        });
    });

    describe('option lists with a data source', () => {
        const people = Array.from({ length: 30 }, (_, index) => ({
            value: `p${index + 1}`,
            label: `Person ${index + 1}`,
        }));
        function peopleSource() {
            const getItems = vi.fn(async ({ page = 1, pageSize = 50, search = '' }: DataRequest) => {
                const found = people.filter((person) => person.label.includes(search));
                return { items: found.slice((page - 1) * pageSize, page * pageSize), totalCount: found.length };
            });
            const getItemsByKeys = vi.fn(async (keys: string[]) =>
                people.filter((person) => keys.includes(person.value))
            );
            return { source: { getItems, getItemsByKeys }, getItems, getItemsByKeys };
        }
        const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';

        it('Select: a preselected value gets its label by key, opening loads the first page', async () => {
            const { source, getItems, getItemsByKeys } = peopleSource();
            const onChange = vi.fn();
            await render(
                framework,
                el('Select', {
                    items: [],
                    'aria-label': 'Person',
                    dataSource: source,
                    pageSize: 10,
                    defaultValue: 'p25',
                    [onValue]: onChange,
                })
            );
            await waitFor(() =>
                expect(screen.getByRole('combobox', { name: 'Person' })).toHaveTextContent('Person 25')
            );
            expect(getItemsByKeys).toHaveBeenCalledWith(
                ['p25'],
                expect.objectContaining({ signal: expect.any(AbortSignal) })
            );
            expect(getItems).not.toHaveBeenCalled();
            await userEvent.click(screen.getByRole('combobox', { name: 'Person' }));
            await userEvent.click(await screen.findByRole('option', { name: 'Person 3' }));
            expect(onChange).toHaveBeenCalledWith('p3');
            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }));
        });

        it('MultiSelect: the search field asks the source after the typing pause', async () => {
            const { source, getItems } = peopleSource();
            await render(
                framework,
                el('MultiSelect', { items: [], 'aria-label': 'People', filter: true, dataSource: source })
            );
            await userEvent.click(screen.getByRole('combobox', { name: 'People' }));
            await screen.findByRole('option', { name: 'Person 1' });
            await userEvent.type(screen.getByRole('combobox', { name: 'Filter options' }), '17');
            await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
            expect(screen.getByRole('option', { name: 'Person 17' })).toBeInTheDocument();
            // One request for the first page, one after the pause – not one per key
            expect(getItems.mock.calls.map((call) => call[0].search ?? '')).toEqual(['', '17']);
        });

        it('Combobox: a minimum search length, then the hits of the source', async () => {
            const { source } = peopleSource();
            await render(
                framework,
                el('Combobox', { items: [], 'aria-label': 'Person', dataSource: source, minSearchLength: 2 })
            );
            const input = screen.getByRole('combobox', { name: 'Person' });
            await userEvent.type(input, '3');
            await waitFor(() =>
                expect(screen.getByRole('status')).toHaveTextContent('Please enter at least 2 characters')
            );
            await userEvent.type(input, '0');
            expect(await screen.findByRole('option', { name: 'Person 30' })).toBeInTheDocument();
        });

        it('Listbox: loads at once, check boxes and "Select all"', async () => {
            const { source } = peopleSource();
            const onChange = vi.fn();
            await render(
                framework,
                el('Listbox', {
                    items: [],
                    label: 'People',
                    multiple: true,
                    checkboxes: true,
                    selectAll: true,
                    dataSource: source,
                    pageSize: 5,
                    [onValue]: onChange,
                })
            );
            expect(await screen.findByRole('option', { name: 'Person 5' })).toBeInTheDocument();
            const all = screen.getByRole('checkbox', { name: 'Select all' });
            expect(all).toHaveAttribute('aria-checked', 'false');
            await userEvent.click(all);
            expect(onChange).toHaveBeenLastCalledWith(['p1', 'p2', 'p3', 'p4', 'p5']);
            expect(all).toHaveAttribute('aria-checked', 'true');
        });

        it('Autocomplete: suggestions from the source for the typed text', async () => {
            const { source } = peopleSource();
            await render(
                framework,
                el('Autocomplete', { items: [], 'aria-label': 'Name', dataSource: source, itemLabel: 'label' })
            );
            // Typed with pauses: fast typing overtakes Ark's sync of the field in jsdom (see docs/implementation-notes.md)
            await userEvent.setup({ delay: 20 }).type(screen.getByRole('combobox', { name: 'Name' }), 'Person 2');
            expect(await screen.findByRole('option', { name: 'Person 22' })).toBeInTheDocument();
        });
    });

    describe('VirtualList', () => {
        it('asks for more near the end (hasMore): loadMore, and endReached as before', async () => {
            const onEndReached = vi.fn();
            const onLoadMore = vi.fn();
            await render(
                framework,
                el('VirtualList', {
                    items: ['a', 'b', 'c'],
                    label: 'Log',
                    hasMore: true,
                    onLoadMore,
                    onEndReached,
                    children: () => null,
                })
            );
            await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
            expect(onEndReached).toHaveBeenCalledTimes(1);
        });

        it('fills itself from a data source while scrolling', async () => {
            const { source, getItems } = serverSource();
            await render(
                framework,
                el('VirtualList', {
                    label: 'Server',
                    dataSource: source,
                    pageSize: 10,
                    $scoped: {
                        default: {
                            react: 'children',
                            args: (item: string, index: number) => ({ item, index }),
                            render: ({ item }: { item: string }) => el('span', {}, item),
                        },
                    },
                })
            );
            // jsdom has no layout, so the rows themselves are tested in the browser (collections.spec.ts)
            await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('23 items loaded'));
            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 10 }));
        });
    });

    describe('PickList and OrderList', () => {
        const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';
        const people = [
            { id: 1, name: 'Julia Klein' },
            { id: 2, name: 'Max Schulz' },
            { id: 3, name: 'Ana Lopez' },
        ];
        const dataTransfer = () => ({ setData: vi.fn(), getData: vi.fn(), effectAllowed: '', dropEffect: '' });

        it('objects as values; "Select all" and the button move them', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('PickList', {
                    items: people,
                    itemValue: (person: unknown) => person,
                    itemLabel: 'name',
                    valueKey: 'id',
                    selectAll: true,
                    [onValue]: onChange,
                })
            );
            const source = screen.getByRole('listbox', { name: 'Available' });
            await userEvent.click(screen.getAllByRole('checkbox', { name: 'Select all' })[0]!);
            expect(within(source).getAllByRole('option', { selected: true })).toHaveLength(3);
            await userEvent.click(screen.getByRole('button', { name: 'Add selected' }));
            expect(onChange).toHaveBeenLastCalledWith(people);
            expect(screen.getByRole('status')).toHaveTextContent('3 items moved to “Selected”');
        });

        it('manualFilter: the source list is searched on the server; chosen items keep their labels', async () => {
            const onFilterChange = vi.fn();
            const onChange = vi.fn();
            const props = (items: typeof people) => ({
                items,
                itemValue: 'id',
                itemLabel: 'name',
                filter: true,
                manualFilter: true,
                onFilterChange,
                [onValue]: onChange,
            });
            let update: (items: typeof people) => Promise<void>;
            if (framework === 'vue') {
                const items = ref(people);
                renderVue({ render: () => h(Vue.PickList as Component, props(items.value)) });
                update = async (next) => {
                    items.value = next;
                    await nextTick();
                };
            } else {
                const view = renderReact(createElement(React.PickList as never, props(people)));
                update = (next) => act(async () => view.rerender(createElement(React.PickList as never, props(next))));
            }
            const source = screen.getByRole('listbox', { name: 'Available' });
            await userEvent.type(screen.getAllByRole('textbox', { name: 'Filter options' })[0]!, 'ana');
            expect(onFilterChange).toHaveBeenLastCalledWith('ana');
            // Not filtered here – the server answers
            expect(within(source).getAllByRole('option')).toHaveLength(3);
            await update([people[2]!]);
            await userEvent.click(within(source).getByRole('option', { name: 'Ana Lopez' }));
            await userEvent.click(screen.getByRole('button', { name: 'Add selected' }));
            expect(onChange).toHaveBeenLastCalledWith([3]);
            await update([people[0]!, people[1]!]);
            expect(
                within(screen.getByRole('listbox', { name: 'Selected' })).getByRole('option', { name: 'Ana Lopez' })
            ).toBeInTheDocument();
        });

        it('dragging an item to the other list moves it', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('PickList', {
                    items: people,
                    itemValue: 'id',
                    itemLabel: 'name',
                    draggable: true,
                    [onValue]: onChange,
                })
            );
            const option = screen.getByRole('option', { name: 'Ana Lopez' });
            expect(option).toHaveAttribute('draggable', 'true');
            const target = screen.getByRole('listbox', { name: 'Selected' });
            const transfer = dataTransfer();
            const { fireEvent } = await import('@testing-library/dom');
            fireEvent.dragStart(option, { dataTransfer: transfer });
            fireEvent.dragOver(target, { dataTransfer: transfer });
            fireEvent.drop(target, { dataTransfer: transfer });
            await waitFor(() => expect(onChange).toHaveBeenCalledWith([3]));
        });

        it('OrderList: objects, a search field and moving by drag and drop', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('OrderList', {
                    label: 'Steps',
                    itemValue: 'id',
                    itemLabel: 'name',
                    defaultValue: people,
                    filter: true,
                    draggable: true,
                    [onValue]: onChange,
                })
            );
            expect(screen.getByRole('textbox', { name: 'Filter options' })).toBeInTheDocument();
            const { fireEvent } = await import('@testing-library/dom');
            const transfer = dataTransfer();
            fireEvent.dragStart(screen.getByRole('option', { name: 'Ana Lopez' }), { dataTransfer: transfer });
            const first = screen.getByRole('option', { name: 'Julia Klein' });
            fireEvent.dragOver(first, { dataTransfer: transfer });
            fireEvent.drop(first, { dataTransfer: transfer });
            await waitFor(() => expect(onChange).toHaveBeenCalledWith([people[2], people[0], people[1]]));
            expect(screen.getByRole('status')).toHaveTextContent('Ana Lopez: position 1 of 3');
        });
    });

    describe('Timeline feed', () => {
        it('articles in a feed: Page Down moves on, the button asks for older events', async () => {
            const onLoadMore = vi.fn();
            await render(
                framework,
                el('Timeline', {
                    label: 'Activities',
                    feed: true,
                    hasMore: true,
                    onLoadMore,
                    items: [
                        { time: 'Oct 21, 2026', title: 'Ticket closed' },
                        { time: 'Oct 20, 2026', title: 'Comment' },
                    ],
                })
            );
            const feed = screen.getByRole('feed', { name: 'Activities' });
            const [first, second] = within(feed).getAllByRole('article');
            expect(first).toHaveAccessibleName('Ticket closed');
            expect(first).toHaveAttribute('aria-setsize', '-1');
            first!.focus();
            await userEvent.keyboard('{PageDown}');
            expect(second).toHaveFocus();
            await userEvent.click(screen.getByRole('button', { name: 'Load older entries' }));
            expect(onLoadMore).toHaveBeenCalledTimes(1);
        });
    });
});
