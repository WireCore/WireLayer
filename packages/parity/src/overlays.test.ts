import { screen, waitFor, within } from '@testing-library/dom';
import { act, cleanup as cleanupReact } from '@testing-library/react';
import { cleanup as cleanupVue } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import * as React from '@wirecore/wirelayer-react';
import * as Vue from '@wirecore/wirelayer-vue';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { el, frameworks, icon, normalize, render, type El, type Framework } from './harness.js';

// Overlays, menus and notifications: open states (portals) in both frameworks, services and imperative opening

const lib = (framework: Framework) => (framework === 'vue' ? Vue : React);
const tick = (ms = 0) => act(() => new Promise((done) => setTimeout(done, ms)));

/** The whole page with the open overlay (portals are outside the render container) */
async function openDom(framework: Framework, node: El, ready: string) {
    // Containers of earlier renders stay in the page (empty) – start from a clean one
    document.body.innerHTML = '';
    await render(framework, node);
    await waitFor(() => expect(document.body.querySelector(ready)).not.toBeNull());
    await tick(20);
    const dom = normalize(document.body);
    if (framework === 'vue') cleanupVue();
    else cleanupReact();
    return dom;
}

const menuItems = [
    { value: 'docs', label: 'Documentation', href: '/docs', icon: icon('ArrowRight') },
    { type: 'checkbox', value: 'grid', label: 'Show grid', checked: true },
    {
        type: 'radio',
        name: 'sort',
        label: 'Sorting',
        value: 'name',
        items: [
            { value: 'name', label: 'Name' },
            { value: 'load', label: 'Load' },
        ],
    },
    { type: 'separator' },
    { value: 'delete', label: 'Clear', danger: true, shortcut: '⌘⌫' },
];

describe('open overlays render the same DOM', () => {
    const cases: [string, El, string][] = [
        [
            'Dialog: size, position, maximize, drag, inside scrolling, footer',
            el(
                'Dialog',
                { defaultOpen: true },
                el('DialogContent', {
                    title: 'Server',
                    description: 'web-01',
                    size: 'lg',
                    position: 'top',
                    maximizable: true,
                    draggable: true,
                    scrollBehavior: 'inside',
                    $slots: { footer: el('Button', {}, 'OK') },
                })
            ),
            '[role=dialog]',
        ],
        [
            'Dialog: non-modal, fullscreen, without close button',
            el(
                'Dialog',
                { defaultOpen: true, modal: false },
                el('DialogContent', { title: 'Log', fullscreen: true, closable: false, responsive: false })
            ),
            '[role=dialog]',
        ],
        [
            'Drawer: size, offset, non-modal',
            el(
                'Drawer',
                { defaultOpen: true, modal: false },
                el('DrawerContent', { title: 'Filters', size: 'sm', offset: true, placement: 'left' })
            ),
            '[role=dialog]',
        ],
        [
            'Popover: trigger width and overlay',
            el(
                'Popover',
                { defaultOpen: true, width: 'trigger', overlay: true },
                el('PopoverTrigger', {}, el('Button', {}, 'Details')),
                el('PopoverContent', { title: 'Load', description: 'Last hour' }, 'web-01')
            ),
            '[role=dialog]',
        ],
        [
            'Popover: hidden title, without close button',
            el(
                'Popover',
                { defaultOpen: true, placement: 'bottom-start' },
                el('PopoverTrigger', {}, el('Button', {}, 'Apps')),
                el('PopoverContent', { title: 'Apps', hideTitle: true, closable: false }, 'Mail')
            ),
            '[role=dialog]',
        ],
        [
            'Menu: links, checkbox and radio items, filter field',
            el('Menu', { items: menuItems, defaultOpen: true, searchable: true }, el('Button', {}, 'View')),
            '[role=menu]',
        ],
        [
            'Menu: arrow and placement',
            el(
                'Menu',
                { items: menuItems, defaultOpen: true, arrow: true, placement: 'bottom-end' },
                el('Button', {}, 'View')
            ),
            '[role=menu]',
        ],
    ];
    it.each(cases)('%s', async (_, node, ready) => {
        expect(await openDom('vue', node, ready)).toBe(await openDom('react', node, ready));
    });
});

