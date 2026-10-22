import { screen, waitFor, within } from '@testing-library/dom';
import { act, cleanup as cleanupReact } from '@testing-library/react';
import { cleanup as cleanupVue } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, icon, normalize, render, type El, type Framework } from './harness.js';

// Page shell: mega menu, app shell, banner, notification center, page header, bottom navigation, result,
// descriptions, splitter, toolbar areas, speed dial layouts and the layout primitives – in Vue and React

const tick = (ms = 0) => act(() => new Promise((done) => setTimeout(done, ms)));

const megaItems = [
    {
        label: 'Services',
        columns: [
            {
                groups: [
                    {
                        title: 'Operations',
                        items: [
                            { label: 'Hosting', href: '/hosting', description: 'In Frankfurt', icon: icon('House') },
                            { label: 'Cloud', href: '/cloud', badge: 'New' },
                        ],
                        moreHref: '/operations',
                    },
                ],
            },
        ],
        featured: { title: 'Case study: municipal utility', href: '/references/utility' },
        allHref: '/services',
    },
    {
        label: 'Products',
        href: '/products',
        columns: [{ groups: [{ title: 'Software', items: [{ label: 'WireLayer', href: '/wirecore' }] }] }],
    },
    { label: 'Contact', href: '/contact' },
];

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

const openNotifications = [
    { id: 'a', title: 'Backup complete', description: 'web-01', date: '2026-10-21T09:30:00', href: '/backups' },
    { id: 'b', title: 'Invoice ready', date: '2026-10-20T16:00:00', read: true, icon: icon('Mail') },
    { id: 'c', title: 'Certificate expiring', date: '2026-09-01T08:00:00' },
];

describe('open notification panels render the same DOM', () => {
    const cases: [string, El, string][] = [
        [
            'NotificationCenter popover: groups, unread, actions, load more',
            el('NotificationCenter', {
                items: openNotifications,
                now: '2026-10-21T12:00:00',
                open: true,
                hasMore: true,
                loading: true,
            }),
            '[role=dialog]',
        ],
        [
            'NotificationCenter drawer, empty',
            el('NotificationCenter', { items: [], open: true, display: 'drawer', emptyText: 'All done' }),
            '[role=dialog]',
        ],
    ];
    it.each(cases)('%s', async (_, node, ready) => {
        expect(await openDom('vue', node, ready)).toBe(await openDom('react', node, ready));
    });
});

