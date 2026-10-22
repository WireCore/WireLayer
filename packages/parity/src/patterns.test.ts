import { screen, waitFor, within } from '@testing-library/dom';
import { act, cleanup as cleanupReact, render as renderReact } from '@testing-library/react';
import { cleanup as cleanupVue, render as renderVue } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import * as React from '@wirecore/wirelayer-react';
import { announcer, hotkeyRegistry } from '@wirecore/wirelayer-recipes';
import * as Vue from '@wirecore/wirelayer-vue';
import { createElement, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { advancedFilterEditor, el, frameworks, normalize, render, type El, type Framework } from './harness.js';

// Display, accessibility building blocks and form patterns: toggletip, announcements, landmarks, shortcuts,
// inline editing, search, filters, condition builder, groups of checkboxes and switches, wizard – in Vue and React

const tick = (ms = 0) => act(() => new Promise((done) => setTimeout(done, ms)));

afterEach(() => {
    announcer.reset();
});

/** The whole page with the open overlay (portals are outside the render container) */
async function openDom(framework: Framework, node: El, ready: string) {
    document.body.innerHTML = '';
    await render(framework, node);
    await waitFor(() => expect(document.body.querySelector(ready)).not.toBeNull());
    await tick(20);
    const dom = normalize(document.body);
    if (framework === 'vue') cleanupVue();
    else cleanupReact();
    return dom;
}

describe('open overlays render the same DOM', () => {
    const cases: [string, El, string][] = [
        [
            'InlineEdit popover open',
            el('InlineEdit', { label: 'Project name', defaultValue: 'Portal', mode: 'popover', editing: true }),
            '[role=dialog]',
        ],
    ];
    it.each(cases)('%s', async (_, node, ready) => {
        expect(await openDom('vue', node, ready)).toBe(await openDom('react', node, ready));
    });
});

const conditionFields = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'load', label: 'Load', type: 'number' },
    { id: 'online', label: 'Online', type: 'boolean' },
];