describe.each(frameworks)('%s', (framework) => {
    describe('Dialog', () => {
        it('non-modal: role dialog without aria-modal, no backdrop, no close button with closable=false', async () => {
            await render(
                framework,
                el(
                    'Dialog',
                    { defaultOpen: true, modal: false },
                    el('DialogContent', { title: 'Log', closable: false })
                )
            );
            const dialog = await screen.findByRole('dialog', { name: 'Log' });
            expect(dialog).not.toHaveAttribute('aria-modal', 'true');
            expect(document.querySelector('[data-scope=dialog][data-part=backdrop]')).toBeNull();
            expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull();
        });

        it('maximize button switches to the whole screen and back, reports the state', async () => {
            const onMaximized = vi.fn();
            await render(
                framework,
                el(
                    'Dialog',
                    { defaultOpen: true },
                    el('DialogContent', {
                        title: 'Report',
                        maximizable: true,
                        [framework === 'vue' ? 'onUpdate:maximized' : 'onMaximizedChange']: onMaximized,
                    })
                )
            );
            const dialog = await screen.findByRole('dialog', { name: 'Report' });
            await userEvent.click(within(dialog).getByRole('button', { name: 'Maximize' }));
            expect(onMaximized).toHaveBeenLastCalledWith(true);
            expect(dialog.className).toContain('rounded-none');
            await userEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));
            expect(onMaximized).toHaveBeenLastCalledWith(false);
            expect(dialog.className).not.toContain('rounded-none');
        });

        it('draggable: the keyboard alternative is announced', async () => {
            await render(
                framework,
                el('Dialog', { defaultOpen: true }, el('DialogContent', { title: 'Note', draggable: true }))
            );
            const dialog = await screen.findByRole('dialog', { name: 'Note' });
            expect(dialog).toHaveAttribute('aria-keyshortcuts', expect.stringContaining('Alt+ArrowUp'));
        });

        it('closeOnEscape=false keeps it open', async () => {
            await render(
                framework,
                el('Dialog', { defaultOpen: true, closeOnEscape: false }, el('DialogContent', { title: 'Important' }))
            );
            await screen.findByRole('dialog', { name: 'Important' });
            await userEvent.keyboard('{Escape}');
            await tick(20);
            expect(screen.getByRole('dialog', { name: 'Important' })).toBeInTheDocument();
        });
    });

    describe('Dialog service', () => {
        it('passes data, updates the open dialog and resolves with close(result)', async () => {
            const { openDialog } = lib(framework);
            await render(framework, el('DialogHost', {}));
            let handle!: ReturnType<typeof React.openDialog<string>>;
            await act(async () => {
                handle =
                    framework === 'vue'
                        ? (Vue.openDialog({
                              title: 'Server',
                              component: Object.assign((props: { data?: string }) => props.data, { props: ['data'] }),
                              data: 'web-01',
                              size: 'lg',
                          }) as never)
                        : React.openDialog<string>({
                              title: 'Server',
                              content: (_close, data) => data as string,
                              data: 'web-01',
                              size: 'lg',
                          });
            });
            const dialog = await screen.findByRole('dialog', { name: 'Server' });
            expect(dialog).toHaveTextContent('web-01');
            await act(async () => handle.update({ title: 'Rename server' }));
            expect(await screen.findByRole('dialog', { name: 'Rename server' })).toBeInTheDocument();
            await act(async () => handle.close('done'));
            await expect(handle).resolves.toBe('done');
            expect(openDialog).toBeTypeOf('function');
        });

        it('closeAllDialogs closes stacked dialogs', async () => {
            const { closeAllDialogs } = lib(framework);
            await render(framework, el('DialogHost', {}));
            const open = (title: string) =>
                framework === 'vue'
                    ? Vue.openDialog({ title, component: () => title })
                    : React.openDialog({ title, content: () => title });
            let first!: Promise<unknown>;
            let second!: Promise<unknown>;
            await act(async () => {
                first = open('First');
            });
            await screen.findByRole('dialog', { name: 'First' });
            await tick(20);
            await act(async () => {
                second = open('Second');
            });
            // The upper dialog hides the one below from assistive tech (aria-hidden)
            expect(await screen.findByRole('dialog', { name: 'Second' })).toBeInTheDocument();
            expect(screen.getByRole('dialog', { name: 'First', hidden: true })).toHaveAttribute('aria-modal', 'true');
            await act(async () => closeAllDialogs());
            await expect(first).resolves.toBeUndefined();
            await expect(second).resolves.toBeUndefined();
        });

        it('DialogContent portalTarget renders the dialog into the given element', async () => {
            const target = document.createElement('div');
            target.id = 'fullscreen';
            document.body.append(target);
            await render(
                framework,
                el('Dialog', { defaultOpen: true }, el('DialogContent', { title: 'Password', portalTarget: target }))
            );
            const dialog = await screen.findByRole('dialog', { name: 'Password' });
            expect(target).toContainElement(dialog);
            target.remove();
        });

        it('drops closed dialogs when the host unmounts before the animation ends', async () => {
            await render(framework, el('DialogHost', {}));
            const open = (title: string) =>
                framework === 'vue'
                    ? Vue.openDialog({ title, component: () => title })
                    : React.openDialog({ title, content: () => title });
            let handle!: ReturnType<typeof open>;
            await act(async () => {
                handle = open('Short');
            });
            await screen.findByRole('dialog', { name: 'Short' });
            // Close and unmount in one go – the exit animation never completes
            act(() => {
                handle.close();
                if (framework === 'vue') cleanupVue();
                else cleanupReact();
            });
            document.body.innerHTML = '';
            await render(framework, el('DialogHost', {}));
            await tick(20);
            expect(document.querySelector('[data-scope="dialog"][data-part="content"]')).toBeNull();
        });
    });

    describe('confirm and prompt', () => {
        it('prompt() resolves with the text; validate shows its error first', async () => {
            const { prompt } = lib(framework);
            await render(framework, el('ConfirmDialog', {}));
            let answer!: Promise<string | null>;
            await act(async () => {
                answer = prompt({
                    title: 'Rename',
                    label: 'New name',
                    defaultValue: 'web',
                    validate: (value) => (value.length < 4 ? 'At least 4 characters' : undefined),
                });
            });
            const dialog = await screen.findByRole('alertdialog', { name: 'Rename' });
            // The field gets the focus – checked in the browser (jsdom has no focus trap)
            const field = within(dialog).getByRole('textbox', { name: 'New name' });
            await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
            expect(await within(dialog).findByText('At least 4 characters')).toBeInTheDocument();
            await userEvent.type(field, '-01{Enter}');
            await expect(answer).resolves.toBe('web-01');
        });

        it('prompt() resolves with null when cancelled', async () => {
            const { prompt } = lib(framework);
            await render(framework, el('ConfirmDialog', {}));
            let answer!: Promise<string | null>;
            await act(async () => {
                answer = prompt({ title: 'Note', label: 'string' });
            });
            const dialog = await screen.findByRole('alertdialog', { name: 'Note' });
            await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
            await expect(answer).resolves.toBeNull();
        });

        it('confirm({ typeToConfirm }) only confirms with the exact name', async () => {
            const { confirm } = lib(framework);
            await render(framework, el('ConfirmDialog', {}));
            let answer!: Promise<boolean>;
            await act(async () => {
                answer = confirm({ title: 'Delete server?', status: 'danger', typeToConfirm: 'web-01' });
            });
            const dialog = await screen.findByRole('alertdialog', { name: 'Delete server?' });
            const field = within(dialog).getByRole('textbox', { name: 'Type “web-01” to confirm' });
            await userEvent.type(field, 'web-02');
            await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
            expect(await within(dialog).findByText('The text does not match')).toBeInTheDocument();
            await userEvent.clear(field);
            await userEvent.type(field, 'web-01');
            await userEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
            await expect(answer).resolves.toBe(true);
        });
    });

    describe('Toaster', () => {
        const setup = async (props: Record<string, unknown> = {}) => {
            await render(framework, el('Toaster', props));
            return screen.getByRole('region', { name: /Notifications/ });
        };

        it('toast.promise follows the promise: loading, then success with the result', async () => {
            const { toast, toaster } = lib(framework);
            const region = await setup();
            let resolve!: (value: string) => void;
            let id: string | undefined;
            await act(async () => {
                id = toast.promise(new Promise<string>((done) => (resolve = done)), {
                    loading: 'Saving',
                    success: (name) => ({ title: `${name} saved` }),
                    error: 'Failed',
                });
            });
            expect(id).toEqual(expect.any(String));
            expect(await within(region).findByText('Saving')).toBeInTheDocument();
            await act(async () => resolve('web-01'));
            expect(await within(region).findByText('web-01 saved')).toBeInTheDocument();
            expect(within(region).queryByText('Saving')).toBeNull();
            await act(async () => toaster.remove());
        });

        it('toast.promise shows the error text when the promise rejects', async () => {
            const { toast, toaster } = lib(framework);
            const region = await setup();
            await act(async () => {
                toast.promise(Promise.reject(new Error('Network')), {
                    loading: 'Loading',
                    error: (reason) => `Error: ${(reason as Error).message}`,
                });
            });
            expect(await within(region).findByText('Error: Network')).toBeInTheDocument();
            await act(async () => toaster.remove());
        });

        it('toast() returns the id; update() changes and dismiss() closes the toast', async () => {
            const { toast, toaster } = lib(framework);
            const region = await setup();
            let id = '';
            await act(async () => {
                id = toast({ title: 'Upload', type: 'loading' });
            });
            expect(await within(region).findByText('Upload')).toBeInTheDocument();
            await act(async () => toast.update(id, { title: 'Upload done', type: 'success' }));
            expect(await within(region).findByText('Upload done')).toBeInTheDocument();
            // Ark ignores a dismiss while it applies an update (one frame)
            await tick(50);
            await act(async () => toast.dismiss(id));
            await waitFor(() => expect(within(region).queryByText('Upload done')).toBeNull());
            await act(async () => toaster.remove());
        });

        it('a toaster of its own renders its toasts; the progress bar is decorative', async () => {
            const own = lib(framework).createToaster({ placement: 'top', max: 2 });
            await render(framework, el('Toaster', { toaster: own.toaster, label: 'Top', showProgress: true }));
            const region = screen.getByRole('region', { name: /Top/ });
            await act(async () => {
                own.toast({ title: 'One' });
            });
            const status = await within(region).findByRole('status');
            expect(status).toHaveTextContent('One');
            expect(
                status.querySelector('[data-part=root] > span[aria-hidden=true], span[aria-hidden=true]')
            ).not.toBeNull();
            await act(async () => own.toaster.remove());
        });
    });

    describe('Menu', () => {
        it('checkbox items and radio groups report their changes and keep their state', async () => {
            const onCheckedChange = vi.fn();
            const onValueChange = vi.fn();
            await render(
                framework,
                el('Menu', { items: menuItems, onCheckedChange, onValueChange }, el('Button', {}, 'View'))
            );
            await userEvent.click(screen.getByRole('button', { name: 'View' }));
            const grid = await screen.findByRole('menuitemcheckbox', { name: 'Show grid' });
            expect(grid).toHaveAttribute('aria-checked', 'true');
            await userEvent.click(grid);
            expect(onCheckedChange).toHaveBeenLastCalledWith('grid', false);
            // Checkbox and radio items keep the menu open
            expect(screen.getByRole('menuitemcheckbox', { name: 'Show grid' })).toHaveAttribute(
                'aria-checked',
                'false'
            );
            expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('aria-checked', 'true');
            await userEvent.click(screen.getByRole('menuitemradio', { name: 'Load' }));
            expect(onValueChange).toHaveBeenLastCalledWith('sort', 'load');
            expect(screen.getByRole('menuitemradio', { name: 'Load' })).toHaveAttribute('aria-checked', 'true');
            expect(screen.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('aria-checked', 'false');
            expect(screen.getByRole('group', { name: 'Sorting' })).toBeInTheDocument();
        });

        it('items with href are links with the menu item role', async () => {
            await render(framework, el('Menu', { items: menuItems, defaultOpen: true }, el('Button', {}, 'View')));
            const link = await screen.findByRole('menuitem', { name: 'Documentation' });
            expect(link.tagName).toBe('A');
            expect(link).toHaveAttribute('href', '/docs');
        });

        it('items with to hand it to linkAs as `to` (router links)', async () => {
            // Stand-in for RouterLink / React Router's Link: needs `to`, resolves the href itself
            const RouterLink =
                framework === 'vue'
                    ? defineComponent({
                          props: { to: { type: String, required: true } },
                          setup:
                              (props, { slots }) =>
                              () =>
                                  h('a', { href: `#${props.to}` }, slots.default?.()),
                      })
                    : ({ to, ...props }: { to: string }) => createElement('a', { ...props, href: `#${to}` });
            await render(
                framework,
                el(
                    'Menu',
                    {
                        items: [{ value: 'settings', label: 'Settings', to: '/settings' }],
                        linkAs: RouterLink,
                        defaultOpen: true,
                    },
                    el('Button', {}, 'Account')
                )
            );
            const link = await screen.findByRole('menuitem', { name: 'Settings' });
            expect(link.tagName).toBe('A');
            expect(link).toHaveAttribute('href', '#/settings');
            expect(link).not.toHaveAttribute('to');
        });

        it('own item content (slot / renderItem)', async () => {
            await render(
                framework,
                el(
                    'Menu',
                    {
                        items: [{ value: 'a', label: 'Alpha' }],
                        defaultOpen: true,
                        $scoped: {
                            item: {
                                react: 'renderItem',
                                args: (item: { label: string }) => ({ item }),
                                render: ({ item }: { item: { label: string } }) => el('em', {}, `→ ${item.label}`),
                            },
                        },
                    },
                    el('Button', {}, 'List')
                )
            );
            expect(await screen.findByRole('menuitem', { name: '→ Alpha' })).toBeInTheDocument();
        });

        it('the filter field narrows long menus and says when nothing matches', async () => {
            await render(framework, el('Menu', { items: menuItems, searchable: true }, el('Button', {}, 'View')));
            await userEvent.click(screen.getByRole('button', { name: 'View' }));
            const field = await screen.findByRole('textbox', { name: 'Search the menu' });
            await userEvent.type(field, 'load');
            await waitFor(() => expect(screen.getAllByRole('menuitemradio')).toHaveLength(1));
            expect(screen.queryByRole('menuitemcheckbox')).toBeNull();
            await userEvent.clear(field);
            await userEvent.type(field, 'xyz');
            expect(await screen.findByRole('status')).toHaveTextContent('No results');
        });

        it('opens imperatively at an element and closes again', async () => {
            let handle: { open: (anchor?: Element) => void; close: () => void } | null = null;
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('span', { id: 'cell' }, 'web-01'),
                    el('Menu', { items: menuItems, ref: (value: never) => (handle = value) })
                )
            );
            await act(async () => handle!.open(document.getElementById('cell')!));
            expect(await screen.findByRole('menu')).toBeInTheDocument();
            await act(async () => handle!.close());
            await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        });

        it('an Avatar as button opens the menu (user menu)', async () => {
            await render(
                framework,
                el(
                    'Menu',
                    { items: [{ value: 'logout', label: 'Sign out' }], placement: 'bottom-end', arrow: true },
                    el('Avatar', { name: 'Julia Klein', as: 'button' })
                )
            );
            const trigger = screen.getByRole('button', { name: 'Julia Klein' });
            expect(trigger).toHaveAttribute('type', 'button');
            expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
            expect(screen.queryByRole('img', { name: 'Julia Klein' })).toBeNull();
            await userEvent.click(trigger);
            expect(await screen.findByRole('menuitem', { name: 'Sign out' })).toBeInTheDocument();
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
        });

        it('shows the arrow only with `arrow`', async () => {
            await render(framework, el('Menu', { items: menuItems, defaultOpen: true }, el('Button', {}, 'View')));
            expect((await screen.findByRole('menu')).querySelector('[data-part=arrow]')).toBeNull();
            if (framework === 'vue') cleanupVue();
            else cleanupReact();
            await render(
                framework,
                el('Menu', { items: menuItems, defaultOpen: true, arrow: true }, el('Button', {}, 'View'))
            );
            expect((await screen.findByRole('menu')).querySelector('[data-part=arrow]')).not.toBeNull();
        });
    });

    describe('Popover and HoverCard', () => {
        it('Popover opens imperatively without a trigger', async () => {
            let handle: { open: (anchor?: Element) => void } | null = null;
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('span', { id: 'target' }, 'Target'),
                    el(
                        'Popover',
                        { ref: (value: never) => (handle = value) },
                        el('PopoverContent', { title: 'Details' }, 'Contents')
                    )
                )
            );
            await act(async () => handle!.open(document.getElementById('target')!));
            expect(await screen.findByRole('dialog', { name: 'Details' })).toBeInTheDocument();
        });

        it('Popover with a hidden title and without close button keeps its accessible name', async () => {
            await render(
                framework,
                el(
                    'Popover',
                    { defaultOpen: true },
                    el('PopoverTrigger', {}, el('Button', {}, 'Apps')),
                    el('PopoverContent', { title: 'Apps', hideTitle: true, closable: false }, 'Mail')
                )
            );
            const dialog = await screen.findByRole('dialog', { name: 'Apps' });
            expect(within(dialog).getByText('Apps')).toHaveClass('sr-only');
            expect(within(dialog).queryByRole('button')).toBeNull();
        });

        it('HoverCard opens at the anchor prop', async () => {
            await render(
                framework,
                el('HoverCard', { open: true, anchor: document.body, $slots: { content: 'Card' }, content: 'Card' })
            );
            expect(await screen.findByText('Card')).toBeInTheDocument();
        });
    });

    describe('Pagination', () => {
        const onPage = framework === 'vue' ? 'onUpdate:page' : 'onPageChange';
        const onSize = framework === 'vue' ? 'onUpdate:pageSize' : 'onPageSizeChange';

        it('compact: "Page X of Y" between the arrows, first/last buttons', async () => {
            await render(
                framework,
                el('Pagination', { count: 50, variant: 'compact', withEdges: true, defaultPage: 2 })
            );
            expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Page 1 of 5' })).toBeNull();
            await userEvent.click(screen.getByRole('button', { name: 'Last page' }));
            expect(screen.getByText('Page 5 of 5')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
        });

        it('page size choice keeps the first item in view; the jumper goes to a page', async () => {
            const onPageChange = vi.fn();
            const onPageSizeChange = vi.fn();
            await render(
                framework,
                el('Pagination', {
                    count: 100,
                    defaultPage: 3,
                    pageSizes: [10, 25],
                    jumper: true,
                    [onPage]: onPageChange,
                    [onSize]: onPageSizeChange,
                })
            );
            expect(screen.getByText('21–30 of 100')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('combobox', { name: 'Per page' }));
            await userEvent.click(await screen.findByRole('option', { name: '25' }));
            expect(onPageSizeChange).toHaveBeenLastCalledWith(25);
            await waitFor(() => expect(screen.getByText('1–25 of 100')).toBeInTheDocument());
            const jumper = screen.getByRole('textbox', { name: 'Go to page' });
            await userEvent.type(jumper, '4{Enter}');
            expect(onPageChange).toHaveBeenLastCalledWith(4);
            expect(screen.getByText('76–100 of 100')).toBeInTheDocument();
        });

        it('links for URL sync; nothing at all for a single page with hideSinglePage', async () => {
            await render(framework, el('Pagination', { count: 30, getPageHref: (page: number) => `?page=${page}` }));
            expect(screen.getByRole('link', { name: 'Page 2 of 3' })).toHaveAttribute('href', '?page=2');
            // No page before the first: a disabled link without href
            const previous = screen.getByRole('link', { name: 'Previous page' });
            expect(previous).toHaveAttribute('aria-disabled', 'true');
            expect(previous).not.toHaveAttribute('href');
            await render(
                framework,
                el('div', { 'data-testid': 'empty' }, el('Pagination', { count: 5, hideSinglePage: true }))
            );
            expect(screen.getByTestId('empty')).toBeEmptyDOMElement();
        });
    });

    describe('CommandPalette', () => {
        const commands = [
            { value: 'start', label: 'Settings', group: 'Pages', description: 'Overview' },
            { value: 'server', label: 'Server', group: 'Pages' },
            { value: 'new', label: 'New server', group: 'Actions', keywords: ['create'] },
        ];
        const onOpen = framework === 'vue' ? 'onUpdate:open' : 'onOpenChange';

        it('marks the matches, limits the results, shows descriptions and a custom empty text', async () => {
            await render(
                framework,
                el('CommandPalette', { items: commands, open: true, limit: 1, emptyText: 'Nothing here' })
            );
            const field = await screen.findByRole('combobox', { name: 'Commands' });
            expect(screen.getAllByRole('option')).toHaveLength(1);
            expect(screen.getByRole('option', { name: /Settings/ })).toHaveTextContent('Overview');
            await userEvent.type(field, 'serv');
            const option = await screen.findByRole('option', { name: 'Server' });
            expect(option.querySelector('mark')).toHaveTextContent('Serv');
            await userEvent.type(field, 'xyz');
            expect(await screen.findByText('Nothing here')).toBeInTheDocument();
        });

        it('own score, search event, loading row and staying open after running', async () => {
            const onSearch = vi.fn();
            const onSelect = vi.fn();
            await render(
                framework,
                el('CommandPalette', {
                    items: commands,
                    open: true,
                    loading: true,
                    closeOnSelect: false,
                    filter: (item: { value: string }, query: string) =>
                        item.value === query ? 2 : item.value === 'new' ? 1 : 0,
                    onSearch,
                    onSelect,
                })
            );
            expect(screen.getByRole('status')).toHaveTextContent('Loading');
            const field = await screen.findByRole('combobox', { name: 'Commands' });
            await userEvent.type(field, 'server');
            expect(onSearch).toHaveBeenLastCalledWith('server');
            expect(screen.getAllByRole('option').map((option) => option.textContent?.trim())).toEqual([
                'Server',
                'New server',
            ]);
            await userEvent.click(screen.getByRole('option', { name: 'New server' }));
            expect(onSelect).toHaveBeenLastCalledWith('new');
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('dataSource: server results after the matching items; filterChange; too short a search', async () => {
            const getItems = vi.fn(async ({ search = '' }: { search?: string }) => ({
                items: [{ value: `doc-${search}`, label: `Document ${search}`, group: 'Documents' }],
            }));
            const onFilterChange = vi.fn();
            await render(
                framework,
                el('CommandPalette', {
                    items: commands,
                    open: true,
                    dataSource: { getItems },
                    minSearchLength: 2,
                    onFilterChange,
                })
            );
            const field = await screen.findByRole('combobox', { name: 'Commands' });
            await userEvent.type(field, 'se');
            expect(onFilterChange).toHaveBeenLastCalledWith('se');
            expect(await screen.findByRole('option', { name: 'Document se' })).toBeInTheDocument();
            expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'se' }));
            // The local matches come first
            const options = screen.getAllByRole('option');
            expect(options).toHaveLength(4);
            expect(options.at(-1)).toHaveTextContent('Document se');
            await userEvent.clear(field);
            await userEvent.type(field, 'q');
            expect(await screen.findByText('Please enter at least 2 characters')).toBeInTheDocument();
        });

        it('opens with an own shortcut', async () => {
            const onOpenChange = vi.fn();
            await render(
                framework,
                el('CommandPalette', { items: commands, hotkey: ['mod+p', '/'], [onOpen]: onOpenChange })
            );
            await userEvent.keyboard('/');
            expect(onOpenChange).toHaveBeenLastCalledWith(true);
        });
    });

    describe('SaveStatus', () => {
        it('is a live region with text per state', async () => {
            await render(framework, el('SaveStatus', { status: 'saving' }));
            expect(screen.getByRole('status')).toHaveTextContent('Saving …');
        });
    });
});