describe.each(frameworks)('%s', (framework) => {
    const onValue = (name: string) =>
        framework === 'vue' ? `onUpdate:${name}` : `on${name[0]!.toUpperCase()}${name.slice(1)}Change`;

    describe('MegaMenu', () => {
        const menu = (props: Record<string, unknown> = {}) => el('MegaMenu', { items: megaItems, ...props });
        const desktop = () => screen.getAllByRole('navigation', { name: 'Main navigation' })[0]!;

        it('is a named navigation of links and disclosure buttons – no menu roles', async () => {
            await render(framework, menu());
            const nav = desktop();
            expect(within(nav).queryByRole('menu')).toBeNull();
            expect(within(nav).queryByRole('menubar')).toBeNull();
            const trigger = within(nav).getByRole('button', { name: 'Services' });
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            // Link with its own chevron button
            expect(within(nav).getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
            expect(within(nav).getByRole('button', { name: 'Products submenu' })).toHaveAttribute(
                'aria-expanded',
                'false'
            );
            // Closed panels are hidden
            expect(within(nav).queryByRole('link', { name: 'Hosting' })).toBeNull();
        });

        it('opens a panel on click: headed groups, descriptions, badges, featured and all links', async () => {
            await render(framework, menu());
            const trigger = within(desktop()).getByRole('button', { name: 'Services' });
            await userEvent.click(trigger);
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
            const list = screen.getByRole('list', { name: 'Operations' });
            expect(screen.getByRole('heading', { name: 'Operations', level: 3 })).toBeInTheDocument();
            expect(within(list).getByRole('link', { name: 'Hosting' })).toHaveAccessibleDescription('In Frankfurt');
            expect(within(list).getByRole('link', { name: /^Cloud\s?New$/ })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Show all: Operations' })).toHaveAttribute('href', '/operations');
            expect(screen.getByRole('link', { name: 'Case study: municipal utility' })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'Show all' })).toHaveAttribute('href', '/services');
        });

        it('keeps one panel open at a time; Escape closes and returns the focus to the trigger', async () => {
            const onChange = vi.fn();
            await render(framework, menu({ [onValue('value')]: onChange }));
            const nav = desktop();
            const services = within(nav).getByRole('button', { name: 'Services' });
            const products = within(nav).getByRole('button', { name: 'Products submenu' });
            await userEvent.click(services);
            await userEvent.click(products);
            expect(services).toHaveAttribute('aria-expanded', 'false');
            expect(products).toHaveAttribute('aria-expanded', 'true');
            expect(onChange).toHaveBeenLastCalledWith('Products');
            screen.getByRole('link', { name: 'WireLayer' }).focus();
            await tick(20);
            await userEvent.keyboard('{Escape}');
            await waitFor(() => expect(products).toHaveAttribute('aria-expanded', 'false'));
            expect(products).toHaveFocus();
        });

        it('a click on a link closes the panel and reports the link', async () => {
            const onNavigate = vi.fn((_, event: Event) => event.preventDefault());
            await render(framework, menu({ onNavigate }));
            const trigger = within(desktop()).getByRole('button', { name: 'Services' });
            await userEvent.click(trigger);
            await tick(20);
            await userEvent.click(screen.getByRole('link', { name: 'Hosting' }));
            expect(onNavigate.mock.calls[0]![0]).toMatchObject({ label: 'Hosting', href: '/hosting' });
            await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
        });

        it('marks only the exactly matching link as the current page', async () => {
            await render(framework, menu({ currentHref: '/hosting', defaultValue: 'Services' }));
            const current = document.querySelectorAll('[aria-current=page]');
            // Panel link (desktop); the drawer is not rendered while closed
            expect(current).toHaveLength(1);
            expect(current[0]).toHaveTextContent('Hosting');
            expect(within(desktop()).getByRole('button', { name: 'Services' })).toHaveAttribute('data-current');
        });

        it('isCurrent decides with the router', async () => {
            await render(framework, menu({ isCurrent: (link: { href?: string }) => link.href === '/contact' }));
            expect(within(desktop()).getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'page');
        });

        it('arrowKeys=false leaves the arrow keys to the page (Tab only)', async () => {
            await render(framework, menu({ arrowKeys: false }));
            const trigger = within(desktop()).getByRole('button', { name: 'Services' });
            trigger.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(trigger).toHaveFocus();
        });

        it('arrow keys move between the entries by default', async () => {
            await render(framework, menu());
            const trigger = within(desktop()).getByRole('button', { name: 'Services' });
            trigger.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(within(desktop()).getByRole('link', { name: 'Products' })).toHaveFocus();
        });

        it('the menu button opens a drawer with one accordion section per entry', async () => {
            const onNavigate = vi.fn((_, event: Event) => event.preventDefault());
            await render(framework, menu({ currentHref: '/cloud', onNavigate }));
            const burger = screen.getByRole('button', { name: 'Menu' });
            expect(burger).toHaveAttribute('aria-expanded', 'false');
            await userEvent.click(burger);
            const drawer = await screen.findByRole('dialog', { name: 'Menu' });
            const nav = within(drawer).getByRole('navigation', { name: 'Main navigation' });
            // The section with the current page starts open
            const section = within(nav).getByRole('button', { name: 'Services' });
            expect(section).toHaveAttribute('aria-expanded', 'true');
            expect(within(nav).getByRole('link', { name: /^Cloud\s?New$/ })).toHaveAttribute('aria-current', 'page');
            await userEvent.click(within(nav).getByRole('button', { name: 'Products' }));
            await userEvent.click(within(nav).getByRole('link', { name: 'Products – overview' }));
            expect(onNavigate.mock.calls[0]![0]).toMatchObject({ href: '/products' });
            await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        });

        it('hover mode opens with the mouse after the delay and closes after leaving', async () => {
            await render(framework, menu({ openOn: 'hover', openDelay: 50, closeDelay: 50 }));
            const trigger = within(desktop()).getByRole('button', { name: 'Services' });
            await userEvent.hover(trigger);
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            await tick(80);
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
            // Moving to the next entry switches at once
            await userEvent.hover(within(desktop()).getByRole('button', { name: 'Products submenu' }));
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            await userEvent.unhover(within(desktop()).getByRole('button', { name: 'Products submenu' }));
            await tick(80);
            expect(within(desktop()).getByRole('button', { name: 'Products submenu' })).toHaveAttribute(
                'aria-expanded',
                'false'
            );
        });
    });

    describe('AppShell', () => {
        const shell = (props: Record<string, unknown> = {}) =>
            el(
                'AppShell',
                {
                    navbarResizable: true,
                    $slots: {
                        header: el('span', {}, 'Admin'),
                        navbar: el('SidebarNav', {
                            label: 'Main navigation',
                            items: [
                                { label: 'Start', href: '/', icon: icon('House'), current: true },
                                { label: 'Messages', href: '/messages', icon: icon('Mail'), badge: 3 },
                            ],
                        }),
                    },
                    ...props,
                },
                el('h1', {}, 'Overview')
            );

        it('resizes the navbar with the keyboard (arrow keys, Shift, Home/End) and remembers the width', async () => {
            localStorage.removeItem('parity-shell');
            const onWidth = vi.fn();
            await render(framework, shell({ storageKey: 'parity-shell', [onValue('navbarWidth')]: onWidth }));
            const handle = screen.getByRole('separator', { name: 'Resize navigation' });
            expect(handle).toHaveAttribute('aria-valuenow', '256');
            expect(handle).toHaveAttribute('aria-valuemin', '200');
            expect(handle).toHaveAttribute('aria-valuemax', '480');
            handle.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(handle).toHaveAttribute('aria-valuenow', '272');
            await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
            expect(handle).toHaveAttribute('aria-valuenow', '208');
            await userEvent.keyboard('{End}');
            expect(handle).toHaveAttribute('aria-valuenow', '480');
            expect(onWidth).toHaveBeenLastCalledWith(480);
            expect(JSON.parse(localStorage.getItem('parity-shell')!)).toMatchObject({ navbarWidth: 480 });
            const base = handle.closest('main')?.parentElement ?? handle.parentElement!.parentElement!;
            expect(base.getAttribute('style')).toContain('--wc-navbar-width: 480px');
            await userEvent.dblClick(handle);
            expect(handle).toHaveAttribute('aria-valuenow', '256');
        });

        it('restores a remembered width and rail state', async () => {
            localStorage.setItem('parity-shell-2', JSON.stringify({ navbarWidth: 320, navbarCollapsed: false }));
            await render(framework, shell({ storageKey: 'parity-shell-2' }));
            await tick();
            expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '320');
        });

        it('folds the navbar into a rail: the labels stay names, the toggle switches its label', async () => {
            const onCollapsed = vi.fn();
            await render(framework, shell({ collapsible: true, [onValue('navbarCollapsed')]: onCollapsed }));
            const toggle = screen.getByRole('button', { name: 'Collapse navigation' });
            await userEvent.click(toggle);
            expect(onCollapsed).toHaveBeenLastCalledWith(true);
            expect(screen.getByRole('button', { name: 'Expand navigation' })).toBeInTheDocument();
            const nav = screen.getByRole('navigation', { name: 'Main navigation' });
            expect(nav).toHaveAttribute('data-rail');
            // The label is visually hidden, the visible badge stays part of the name
            expect(within(nav).getByRole('link', { name: /^Messages\s?3$/ })).toBeInTheDocument();
            expect(within(nav).getByText('Start')).toHaveClass('sr-only');
            // No resize handle on the rail
            expect(screen.queryByRole('separator')).toBeNull();
        });

        it('renders a footer landmark and hides the header on scroll with headroom', async () => {
            await render(framework, shell({ headroom: true, $slots: { footer: el('p', {}, '© 2026') } }));
            expect(screen.getByRole('contentinfo')).toHaveTextContent('© 2026');
            const header = screen.getByRole('banner');
            Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
            window.dispatchEvent(new Event('scroll'));
            await tick();
            expect(header).toHaveAttribute('data-hidden');
            Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
            window.dispatchEvent(new Event('scroll'));
            await tick();
            expect(header).not.toHaveAttribute('data-hidden');
            Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
        });
    });

    describe('Banner', () => {
        it('uses alert for danger and status otherwise', async () => {
            await render(
                framework,
                el('div', {}, el('Banner', { variant: 'danger' }, 'Outage'), el('Banner', {}, 'Info'))
            );
            expect(screen.getByRole('alert')).toHaveTextContent('Outage');
            expect(screen.getByRole('status')).toHaveTextContent('Info');
        });

        it('closes and remembers the dismissal', async () => {
            localStorage.removeItem('parity-banner-key');
            const onDismiss = vi.fn();
            const banner = (): El =>
                el('Banner', { dismissible: true, storageKey: 'parity-banner-key', onDismiss }, 'New features');
            await render(framework, banner());
            await userEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }));
            expect(onDismiss).toHaveBeenCalledOnce();
            expect(screen.queryByText('New features')).toBeNull();
            expect(localStorage.getItem('parity-banner-key')).toBe('"dismissed"');
            await render(framework, banner());
            await tick();
            expect(screen.queryByText('New features')).toBeNull();
        });
    });

    describe('NotificationCenter', () => {
        const items = [
            { id: 'a', title: 'Backup complete', date: '2026-10-21T09:30:00', href: '/backups' },
            { id: 'b', title: 'Invoice ready', date: '2026-10-20T16:00:00', read: true },
            { id: 'c', title: 'Certificate expiring', date: '2026-09-01T08:00:00' },
        ];

        it('shows the unread count in the name of the bell and groups by day', async () => {
            await render(framework, el('NotificationCenter', { items, now: '2026-10-21T12:00:00' }));
            const bell = screen.getByRole('button', { name: 'Notifications, 2 unread' });
            await userEvent.click(bell);
            const panel = await screen.findByRole('dialog', { name: 'Notifications' });
            expect(within(panel).getByRole('list', { name: 'Today' })).toBeInTheDocument();
            expect(within(panel).getByRole('list', { name: 'Yesterday' })).toBeInTheDocument();
            expect(within(panel).getByRole('list', { name: 'Older' })).toBeInTheDocument();
            expect(within(panel).getByRole('link', { name: 'Unread: Backup complete' })).toHaveAttribute(
                'href',
                '/backups'
            );
            expect(within(panel).getByText('Invoice ready')).not.toHaveTextContent('Unread');
        });

        it('marks one or all as read', async () => {
            const onMarkRead = vi.fn();
            const onMarkAllRead = vi.fn();
            await render(
                framework,
                el('NotificationCenter', { items, now: '2026-10-21T12:00:00', onMarkRead, onMarkAllRead, open: true })
            );
            const panel = await screen.findByRole('dialog', { name: 'Notifications' });
            await userEvent.click(within(panel).getByRole('button', { name: 'Mark as read: Backup complete' }));
            expect(onMarkRead).toHaveBeenCalledWith('a');
            await userEvent.click(within(panel).getByRole('button', { name: 'Mark all as read' }));
            expect(onMarkAllRead).toHaveBeenCalledOnce();
        });

        it('shows the empty state and loads more', async () => {
            const onLoadMore = vi.fn();
            await render(framework, el('NotificationCenter', { items: [], hasMore: true, onLoadMore, open: true }));
            const panel = await screen.findByRole('dialog', { name: 'Notifications' });
            expect(within(panel).getByText('No notifications')).toBeInTheDocument();
            expect(within(panel).getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
            await userEvent.click(within(panel).getByRole('button', { name: 'Load more' }));
            expect(onLoadMore).toHaveBeenCalledOnce();
        });
    });

    describe('NotificationCenter with a data source', () => {
        it('loads the first page at the start, more with "Load more", keeps read marks', async () => {
            const pages = [
                [
                    { id: 'a', title: 'Backup complete', date: '2026-10-21T09:30:00' },
                    { id: 'b', title: 'Invoice ready', date: '2026-10-21T08:00:00' },
                ],
                [{ id: 'c', title: 'Certificate expiring', date: '2026-09-01T08:00:00' }],
            ];
            const getItems = vi.fn(async ({ page = 1 }: { page?: number }) => ({
                items: pages[page - 1] ?? [],
                hasMore: page < pages.length,
            }));
            const onMarkRead = vi.fn();
            await render(
                framework,
                el('NotificationCenter', { dataSource: { getItems }, now: '2026-10-21T12:00:00', onMarkRead })
            );
            const bell = await screen.findByRole('button', { name: 'Notifications, 2 unread' });
            await userEvent.click(bell);
            const panel = await screen.findByRole('dialog', { name: 'Notifications' });
            await userEvent.click(within(panel).getByRole('button', { name: 'Load more' }));
            expect(await within(panel).findByText('Certificate expiring')).toBeInTheDocument();
            expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
            await userEvent.click(within(panel).getByRole('button', { name: 'Mark as read: Backup complete' }));
            expect(onMarkRead).toHaveBeenCalledWith('a');
            expect(within(panel).queryByRole('button', { name: 'Mark as read: Backup complete' })).toBeNull();
            expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeInTheDocument();
            expect(within(panel).queryByRole('button', { name: 'Load more' })).toBeNull();
        });
    });

    describe('PageHeader, BottomNavigation, Result, Descriptions', () => {
        it('PageHeader: heading, status, back link', async () => {
            const onBack = vi.fn((event: Event) => event.preventDefault());
            await render(
                framework,
                el('PageHeader', {
                    title: 'Server web-01',
                    status: 'Online',
                    backHref: '/server',
                    onBack,
                    $slots: { actions: el('Button', {}, 'Restart') },
                })
            );
            expect(screen.getByRole('heading', { level: 1, name: 'Server web-01' })).toBeInTheDocument();
            expect(screen.getByText('Online')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('link', { name: 'Back' }));
            expect(onBack).toHaveBeenCalledOnce();
        });

        it('BottomNavigation: aria-current on the exact match, badge in the name, navigate event', async () => {
            const onNavigate = vi.fn((_, event: Event) => event.preventDefault());
            await render(
                framework,
                el('BottomNavigation', {
                    items: [
                        { label: 'Start', href: '/', icon: icon('House') },
                        { label: 'Messages', href: '/messages', icon: icon('Mail'), badge: 4 },
                    ],
                    currentHref: '/messages',
                    onNavigate,
                })
            );
            const nav = screen.getByRole('navigation', { name: 'Navigation' });
            expect(within(nav).getByRole('link', { name: /^4\s?Messages$/ })).toHaveAttribute('aria-current', 'page');
            expect(within(nav).getByRole('link', { name: 'Start' })).not.toHaveAttribute('aria-current');
            await userEvent.click(within(nav).getByRole('link', { name: 'Start' }));
            expect(onNavigate.mock.calls[0]![0]).toMatchObject({ href: '/' });
        });

        it('Result: default texts per status and the code', async () => {
            await render(framework, el('Result', { status: '404', headingLevel: 1 }));
            expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
            expect(screen.getByText('404')).toBeInTheDocument();
            expect(screen.getByText('The page does not exist or has been moved.')).toBeInTheDocument();
        });

        it('Descriptions: terms and values; in edit mode the inputs are labelled by the term', async () => {
            const items = [{ id: 'customer', label: 'Customer', value: 'North Utilities' }];
            await render(
                framework,
                el('Descriptions', {
                    items,
                    editing: true,
                    $scoped: {
                        'edit-customer': {
                            react: 'renderEdit',
                            args: (item: unknown, state: { labelId: string }) => ({ item, ...state }),
                            render: ({ labelId }: { labelId: string }) => el('Input', { 'aria-labelledby': labelId }),
                        },
                    },
                })
            );
            expect(screen.getByRole('term')).toHaveTextContent('Customer');
            expect(screen.getByRole('textbox', { name: 'Customer' })).toBeInTheDocument();
        });
    });

    describe('Splitter', () => {
        const panels = [
            { id: 'nav', label: 'Navigation', defaultSize: 30 },
            { id: 'main', label: 'Contents' },
        ];

        it('a double click on the handle resets the sizes and remembers them', async () => {
            localStorage.setItem('parity-split-reset', JSON.stringify([40, 60]));
            const onResizeEnd = vi.fn();
            await render(
                framework,
                el('Splitter', { panels, storageKey: 'parity-split-reset', onResizeEnd, children: () => null })
            );
            const handle = screen.getByRole('separator', { name: 'Resize “Navigation”' });
            await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '40'));
            await userEvent.dblClick(handle);
            await waitFor(() => expect(handle).toHaveAttribute('aria-valuenow', '30'));
            expect(JSON.parse(localStorage.getItem('parity-split-reset')!)).toEqual([30, 70]);
            expect(onResizeEnd).toHaveBeenLastCalledWith([30, 70]);
        });

        it('remembers the sizes', async () => {
            localStorage.setItem('parity-split', JSON.stringify([40, 60]));
            await render(framework, el('Splitter', { panels, storageKey: 'parity-split', children: () => null }));
            await waitFor(() => expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '40'));
        });
    });

    describe('Toolbar, SpeedDial, layout', () => {
        it('Toolbar areas share one tab stop; arrow keys cross the areas and toggle buttons', async () => {
            await render(
                framework,
                el(
                    'Toolbar',
                    {
                        label: 'Editor',
                        $slots: {
                            center: el(
                                'ButtonGroup',
                                { 'aria-label': 'Alignment' },
                                el('ToggleButton', { defaultPressed: true }, 'Links'),
                                el('ToggleButton', {}, 'Right')
                            ),
                            end: el('Button', {}, 'Save'),
                        },
                    },
                    el('Button', {}, 'New')
                )
            );
            const first = screen.getByRole('button', { name: 'New' });
            const buttons = within(screen.getByRole('toolbar', { name: 'Editor' })).getAllByRole('button');
            expect(buttons.filter((button) => button.tabIndex === 0)).toEqual([first]);
            first.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(screen.getByRole('button', { name: 'Links' })).toHaveFocus();
            await userEvent.keyboard('{ArrowRight}{ArrowRight}');
            expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
            await userEvent.keyboard('{ArrowLeft} ');
            expect(screen.getByRole('button', { name: 'Right' })).toHaveAttribute('aria-pressed', 'true');
        });

        it('SpeedDial circle places the actions around the button', async () => {
            await render(
                framework,
                el('SpeedDial', {
                    items: [
                        { value: 'a', label: 'New', icon: icon('Plus') },
                        { value: 'b', label: 'Send', icon: icon('Mail') },
                    ],
                    layout: 'semicircle',
                    radius: 100,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
            const items = await screen.findAllByRole('menuitem');
            expect(items[0]).toHaveTextContent('New');
            expect(items[0]!.getAttribute('style')).toContain('--wc-x: -100px');
            expect(items[1]!.getAttribute('style')).toContain('--wc-x: 100px');
        });

        it('Collapse marks its state; Scroller is a named, focusable region', async () => {
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('Collapse', { open: false, 'data-testid': 'collapse' }, 'More'),
                    el('Scroller', { label: 'Categories' }, el('span', {}, 'Hosting'))
                )
            );
            expect(screen.getByTestId('collapse')).toHaveAttribute('data-state', 'closed');
            expect(screen.getByRole('region', { name: 'Categories' })).toHaveAttribute('tabindex', '0');
        });
    });
});