describe.each(frameworks)('%s', (framework) => {
    /** The v-model listener in Vue, onValueChange in React */
    const onModel = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';

    describe('Toggletip', () => {
        it('shows the text in a live region on click; Escape and a click outside close it, the focus stays', async () => {
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('Toggletip', { content: 'Printed on every invoice.', label: 'VAT ID' }),
                    el('p', {}, 'Outside')
                )
            );
            const button = screen.getByRole('button', { name: 'More information about VAT ID' });
            const status = screen.getByRole('status');
            expect(status).toBeEmptyDOMElement();
            await userEvent.click(button);
            expect(button).toHaveAttribute('aria-expanded', 'true');
            expect(status).toHaveTextContent('Printed on every invoice.');
            await userEvent.keyboard('{Escape}');
            expect(status).toBeEmptyDOMElement();
            expect(button).toHaveFocus();
            await userEvent.click(button);
            await userEvent.click(screen.getByText('Outside'));
            expect(status).toBeEmptyDOMElement();
        });

        it('Field labelHelp: the button sits next to the label, the label still names the input', async () => {
            await render(
                framework,
                el('Field', { label: 'VAT ID', labelHelp: 'Printed on every invoice.' }, el('Input', {}))
            );
            expect(screen.getByRole('textbox', { name: 'VAT ID' })).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'More information about VAT ID' }));
            expect(screen.getByRole('status')).toHaveTextContent('Printed on every invoice.');
        });
    });

    describe('LiveAnnouncer', () => {
        it('announce() writes into the regions of a LiveAnnouncer – debounced, the last message wins', async () => {
            await render(framework, el('LiveAnnouncer', {}, el('p', {}, 'Contents')));
            const polite = screen.getByRole('status');
            const assertive = screen.getByRole('alert');
            const lib = framework === 'vue' ? Vue : React;
            lib.announce('First');
            lib.announce('Saved');
            lib.announce('Error', { politeness: 'assertive' });
            expect(polite).toBeEmptyDOMElement();
            await waitFor(() => expect(polite).toHaveTextContent('Saved'));
            expect(assertive).toHaveTextContent('Error');
            // The same text again is announced again (the region is emptied first)
            lib.announce('Saved');
            expect(polite).toBeEmptyDOMElement();
            await waitFor(() => expect(polite).toHaveTextContent('Saved'));
        });

        it('without a LiveAnnouncer the regions are added to <body>', async () => {
            await render(framework, el('p', {}, 'Contents'));
            (framework === 'vue' ? Vue : React).announce('Hello');
            await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Hello'));
            expect(document.querySelector('[data-wc-announcer]')?.parentElement).toBe(document.body);
        });
    });

    describe('LandmarkNavigation', () => {
        it('F6 and Shift+F6 move the focus between the landmarks; skip links are left out', async () => {
            await render(
                framework,
                el(
                    'LandmarkNavigation',
                    {},
                    el('SkipLinks', { links: [{ href: '#inhalt', label: 'Skip to content' }] }),
                    el('header', {}, el('button', {}, 'Menu')),
                    el('nav', { 'aria-label': 'Main navigation' }, el('a', { href: '/a' }, 'A')),
                    el('main', { id: 'inhalt' }, el('button', {}, 'Save')),
                    el('aside', { 'aria-label': 'Help' }, 'Tips')
                )
            );
            screen.getByRole('button', { name: 'Menu' }).focus();
            await userEvent.keyboard('{F6}');
            expect(screen.getByRole('navigation', { name: 'Main navigation' })).toHaveFocus();
            await userEvent.keyboard('{F6}');
            expect(screen.getByRole('main')).toHaveFocus();
            await userEvent.keyboard('{F6}');
            expect(screen.getByRole('complementary', { name: 'Help' })).toHaveFocus();
            // Wraps around to the header; Shift+F6 goes back
            await userEvent.keyboard('{F6}');
            expect(screen.getByRole('banner')).toHaveFocus();
            await userEvent.keyboard('{Shift>}{F6}{/Shift}');
            expect(screen.getByRole('complementary', { name: 'Help' })).toHaveFocus();
        });

        it('SkipLinks: a named navigation of links; AppShell adds its own link first', async () => {
            await render(
                framework,
                el('AppShell', { skipLinks: [{ href: '#search', label: 'Skip to search' }] }, 'Contents')
            );
            const nav = screen.getByRole('navigation', { name: 'Skip links' });
            const links = within(nav).getAllByRole('link');
            expect(links.map((link) => link.textContent)).toEqual(['Skip to content', 'Skip to search']);
            expect(links[0]!.getAttribute('href')).toBe(`#${screen.getByRole('main').id}`);
        });
    });

    describe('Hotkeys', () => {
        /** A component with shortcuts (useHotkeys) and a text field */
        async function mountShortcuts(handlers: { save: () => void; help: () => void; inbox: () => void }) {
            if (framework === 'vue') {
                const Comp = defineComponent({
                    setup() {
                        Vue.useHotkeys([
                            ['mod+s', handlers.save, { description: 'Save', group: 'File' }],
                            ['h', handlers.help, { description: 'Help' }],
                            ['g i', handlers.inbox, { description: 'Go to inbox' }],
                        ]);
                        return () => h('div', [h('input', { 'aria-label': 'Note' }), h(Vue.HotkeysDialog)]);
                    },
                });
                renderVue(Comp);
            } else {
                const Comp = () => {
                    React.useHotkeys([
                        ['mod+s', handlers.save, { description: 'Save', group: 'File' }],
                        ['h', handlers.help, { description: 'Help' }],
                        ['g i', handlers.inbox, { description: 'Go to inbox' }],
                    ]);
                    return createElement(
                        'div',
                        null,
                        createElement('input', { 'aria-label': 'Note' }),
                        createElement(React.HotkeysDialog)
                    );
                };
                renderReact(createElement(Comp));
            }
            await tick();
        }

        it('runs shortcuts and sequences; plain keys are typing inside a text field, Ctrl/⌘ shortcuts are not', async () => {
            const save = vi.fn();
            const help = vi.fn();
            const inbox = vi.fn();
            await mountShortcuts({ save, help, inbox });
            await userEvent.keyboard('h');
            expect(help).toHaveBeenCalledTimes(1);
            await userEvent.keyboard('{Control>}s{/Control}');
            expect(save).toHaveBeenCalledTimes(1);
            await userEvent.keyboard('gi');
            expect(inbox).toHaveBeenCalledTimes(1);
            const input = screen.getByRole('textbox', { name: 'Note' });
            await userEvent.click(input);
            await userEvent.keyboard('hgi');
            expect(help).toHaveBeenCalledTimes(1);
            expect(inbox).toHaveBeenCalledTimes(1);
            expect(input).toHaveValue('hgi');
            await userEvent.keyboard('{Control>}s{/Control}');
            expect(save).toHaveBeenCalledTimes(2);
        });

        it('"?" opens the HotkeysDialog with the registered shortcuts, grouped, keys shown per platform', async () => {
            await mountShortcuts({ save: vi.fn(), help: vi.fn(), inbox: vi.fn() });
            await userEvent.keyboard('?');
            const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
            expect(within(dialog).getByRole('heading', { name: 'File' })).toBeInTheDocument();
            const terms = within(dialog)
                .getAllByRole('term')
                .map((term) => term.textContent);
            expect(terms).toEqual(expect.arrayContaining(['Save', 'Help', 'Go to inbox', 'Show keyboard shortcuts']));
            const save = within(dialog).getByText('Save').closest('div')!;
            expect([...save.querySelectorAll('kbd kbd')].map((key) => key.textContent)).toEqual(['Ctrl', 'S']);
            const inbox = within(dialog).getByText('Go to inbox').closest('div')!;
            expect(inbox.querySelector('dd')).toHaveTextContent(/G\s*then\s*I/);
        });

        it('unregisters with the component; the CommandPalette registers its shortcut centrally', async () => {
            const before = hotkeyRegistry.list({ all: true }).length;
            await render(framework, el('CommandPalette', { items: [] }));
            const entries = hotkeyRegistry.list();
            expect(entries.some((entry) => entry.hotkey === 'mod+k' && entry.description === 'Open commands')).toBe(
                true
            );
            await userEvent.keyboard('{Control>}k{/Control}');
            expect(await screen.findByRole('dialog', { name: 'Commands' })).toBeInTheDocument();
            if (framework === 'vue') cleanupVue();
            else cleanupReact();
            expect(hotkeyRegistry.list({ all: true }).length).toBe(before);
        });
    });

    describe('InlineEdit', () => {
        it('opens the editor with the value, Enter saves and the focus returns to the text', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('InlineEdit', { label: 'Project name', defaultValue: 'Portal', [onModel]: onChange })
            );
            const display = screen.getByRole('button', { name: /^Portal\s?Edit Project name$/ });
            await userEvent.click(display);
            const input = screen.getByRole('textbox', { name: 'Project name' });
            expect(input).toHaveFocus();
            expect(input).toHaveValue('Portal');
            await userEvent.clear(input);
            await userEvent.type(input, 'Customer portal{Enter}');
            expect(onChange).toHaveBeenLastCalledWith('Customer portal');
            await tick(10);
            const shown = screen.getByRole('button', { name: /^Customer portal\s?Edit Project name$/ });
            expect(shown).toHaveFocus();
        });

        it('Escape cancels; a failed (async) check keeps the editor open with the message', async () => {
            const onChange = vi.fn();
            const validate = vi.fn(async (value: string) => (value.length < 3 ? 'At least 3 characters' : undefined));
            await render(
                framework,
                el('InlineEdit', {
                    label: 'Abbreviation',
                    defaultValue: 'ABC',
                    validate,
                    [onModel]: onChange,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: /Edit Abbreviation/ }));
            await userEvent.type(screen.getByRole('textbox', { name: 'Abbreviation' }), 'X{Escape}');
            await tick(10);
            expect(screen.getByRole('button', { name: /^ABC\s?Edit Abbreviation$/ })).toHaveFocus();
            expect(onChange).not.toHaveBeenCalled();

            await userEvent.click(screen.getByRole('button', { name: /Edit Abbreviation/ }));
            const input = screen.getByRole('textbox', { name: 'Abbreviation' });
            await userEvent.clear(input);
            await userEvent.type(input, 'A');
            await userEvent.click(screen.getByRole('button', { name: 'Save' }));
            expect(await screen.findByRole('alert')).toHaveTextContent('At least 3 characters');
            expect(input).toHaveAttribute('aria-invalid', 'true');
            expect(input).toHaveAccessibleDescription('At least 3 characters');
            expect(onChange).not.toHaveBeenCalled();
            await userEvent.type(input, 'BCD{Enter}');
            await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('ABCD'));
        });
    });

    describe('SearchField', () => {
        it('is a search landmark; Enter submits the text and the area, Escape empties the field', async () => {
            const onSubmit = vi.fn();
            const onClear = vi.fn();
            await render(
                framework,
                el('SearchField', {
                    scopes: [
                        { value: 'all', label: 'All' },
                        { value: 'name', label: 'Name' },
                    ],
                    scope: 'name',
                    onSubmit,
                    onClear,
                })
            );
            expect(screen.getByRole('search', { name: 'Search' })).toBeInTheDocument();
            expect(screen.getByRole('combobox', { name: 'Search in' })).toHaveValue('name');
            const field = screen.getByRole('searchbox', { name: 'Search' });
            await userEvent.type(field, 'web-01{Enter}');
            expect(onSubmit).toHaveBeenLastCalledWith('web-01', 'name');
            await userEvent.keyboard('{Escape}');
            expect(field).toHaveValue('');
            expect(onClear).toHaveBeenCalled();
        });
    });

    describe('FilterPanel and FilterChips', () => {
        const filters = [
            { id: 'location', label: 'Location', value: 'Frankfurt' },
            { id: 'load', label: 'Load', value: 'over 50%' },
        ];

        it('the toggle names the number of active filters and opens the form; chips remove filters', async () => {
            const onRemove = vi.fn();
            const onClear = vi.fn();
            await render(
                framework,
                el('FilterPanel', { filters, onRemove, onClear }, el('label', {}, 'Location ', el('input', {})))
            );
            const region = screen.getByRole('region', { name: 'Filters' });
            const toggle = within(region).getByRole('button', { name: /^Filters\s?2\s?active$/ });
            expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await userEvent.click(toggle);
            expect(toggle).toHaveAttribute('aria-expanded', 'true');
            const chips = screen.getByRole('list', { name: 'Active filters' });
            await userEvent.click(within(chips).getByRole('button', { name: 'Remove filter Location: Frankfurt' }));
            expect(onRemove).toHaveBeenCalledWith('location');
            await userEvent.click(within(chips).getByRole('button', { name: 'Reset all' }));
            expect(onClear).toHaveBeenCalled();
        });

        it('after removing a chip the focus goes to the next one; the new count is announced', async () => {
            const current = [...filters];
            const view = {
                vue: () => {
                    const Comp = defineComponent({
                        data: () => ({ items: current }),
                        render() {
                            return h(Vue.FilterPanel, {
                                filters: this.items,
                                onRemove: (id: string) => (this.items = this.items.filter((item) => item.id !== id)),
                            });
                        },
                    });
                    renderVue(Comp);
                },
                react: () => {
                    const Comp = () => {
                        const [items, setItems] = useState(current);
                        return createElement(React.FilterPanel, {
                            filters: items,
                            onRemove: (id: string) => setItems(items.filter((item) => item.id !== id)),
                        });
                    };
                    renderReact(createElement(Comp));
                },
            };
            view[framework]();
            await tick();
            await userEvent.click(screen.getByRole('button', { name: 'Remove filter Location: Frankfurt' }));
            await tick();
            expect(screen.getByRole('button', { name: 'Remove filter Load: over 50%' })).toHaveFocus();
            expect(screen.getByRole('status')).toHaveTextContent('1 filter active');
        });
    });

    describe('ConditionBuilder', () => {
        it('adds rules and groups (focus moves into the new rule), changes operators, removes and announces', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('LiveAnnouncer', {}, el('ConditionBuilder', { fields: conditionFields, [onModel]: onChange }))
            );
            const root = screen.getByRole('group', { name: 'Conditions' });
            expect(within(root).getByText('No conditions – all entries match')).toBeInTheDocument();
            await userEvent.click(within(root).getByRole('button', { name: 'Add condition' }));
            const rule = screen.getByRole('group', { name: 'Condition 1' });
            const field = within(rule).getByRole('combobox', { name: 'Field' });
            await waitFor(() => expect(field).toHaveFocus());
            await waitFor(() => expect(screen.getAllByRole('status')[0]).toHaveTextContent('Condition added'));

            await userEvent.selectOptions(field, 'load');
            const operator = within(screen.getByRole('group', { name: 'Condition 1' })).getByRole('combobox', {
                name: 'Operator',
            });
            await userEvent.selectOptions(operator, 'between');
            const tree = onChange.mock.lastCall![0];
            expect(tree.children[0]).toMatchObject({ field: 'load', operator: 'between', value: [null, null] });
            expect(screen.getByRole('spinbutton', { name: 'Value: From' })).toBeInTheDocument();
            expect(screen.getByRole('spinbutton', { name: 'Value: To' })).toBeInTheDocument();

            await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Combine with' }), 'or');
            expect(onChange.mock.lastCall![0].combinator).toBe('or');
            await userEvent.click(screen.getByRole('button', { name: 'Add group' }));
            expect(screen.getByRole('group', { name: 'Group 2' })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: 'Condition 2.1' })).toBeInTheDocument();
            expect(onChange.mock.lastCall![0].children[1]).toMatchObject({ type: 'group', combinator: 'and' });

            await userEvent.click(screen.getByRole('button', { name: 'Remove condition 1' }));
            await waitFor(() =>
                expect(within(root).getAllByRole('button', { name: 'Add condition' })[0]).toHaveFocus()
            );
            expect(onChange.mock.lastCall![0].children).toHaveLength(1);
        });

        it('negatable: the "Not" checkbox negates a group', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('ConditionBuilder', {
                    fields: conditionFields,
                    negatable: true,
                    defaultValue: {
                        type: 'group',
                        id: 'root',
                        combinator: 'and',
                        children: [{ type: 'group', id: 'g1', combinator: 'or', children: [] }],
                    },
                    [onModel]: onChange,
                })
            );
            const nested = screen.getByRole('group', { name: 'Group 1' });
            await userEvent.click(within(nested).getByRole('checkbox', { name: 'Not' }));
            expect(onChange.mock.lastCall![0].children[0]).toMatchObject({ id: 'g1', not: true });
            expect(within(nested).getByRole('checkbox', { name: 'Not' })).toBeChecked();
            await userEvent.click(within(nested).getByRole('checkbox', { name: 'Not' }));
            expect(onChange.mock.lastCall![0].children[0]).not.toHaveProperty('not');
        });

        const advancedTable = (props: Record<string, unknown>) =>
            el('DataTable', {
                data: [
                    { id: 'a', name: 'web-01', load: 42, online: true },
                    { id: 'b', name: 'db-primary', load: 71, online: true },
                    { id: 'c', name: 'backup', load: 18, online: false },
                ],
                columns: [
                    { id: 'name', header: 'Name', filter: 'text' },
                    { id: 'load', header: 'Load', filter: 'number' },
                    { id: 'online', header: 'Online', filter: 'boolean' },
                ],
                caption: 'Server',
                getRowId: (row: { id: string }) => row.id,
                advancedFilter: true,
                advancedFilterValue: {
                    type: 'group',
                    id: 'root',
                    combinator: 'and',
                    children: [{ type: 'rule', id: 'r1', field: 'load', operator: 'gt', value: 40 }],
                },
                ...props,
            });

        it('DataTable advancedFilter: the rows pass the condition tree; the panel opens from the toolbar', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                advancedTable({
                    $scoped: advancedFilterEditor,
                    [framework === 'vue' ? 'onUpdate:advancedFilterValue' : 'onAdvancedFilterValueChange']: onChange,
                })
            );
            const table = screen.getByRole('table', { name: 'Server' });
            // Header, filter row and the two rows with a load over 40
            const rows = within(table)
                .getAllByRole('row')
                .map((row) => row.textContent);
            expect(rows).toHaveLength(4);
            expect(rows.some((row) => row?.includes('backup'))).toBe(false);
            const toggle = screen.getByRole('button', { name: 'Advanced filter' });
            await userEvent.click(toggle);
            expect(toggle).toHaveAttribute('aria-expanded', 'true');
            const builder = screen.getByRole('group', { name: 'Advanced filter' });
            expect(within(builder).getByRole('combobox', { name: 'Field' })).toHaveValue('load');
            // The editor's changes reach the table
            await userEvent.click(within(builder).getByRole('button', { name: 'Remove condition 1' }));
            expect(onChange.mock.lastCall![0].children).toHaveLength(0);
        });

        it('DataTable advancedFilter without an editor: no button, the tree still filters, a hint in development', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            await render(framework, advancedTable({}));
            const table = screen.getByRole('table', { name: 'Server' });
            expect(within(table).getAllByRole('row')).toHaveLength(4);
            expect(screen.queryByRole('button', { name: 'Advanced filter' })).toBeNull();
            expect(warn).toHaveBeenCalledWith(expect.stringContaining(`@wirecore/wirelayer-blocks-${framework}`));
            warn.mockRestore();
        });
    });

    describe('CheckboxGroup and SwitchGroup', () => {
        it('CheckboxGroup: named group with a value; at max the others are disabled and it is announced', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el(
                    'CheckboxGroup',
                    { label: 'Channels', helperText: 'Two at most', max: 2, [onModel]: onChange },
                    el('Checkbox', { value: 'mail' }, 'E-Mail'),
                    el('Checkbox', { value: 'push' }, 'Push'),
                    el('Checkbox', { value: 'sms' }, 'SMS')
                )
            );
            const group = screen.getByRole('group', { name: 'Channels' });
            expect(group).toHaveAccessibleDescription('Two at most');
            await userEvent.click(within(group).getByRole('checkbox', { name: 'E-Mail' }));
            await userEvent.click(within(group).getByRole('checkbox', { name: 'SMS' }));
            expect(onChange).toHaveBeenLastCalledWith(['mail', 'sms']);
            expect(within(group).getByRole('checkbox', { name: 'Push' })).toBeDisabled();
            expect(within(group).getByRole('status')).toHaveTextContent('At most 2 can be selected');
        });

        it('CheckboxCard and RadioCard: title names the control, description and price describe it', async () => {
            await render(
                framework,
                el(
                    'div',
                    {},
                    el(
                        'CheckboxGroup',
                        { label: 'Module' },
                        el('CheckboxCard', { value: 'backup', title: 'Backup', description: 'Daily', price: '9 €' })
                    ),
                    el(
                        'RadioGroup',
                        { label: 'Plan', columns: 2 },
                        el('RadioCard', { value: 'pro', title: 'Pro', description: 'For teams', price: '29 €' })
                    )
                )
            );
            const card = screen.getByRole('checkbox', { name: 'Backup' });
            expect(card).toHaveAccessibleDescription(/Daily\s?9 €/);
            await userEvent.click(screen.getByText('Daily'));
            expect(card).toBeChecked();
            const radio = screen.getByRole('radio', { name: 'Pro' });
            expect(radio).toHaveAccessibleDescription(/For teams\s?29 €/);
            await userEvent.click(screen.getByText('For teams'));
            expect(radio).toBeChecked();
        });

        it('SwitchGroup: switches with a value follow the group', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el(
                    'SwitchGroup',
                    { label: 'Channels', defaultValue: ['mail'], [onModel]: onChange },
                    el('Switch', { value: 'mail' }, 'E-Mail'),
                    el('Switch', { value: 'push' }, 'Push')
                )
            );
            const group = screen.getByRole('group', { name: 'Channels' });
            expect(within(group).getByRole('switch', { name: 'E-Mail' })).toBeChecked();
            await userEvent.click(within(group).getByRole('switch', { name: 'Push' }));
            expect(onChange).toHaveBeenLastCalledWith(['mail', 'push']);
            await userEvent.click(within(group).getByRole('switch', { name: 'E-Mail' }));
            expect(onChange).toHaveBeenLastCalledWith(['push']);
            expect(within(group).getByRole('switch', { name: 'E-Mail' })).not.toBeChecked();
        });
    });

    describe('OverflowList and Truncate', () => {
        it('OverflowList: hidden items are out of the reading order; "+N" opens a popover with them', async () => {
            await render(
                framework,
                el('OverflowList', {
                    items: ['Vue', 'React', 'Nuxt', 'Next'],
                    maxVisible: 2,
                    label: 'Technologies',
                    $scoped: {
                        item: {
                            react: 'renderItem',
                            args: (item: string, index: number) => ({ item, index }),
                            render: ({ item }: { item: string }) => el('span', {}, item),
                        },
                    },
                })
            );
            const list = screen.getByRole('list', { name: 'Technologies' });
            expect(within(list).getAllByRole('listitem')).toHaveLength(3);
            const more = within(list).getByRole('button', { name: /^\+2\s?more$/ });
            await userEvent.click(more);
            const popover = await screen.findByRole('dialog', { name: 'More items' });
            expect(
                within(popover)
                    .getAllByRole('listitem')
                    .map((item) => item.textContent)
            ).toEqual(['Nuxt', 'Next']);
        });

        it('Truncate: while cut the text is focusable with a tooltip, or a "Show more" button expands it', async () => {
            const scrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
            Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => 80 });
            try {
                await render(
                    framework,
                    el(
                        'div',
                        {},
                        el('Truncate', { text: 'A long text', lines: 2, expandable: true, as: 'p' }),
                        el('Truncate', { text: 'Another long text' })
                    )
                );
                const more = await screen.findByRole('button', { name: 'Show more' });
                expect(more).toHaveAttribute('aria-expanded', 'false');
                await userEvent.click(more);
                expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
                await waitFor(() => expect(screen.getByText('Another long text')).toHaveAttribute('tabindex', '0'));
            } finally {
                if (scrollHeight) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeight);
            }
        });
    });

    describe('Wizard', () => {
        it('checks a step before going on, keeps it open with a message, goes back freely and completes', async () => {
            let valid = false;
            const onComplete = vi.fn();
            await render(
                framework,
                el('Wizard', {
                    steps: [{ label: 'Contact', validate: async () => valid }, { label: 'Address' }],
                    onComplete,
                    $slots: { summary: el('p', {}, 'All correct?') },
                    $scoped: {
                        step: {
                            react: 'renderStep',
                            args: (index: number) => ({ index }),
                            render: ({ index }: { index: number }) => el('p', {}, `Content ${index + 1}`),
                        },
                    },
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Next' }));
            expect(await screen.findByRole('alert')).toHaveTextContent('Please check the entries in this step');
            expect(screen.getByRole('tab', { name: /Contact/ })).toHaveAttribute('aria-selected', 'true');
            valid = true;
            await userEvent.click(screen.getByRole('button', { name: 'Next' }));
            await waitFor(() =>
                expect(screen.getByRole('tab', { name: /Address/ })).toHaveAttribute('aria-selected', 'true')
            );
            await userEvent.click(screen.getByRole('button', { name: 'Back' }));
            expect(screen.getByRole('tab', { name: /Contact/ })).toHaveAttribute('aria-selected', 'true');
            await userEvent.click(screen.getByRole('button', { name: 'Next' }));
            await waitFor(() =>
                expect(screen.getByRole('tab', { name: /Address/ })).toHaveAttribute('aria-selected', 'true')
            );
            await userEvent.click(screen.getByRole('button', { name: 'Next' }));
            await waitFor(() =>
                expect(screen.getByRole('tab', { name: /Summary/ })).toHaveAttribute('aria-selected', 'true')
            );
            expect(screen.getByText('All correct?')).toBeVisible();
            await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
            await waitFor(() => expect(onComplete).toHaveBeenCalled());
        });
    });

    describe('Persona, Statistic, AiLabel, ConfigProvider', () => {
        it('Persona: the avatar is hidden, the name follows as text; presence with text', async () => {
            await render(
                framework,
                el('Persona', { name: 'Anna Berg', description: 'Management', presence: 'busy', href: '/anna' })
            );
            expect(screen.getByRole('link', { name: /^Anna Berg\s?Management\s?Busy$/ })).toHaveAttribute(
                'href',
                '/anna'
            );
            expect(screen.queryByRole('img')).toBeNull();
        });

        it('Statistic: trend with arrow and sign; counting gives screen readers the final value', async () => {
            await render(framework, el('Statistic', { label: 'Revenue', value: 1200, trend: -3.5, animate: true }));
            expect(screen.getByText(/^[-−]3\.5%$/)).toBeInTheDocument();
            expect(screen.getAllByText('1,200')).toHaveLength(2);
        });

        it('AiLabel: text label with an explanation behind the toggletip', async () => {
            await render(framework, el('AiLabel', {}));
            expect(screen.getByText('AI-generated')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'What does AI-generated mean?' }));
            expect(screen.getByRole('status')).toHaveTextContent(/artificial intelligence/);
        });

        it('ConfigProvider: size for every component below, locale and theme attributes', async () => {
            await render(
                framework,
                el(
                    'div',
                    {},
                    el(
                        'ConfigProvider',
                        { size: 'sm', locale: 'en-US', theme: 'ocean' },
                        el('Button', {}, 'Klein'),
                        el('PasswordInput', { 'aria-label': 'Password' })
                    ),
                    el('Button', {}, 'Normal')
                )
            );
            const small = screen.getByRole('button', { name: 'Klein' });
            const normal = screen.getByRole('button', { name: 'Normal' });
            expect(small.className).not.toBe(normal.className);
            expect(small.closest('[data-theme]')).toHaveAttribute('data-theme', 'ocean');
            expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
        });
    });
});
