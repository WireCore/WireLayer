import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Buttons, surfaces and display components: colours, badges, chips, alerts, cards, timeline

describe.each(frameworks)('%s', (framework) => {
    it('Button badge: the visible counter is part of the name', async () => {
        await render(framework, el('Button', { badge: 4 }, 'Alerts'));
        // Browsers separate the visually hidden text with a space ("Alerts 4 new"), jsdom does not
        expect(screen.getByRole('button', { name: /^Alerts ?4 new$/ })).toBeInTheDocument();
    });

    it('ButtonGroup is a named group', async () => {
        await render(framework, el('ButtonGroup', { label: 'View' }, el('Button', {}, 'Day')));
        const group = screen.getByRole('group', { name: 'View' });
        expect(within(group).getByRole('button', { name: 'Day' })).toBeInTheDocument();
    });

    it('Chip: the remove button is named after the label and reports the click', async () => {
        const onRemove = vi.fn();
        await render(framework, el('Chip', { label: 'Frankfurt', removable: true, onRemove }));
        const remove = screen.getByRole('button', { name: 'Remove Frankfurt' });
        remove.focus();
        await userEvent.keyboard('{Enter}');
        expect(onRemove).toHaveBeenCalledOnce();
        await userEvent.click(remove);
        expect(onRemove).toHaveBeenCalledTimes(2);
    });

    it('Chip inside a ChipGroup stays a toggle option', async () => {
        await render(
            framework,
            el('ChipGroup', { label: 'Filters' }, el('Chip', { value: 'a', removable: true }, 'A'))
        );
        expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    });

    it('Alert with duration dismisses itself, paused while hovered or focused (WCAG 2.2.1)', async () => {
        // shouldAdvanceTime: rendering waits for a real task; the alert's minute is long enough not to notice
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'], shouldAdvanceTime: true });
        try {
            const onDismiss = vi.fn();
            await render(framework, el('Alert', { title: 'Copied', duration: 60_000, dismissible: true, onDismiss }));
            const alert = screen.getByRole('status');
            fireEvent.mouseEnter(alert);
            fireEvent.mouseOver(alert);
            await act(async () => vi.advanceTimersByTime(120_000));
            expect(onDismiss).not.toHaveBeenCalled();
            fireEvent.mouseLeave(alert);
            fireEvent.mouseOut(alert);
            fireEvent.focusIn(within(alert).getByRole('button'));
            await act(async () => vi.advanceTimersByTime(120_000));
            expect(onDismiss).not.toHaveBeenCalled();
            fireEvent.focusOut(within(alert).getByRole('button'));
            await act(async () => vi.advanceTimersByTime(50_000));
            expect(onDismiss).not.toHaveBeenCalled();
            await act(async () => vi.advanceTimersByTime(10_000));
            expect(onDismiss).toHaveBeenCalledOnce();
        } finally {
            vi.useRealTimers();
        }
    });

    it('Card title is a heading of the chosen level', async () => {
        await render(framework, el('Card', { title: 'Hosting', titleTag: 'h2', subtitle: 'Frankfurt' }, 'string'));
        expect(screen.getByRole('heading', { level: 2, name: 'Hosting' })).toBeInTheDocument();
    });

    it('Timeline marks the active event', async () => {
        await render(
            framework,
            el('Timeline', {
                label: 'History',
                activeIndex: 1,
                items: [
                    { time: '1', title: 'Submitted' },
                    { time: '2', title: 'Reviewed' },
                ],
            })
        );
        const items = within(screen.getByRole('list', { name: 'History' })).getAllByRole('listitem');
        expect(items[0]).not.toHaveAttribute('aria-current');
        expect(items[1]).toHaveAttribute('aria-current', 'step');
    });

    it('Tabs: Delete closes a closable tab and the focus moves to its neighbour', async () => {
        const onClose = vi.fn();
        const tabs = (closed: boolean) =>
            el(
                'Tabs',
                { defaultValue: 'b', label: 'Files' },
                el(
                    'TabsList',
                    {},
                    el('TabsTrigger', { value: 'a', closable: true, onClose }, 'A'),
                    ...(closed ? [] : [el('TabsTrigger', { value: 'b', closable: true, onClose }, 'B')]),
                    el('TabsTrigger', { value: 'c' }, 'C')
                ),
                el('TabsContent', { value: 'a' }, 'Content A')
            );
        await render(framework, tabs(false));
        const b = screen.getByRole('tab', { name: 'B' });
        expect(b).toHaveAttribute('aria-keyshortcuts', 'Delete');
        b.focus();
        await userEvent.keyboard('{Delete}');
        expect(onClose).toHaveBeenCalledWith('b');
        // The close button is for the pointer only: hidden from assistive tech, no tab stop
        const [close] = screen.getByRole('tablist').querySelectorAll('button[aria-hidden="true"]');
        expect(close).toHaveAttribute('tabindex', '-1');
        await userEvent.click(close!);
        expect(onClose).toHaveBeenLastCalledWith('a');
    });

    it('Tabs list items are only tabs (the close buttons are hidden)', async () => {
        await render(
            framework,
            el(
                'Tabs',
                { defaultValue: 'a' },
                el('TabsList', {}, el('TabsTrigger', { value: 'a', closable: true }, 'A')),
                el('TabsContent', { value: 'a' }, 'Contents')
            )
        );
        expect(within(screen.getByRole('tablist')).getAllByRole('tab')).toHaveLength(1);
        expect(within(screen.getByRole('tablist')).queryAllByRole('button')).toHaveLength(0);
    });

    it('Breadcrumb maxItems: the middle steps are in the "…" menu', async () => {
        const onNavigate = vi.fn();
        await render(
            framework,
            el('Breadcrumb', {
                maxItems: 3,
                onNavigate,
                items: [
                    { label: 'Start', href: '/' },
                    { label: 'Services', href: '/services' },
                    { label: 'Hosting', href: '/hosting' },
                    { label: 'Pricing', current: true },
                ],
            })
        );
        const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
        expect(
            within(nav)
                .getAllByRole('link')
                .map((link) => link.textContent)
        ).toEqual(['Start']);
        expect(within(nav).getByText('Pricing')).toHaveAttribute('aria-current', 'page');
        await userEvent.click(within(nav).getByRole('button', { name: 'Hidden levels' }));
        const items = await screen.findAllByRole('menuitem');
        expect(items.map((item) => item.textContent?.trim())).toEqual(['Services', 'Hosting']);
        await userEvent.click(items[1]!);
        expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ label: 'Hosting', href: '/hosting' }));
    });

    it('Rating allowClear: clicking the chosen star again clears it, Delete as well', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Rating', {
                label: 'Bewertung',
                defaultValue: 3,
                allowClear: true,
                [framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange']: onChange,
            })
        );
        const third = screen.getByRole('radio', { name: '3 stars' });
        await userEvent.click(third);
        expect(onChange).toHaveBeenLastCalledWith(0);
        await userEvent.click(screen.getByRole('radio', { name: '2 stars' }));
        expect(onChange).toHaveBeenLastCalledWith(2);
        const second = screen.getByRole('radio', { name: '2 stars' });
        fireEvent.keyDown(second, { key: 'Delete' });
        await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(0));
    });

    it('ScrollPanel reports reaching the end and the start once', async () => {
        const onReachEnd = vi.fn();
        const onReachStart = vi.fn();
        await render(framework, el('ScrollPanel', { label: 'Log', onReachEnd, onReachStart }, el('p', {}, 'Lines')));
        const viewport = screen.getByRole('region', { name: 'Log' });
        Object.defineProperties(viewport, {
            scrollHeight: { configurable: true, value: 500 },
            clientHeight: { configurable: true, value: 100 },
        });
        const scrollTo = (top: number) => {
            viewport.scrollTop = top;
            fireEvent.scroll(viewport);
        };
        scrollTo(200);
        scrollTo(400);
        scrollTo(400);
        expect(onReachEnd).toHaveBeenCalledOnce();
        scrollTo(0);
        expect(onReachStart).toHaveBeenCalledOnce();
    });

    it('Fieldset collapsible: the legend button shows and hides the fields; disabled reaches every field', async () => {
        const onOpen = vi.fn();
        await render(
            framework,
            el(
                'Fieldset',
                {
                    legend: 'Delivery address',
                    collapsible: true,
                    disabled: true,
                    [framework === 'vue' ? 'onUpdate:open' : 'onOpenChange']: onOpen,
                },
                el('Field', { label: 'City' }, el('Input', {}))
            )
        );
        const toggle = screen.getByRole('button', { name: 'Delivery address' });
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(toggle).toBeEnabled();
        expect(screen.getByRole('textbox', { name: 'City' })).toBeDisabled();
        await userEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(onOpen).toHaveBeenCalledWith(false);
        expect(screen.queryByRole('textbox', { name: 'City' })).not.toBeInTheDocument();
    });

    it('Switch track labels follow the state', async () => {
        await render(framework, el('Switch', { onLabel: 'On', offLabel: 'Off' }, 'Notifications'));
        expect(screen.getByText('Off')).toHaveAttribute('aria-hidden', 'true');
        await userEvent.click(screen.getByRole('switch', { name: 'Notifications' }));
        expect(screen.getByText('On')).toBeInTheDocument();
        expect(screen.queryByText('Off')).not.toBeInTheDocument();
    });

    it('Highlight with whole words and colours marks only the words', async () => {
        await render(
            framework,
            el(
                'p',
                {},
                el('Highlight', {
                    text: 'Webserver and Server',
                    query: 'server',
                    wholeWord: true,
                    colors: ['info'],
                })
            )
        );
        const marks = document.querySelectorAll('mark');
        expect([...marks].map((mark) => mark.textContent)).toEqual(['Server']);
        expect(marks[0]).toHaveClass('bg-info/25');
    });
});
