import { screen, waitFor, within } from '@testing-library/dom';
import { act, render as renderReact } from '@testing-library/react';
import { render as renderVue } from '@testing-library/vue';
import { ChatMessages as ReactChatMessages } from '@wirecore/wirelayer-react';
import { ChatMessages as VueChatMessages } from '@wirecore/wirelayer-vue';
import { createElement } from 'react';
import { h, nextTick, shallowRef } from 'vue';
import userEvent from '@testing-library/user-event';
import { announcer } from '@wirecore/wirelayer-recipes';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { el, frameworks, render, type Framework } from './harness.js';

// App patterns, chat, Markdown, auth, charts, code blocks and editor tools in Vue and React (jsdom); dragging,
// menus at the selection and the brush run in the browser tests (e2e/apps-patterns.spec.ts)

const tick = (ms = 0) => act(() => new Promise((done) => setTimeout(done, ms)));
const region = () =>
    document.querySelector('[data-wc-announcer] [role=status]') ?? screen.queryAllByRole('status').at(-1);
const announced = () =>
    [...document.querySelectorAll('[data-wc-announcer] [role=status], [data-wc-announcer] [role=alert]')]
        .map((node) => node.textContent)
        .join(' ');

/** ChatMessages whose messages change later (the harness renders once) */
async function mountChat(framework: Framework, initial: unknown[]) {
    const now = '2026-10-20T12:00:00';
    if (framework === 'vue') {
        const messages = shallowRef(initial);
        renderVue({ render: () => h(VueChatMessages as never, { messages: messages.value, now }) });
        await nextTick();
        return async (next: unknown[]) => {
            messages.value = next;
            await nextTick();
            await tick();
        };
    }
    const view = renderReact(createElement(ReactChatMessages as never, { messages: initial, now }));
    await tick();
    return async (next: unknown[]) => {
        view.rerender(createElement(ReactChatMessages as never, { messages: next, now }));
        await tick();
    };
}

afterEach(() => {
    announcer.reset();
    vi.useRealTimers();
});

const cards = [
    { id: 'a', label: 'Login page' },
    { id: 'b', label: 'Backup' },
];

describe.each(frameworks)('%s', (framework) => {
    const onModel = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';

    describe('Kanban', () => {
        const columns = () => [
            { id: 'open', title: 'To do', items: [...cards], limit: 3 },
            { id: 'done', title: 'Done', items: [], limit: 1, hasMore: true },
        ];

        it('moves a card into the next column with Space and arrows; reports the move with columns', async () => {
            const onColumns = vi.fn();
            const onMove = vi.fn();
            await render(
                framework,
                el('Kanban', {
                    defaultColumns: columns(),
                    [framework === 'vue' ? 'onUpdate:columns' : 'onColumnsChange']: onColumns,
                    onMove,
                })
            );
            expect(screen.getByRole('group', { name: 'Board' })).toBeInTheDocument();
            expect(screen.getByRole('region', { name: 'To do' })).toHaveTextContent('2 cards, limit 3');
            screen.getByRole('button', { name: 'Move Login page' }).focus();
            await userEvent.keyboard(' ');
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(region()).toHaveTextContent('Login page in Done, position 1 of 1.'));
            const last = onColumns.mock.lastCall![0] as { id: string; items: unknown[] }[];
            expect(last.map((column) => column.items.length)).toEqual([1, 1]);
            await userEvent.keyboard(' ');
            expect(onMove).toHaveBeenCalledWith({
                item: cards[0],
                from: { column: 'open', index: 0 },
                to: { column: 'done', index: 0 },
            });
            // The target column is at its WIP limit now
            await waitFor(() =>
                expect(
                    within(screen.getByRole('region', { name: 'Done' })).getByText('WIP limit reached')
                ).toBeInTheDocument()
            );
        });

        it('collapses a column; "Load more" asks for more cards', async () => {
            const onLoadMore = vi.fn();
            const onCollapse = vi.fn();
            await render(framework, el('Kanban', { defaultColumns: columns(), onLoadMore, onCollapse }));
            await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
            expect(onLoadMore).toHaveBeenCalledWith('done');
            const collapse = screen.getByRole('button', { name: 'Collapse To do' });
            expect(collapse).toHaveAttribute('aria-expanded', 'true');
            await userEvent.click(collapse);
            expect(onCollapse).toHaveBeenCalledWith('open', true);
            const expand = screen.getByRole('button', { name: 'Expand To do' });
            expect(expand).toHaveAttribute('aria-expanded', 'false');
            expect(screen.queryByRole('button', { name: 'Move Login page' })).toBeNull();
            expect(screen.getByRole('region', { name: 'To do (2/3)' })).toBeInTheDocument();
        });

        it('shows the exceeded WIP limit as text', async () => {
            await render(
                framework,
                el('Kanban', { defaultColumns: [{ id: 'x', title: 'Test', items: cards, limit: 1 }] })
            );
            expect(screen.getByRole('status')).toHaveTextContent('WIP limit exceeded: 2 of 1');
        });
    });

    describe('ChatPrompt', () => {
        it('Enter sends the trimmed text and clears the field; Shift+Enter adds a line', async () => {
            const onSubmit = vi.fn();
            await render(framework, el('ChatPrompt', { onSubmit }));
            const field = screen.getByRole('textbox', { name: 'Message' });
            expect(field).toHaveAccessibleDescription('Enter sends, Shift+Enter for a new line');
            const send = screen.getByRole('button', { name: 'Send' });
            expect(send).toHaveAttribute('aria-disabled', 'true');
            await userEvent.click(field);
            await userEvent.keyboard('{Enter}');
            expect(onSubmit).not.toHaveBeenCalled();
            await userEvent.keyboard(' Hello{Shift>}{Enter}{/Shift}World ');
            expect(field).toHaveValue(' Hello\nWorld ');
            expect(send).not.toHaveAttribute('aria-disabled');
            await userEvent.keyboard('{Enter}');
            expect(onSubmit).toHaveBeenCalledWith({ text: 'Hello\nWorld', files: [] });
            expect(field).toHaveValue('');
        });

        it('while replying a stop button; files can be attached and removed', async () => {
            const onStop = vi.fn();
            const onFiles = vi.fn();
            await render(
                framework,
                el('ChatPrompt', {
                    responding: true,
                    attachments: true,
                    onStop,
                    [framework === 'vue' ? 'onUpdate:files' : 'onFilesChange']: onFiles,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Stop reply' }));
            expect(onStop).toHaveBeenCalled();
            const file = new File(['a'], 'note.txt', { type: 'text/plain' });
            await userEvent.upload(document.querySelector<HTMLInputElement>('input[type=file]')!, file);
            expect(onFiles).toHaveBeenLastCalledWith([file]);
            await userEvent.click(await screen.findByRole('button', { name: 'Remove note.txt' }));
            expect(onFiles).toHaveBeenLastCalledWith([]);
        });
    });

    describe('ChatMessages', () => {
        const base = [{ id: 1, text: 'Hello', author: 'Anna', time: '2026-10-20T09:00:00' }];

        it('is a named log; announces new messages of others, streamed ones only when complete', async () => {
            const update = await mountChat(framework, base);
            const log = screen.getByRole('log', { name: 'Messages' });
            expect(log).toHaveTextContent('Today');
            expect(log).toHaveAttribute('aria-live', 'off');
            await update([...base, { id: 2, text: 'Thanks', own: true }]);
            await update([
                ...base,
                { id: 2, text: 'Thanks', own: true },
                { id: 3, text: '**Welcome**', author: 'Ben' },
            ]);
            await waitFor(() => expect(region()).toHaveTextContent('Ben: Welcome'));
            expect(announced()).not.toContain('Thanks');
            const streaming = { id: 4, text: 'The rep', author: 'Assistant', streaming: true };
            const before = [...base, streaming];
            await update(before);
            await tick(200);
            expect(announced()).not.toContain('The rep');
            await update([...base, { ...streaming, text: 'The reply is done.', streaming: false }]);
            await waitFor(() => expect(region()).toHaveTextContent('Assistant: The reply is done.'));
        });

        it('scrolled up: new messages are counted on a button that leads to them', async () => {
            const update = await mountChat(framework, base);
            const log = screen.getByRole('log');
            Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
            Object.defineProperty(log, 'clientHeight', { configurable: true, value: 200 });
            log.scrollTop = 100;
            log.dispatchEvent(new Event('scroll'));
            await tick();
            await update([...base, { id: 2, text: 'New', author: 'Anna' }, { id: 3, text: 'One more', author: 'Ben' }]);
            const jump = await screen.findByRole('button', { name: 'Jump to new messages (2 new messages)' });
            await userEvent.click(jump);
            expect(log.scrollTop).toBe(1000);
            expect(log).toHaveFocus();
            expect(screen.queryByRole('button', { name: /Jump to new messages/ })).toBeNull();
        });

        it('streaming: aria-busy and the writing hint; an own message is not announced', async () => {
            await render(
                framework,
                el('ChatMessages', {
                    messages: [...base, { id: 2, text: 'Rep', author: 'Assistant', streaming: true }],
                })
            );
            expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'true');
            expect(screen.getByText('Writing a reply')).toBeInTheDocument();
            expect(screen.getAllByRole('article')[1]).toHaveAttribute('aria-busy', 'true');
        });
    });

    describe('Markdown', () => {
        it('renders no HTML from the text and only safe links', async () => {
            const view = await render(
                framework,
                el('Markdown', {
                    source: '<b onmouseover="x()">bold?</b> [good](https://x.de) [evil](javascript:alert(1)) <script>alert(1)</script>',
                })
            );
            expect(view.querySelector('b, script, [onmouseover]')).toBeNull();
            expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['https://x.de']);
            expect(screen.getByRole('link', { name: 'good' })).toHaveAttribute('rel', 'noopener noreferrer nofollow');
            expect(view).toHaveTextContent('<b onmouseover="x()">bold?</b>');
            expect(view).toHaveTextContent('evil');
        });
    });

    describe('AuthForm', () => {
        it('checks the fields on submit: summary with links, then valid values go out', async () => {
            const onSubmit = vi.fn();
            await render(framework, el('AuthForm', { onSubmit }));
            expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
            expect(onSubmit).not.toHaveBeenCalled();
            const summary = await screen.findByRole('alert');
            await waitFor(() => expect(summary).toHaveFocus());
            expect(
                within(summary)
                    .getAllByRole('link')
                    .map((link) => link.textContent)
            ).toEqual(['Required', 'Required']);
            const email = screen.getByRole('textbox', { name: /E-mail address/ });
            expect(email).toHaveAttribute('aria-invalid', 'true');
            await userEvent.type(email, 'anna@');
            expect(await within(summary).findByText('Please enter a valid email address')).toBeInTheDocument();
            await userEvent.type(email, 'wirecore.de');
            await userEvent.type(screen.getByLabelText(/^Password/, { selector: 'input' }), 'secret');
            await userEvent.click(screen.getByRole('checkbox', { name: 'Keep me signed in' }));
            await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
            expect(onSubmit).toHaveBeenCalledWith({
                mode: 'signIn',
                name: '',
                email: 'anna@wirecore.de',
                password: 'secret',
                code: '',
                remember: true,
            });
        });

        it('switches to sign-up (password length, own validators) and moves the focus to the heading', async () => {
            const onMode = vi.fn();
            await render(
                framework,
                el('AuthForm', {
                    [framework === 'vue' ? 'onUpdate:mode' : 'onModeChange']: onMode,
                    validators: {
                        email: (value: string) => (value.endsWith('.de') ? undefined : 'Only .de addresses'),
                    },
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));
            expect(onMode).toHaveBeenCalledWith('signUp');
            await waitFor(() => expect(screen.getByRole('heading', { name: 'Create account' })).toHaveFocus());
            await userEvent.type(screen.getByRole('textbox', { name: /^Name/ }), 'Anna');
            await userEvent.type(screen.getByRole('textbox', { name: /E-mail address/ }), 'anna@example.com');
            await userEvent.type(screen.getByLabelText(/^Password/, { selector: 'input' }), 'short');
            await userEvent.click(screen.getByRole('button', { name: 'Sign up' }));
            const summary = await screen.findByRole('alert');
            expect(summary).toHaveTextContent('Only .de addresses');
            expect(summary).toHaveTextContent('At least 8 characters');
            await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
            expect(onMode).toHaveBeenLastCalledWith('signIn');
        });
    });

    describe('chart text alternatives', () => {
        it('BarChart: a table with the formatted values of the shown range; reference values as text', async () => {
            await render(
                framework,
                el('BarChart', {
                    title: 'Revenue',
                    categoryKey: 'm',
                    data: [
                        { m: 'Jan', a: 1200 },
                        { m: 'Feb', a: 1500 },
                        { m: 'Mar', a: 900 },
                    ],
                    series: [{ key: 'a', label: 'Revenue' }],
                    formatValue: (value: number) => `${value / 1000}k`,
                    references: [{ value: 1000, label: 'Target' }],
                    brush: true,
                    defaultRange: [1, 2],
                })
            );
            expect(screen.getByRole('img', { name: 'Revenue' })).toBeInTheDocument();
            expect(screen.getByText('Reference values: Target: 1k')).toBeInTheDocument();
            const table = screen.getByRole('table', { hidden: true });
            expect(
                within(table)
                    .getAllByRole('row', { hidden: true })
                    .map((row) => row.textContent)
            ).toEqual(['CategoryRevenue', 'Feb1.5k', 'Mar0.9k']);
            expect(screen.getAllByRole('slider').map((slider) => slider.getAttribute('aria-valuetext'))).toEqual([
                'Feb',
                'Mar',
            ]);
        });

        it('WaterfallChart, PieChart, Funnel, BulletChart and RadialBar tell their values in text', async () => {
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('WaterfallChart', {
                        title: 'Result',
                        steps: [
                            { label: 'Revenue', value: 500 },
                            { label: 'Costs', value: -320 },
                            { label: 'Result', total: true },
                        ],
                    }),
                    el('PieChart', {
                        title: 'Status',
                        slices: [
                            { label: 'Open', value: 1 },
                            { label: 'Done', value: 3 },
                        ],
                    }),
                    el('Funnel', {
                        title: 'Shop',
                        stages: [
                            { label: 'Visit', value: 200 },
                            { label: 'Purchase', value: 50 },
                        ],
                    }),
                    el('BulletChart', { label: 'Revenue', value: 270, target: 250, max: 300 }),
                    el('RadialBar', { label: 'Goals', items: [{ label: 'Revenue', value: 72 }] })
                )
            );
            const rows = (name: string) =>
                within(screen.getByRole('table', { name, hidden: true }))
                    .getAllByRole('row', { hidden: true })
                    .map((row) => row.textContent);
            expect(rows('Result')).toEqual(['CategoryChangeTotal', 'Revenue500500', 'Costs-320180', 'Result–180']);
            expect(rows('Status')).toEqual(['CategoryValueShare', 'Open125%', 'Done375%']);
            expect(within(screen.getByRole('list', { name: 'Legend' })).getAllByRole('listitem')[1]).toHaveTextContent(
                'Done3 · 75%'
            );
            expect(rows('Shop')).toEqual(['StageValueConversion', 'Visit200–', 'Purchase5025%']);
            expect(screen.getByText(/^25% of the previous stage$/)).toBeInTheDocument();
            expect(screen.getByRole('meter', { name: 'Revenue' })).toHaveAttribute(
                'aria-valuetext',
                '270 of 300, target 250'
            );
            expect(within(screen.getByRole('group', { name: 'Goals' })).getByRole('listitem')).toHaveTextContent(
                'Revenue72%'
            );
        });
    });

    describe('code blocks', () => {
        it('wrap toggle, expandable long code, diff lines for screen readers', async () => {
            const onWrap = vi.fn();
            await render(
                framework,
                el('CodeHighlight', {
                    code: '-alt\n+neu',
                    language: 'text',
                    fileName: 'patch.diff',
                    diff: true,
                    wrapToggle: true,
                    maxHeight: '3rem',
                    expandable: true,
                    [framework === 'vue' ? 'onUpdate:wrap' : 'onWrapChange']: onWrap,
                })
            );
            const wrap = screen.getByRole('button', { name: 'Wrap lines' });
            expect(wrap).toHaveAttribute('aria-pressed', 'false');
            await userEvent.click(wrap);
            expect(onWrap).toHaveBeenCalledWith(true);
            expect(wrap).toHaveAttribute('aria-pressed', 'true');
            const more = screen.getByRole('button', { name: 'Show all code' });
            const code = document.getElementById(more.getAttribute('aria-controls')!)!;
            expect(code.style.maxHeight).toBe('3rem');
            await userEvent.click(more);
            expect(screen.getByRole('button', { name: 'Collapse code' })).toHaveAttribute('aria-expanded', 'true');
            expect(code.style.maxHeight).toBe('');
            expect(code).toHaveTextContent(/removed: -alt\s*added: \+neu/);
        });

        it('CodeHighlightTabs: tabs with the file names, arrow keys select, the copy button follows', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('CodeHighlightTabs', {
                    files: [
                        { name: 'App.vue', code: 'a', language: 'text' },
                        { name: 'main.ts', code: 'b', language: 'text' },
                    ],
                    [onModel]: onChange,
                })
            );
            const tabs = screen.getAllByRole('tab');
            expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['true', 'false']);
            expect(screen.getByRole('tabpanel', { name: 'App.vue' })).toHaveTextContent('a');
            tabs[0]!.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(onChange).toHaveBeenCalledWith('main.ts');
            await waitFor(() => expect(screen.getByRole('tab', { name: 'main.ts' })).toHaveFocus());
            expect(screen.getByRole('tabpanel', { name: 'main.ts' })).toHaveTextContent('b');
            expect(screen.getByRole('button', { name: 'Copy code: main.ts' })).toBeInTheDocument();
            await userEvent.keyboard('{Home}');
            expect(onChange).toHaveBeenLastCalledWith('App.vue');
        });

        it('InlineCode is coloured once Shiki has the tokens', async () => {
            const view = await render(framework, el('InlineCode', { code: 'const a = 1', language: 'ts' }));
            await waitFor(() => expect(view.querySelector('code span[style*="--wc-code-token"]')).not.toBeNull(), {
                timeout: 4000,
            });
            expect(view.querySelector('code')).toHaveTextContent('const a = 1');
        });
    });

    describe('Editor tools', () => {
        it('read-only: no toolbar, a read-only textbox', async () => {
            await render(
                framework,
                el('Editor', { 'aria-label': 'Contract', readonly: true, defaultValue: '<p>Text</p>' })
            );
            const box = await screen.findByRole('textbox', { name: 'Contract' });
            expect(box).toHaveAttribute('aria-readonly', 'true');
            expect(screen.queryByRole('toolbar')).toBeNull();
        });

        it('counter, table of contents and HTML source mode (cleaned when leaving it)', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('Editor', {
                    'aria-label': 'Report',
                    counter: true,
                    maxLength: 50,
                    tableOfContents: true,
                    toolbar: ['bold', 'source'],
                    defaultValue: '<h2>Introduction</h2><p>Two words</p>',
                    [onModel]: onChange,
                })
            );
            await waitFor(() => expect(screen.getByText('21 of 50 characters')).toBeInTheDocument());
            expect(screen.getByText('3 words')).toBeInTheDocument();
            const toc = screen.getByRole('navigation', { name: 'Table of contents' });
            expect(within(toc).getByRole('button', { name: 'Introduction' })).toBeInTheDocument();
            const source = screen.getByRole('button', { name: 'HTML source' });
            await userEvent.click(source);
            expect(source).toHaveAttribute('aria-pressed', 'true');
            expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled();
            const field = screen.getByRole('textbox', { name: 'Edit HTML source' });
            expect(field).toHaveValue('<h2>Introduction</h2><p>Two words</p>');
            await userEvent.clear(field);
            await userEvent.type(field, '<p onclick="x()">New<script>alert(1)</script></p>');
            await userEvent.click(source);
            await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('<p>New</p>'));
            expect(screen.queryByRole('textbox', { name: 'Edit HTML source' })).toBeNull();
        });

        it('alignment tools are toggle buttons that change the paragraph', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('Editor', {
                    'aria-label': 'Text',
                    toolbar: ['alignLeft', 'alignCenter', 'subscript', 'details', 'textColor'],
                    defaultValue: '<p>Hello</p>',
                    [onModel]: onChange,
                })
            );
            const center = await screen.findByRole('button', { name: 'Centre' });
            expect(center).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+E');
            await userEvent.click(center);
            await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('<p style="text-align: center;">Hello</p>'));
            expect(center).toHaveAttribute('aria-pressed', 'true');
            const color = screen.getByRole('button', { name: 'Text colour' });
            await userEvent.click(color);
            const palette = screen.getByRole('group', { name: 'Text colour' });
            expect(
                within(palette)
                    .getAllByRole('button')
                    .map((button) => button.getAttribute('aria-label'))
            ).toEqual(['Default', 'Accent', 'Info', 'Success', 'Warning', 'Error', 'Muted']);
            await userEvent.keyboard('{Escape}');
            expect(color).toHaveFocus();
        });
    });

    describe('SessionTimeout', () => {
        it('warns before the end with the time left; "Stay signed in" extends, the end is reported', async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const onExtend = vi.fn();
            const onExpire = vi.fn();
            await render(
                framework,
                el('SessionTimeout', { expiresAt: Date.now() + 63_000, warnBefore: 60, onExtend, onExpire })
            );
            expect(screen.queryByRole('alertdialog')).toBeNull();
            await act(() => vi.advanceTimersByTimeAsync(4000));
            const dialog = await screen.findByRole('alertdialog', { name: 'Your session is about to expire' });
            expect(within(dialog).getByRole('timer')).toHaveTextContent(/^0:5\d$/);
            await userEvent.click(within(dialog).getByRole('button', { name: 'Stay signed in' }));
            expect(onExtend).toHaveBeenCalled();
            await act(() => vi.advanceTimersByTimeAsync(62_000));
            await waitFor(() => expect(onExpire).toHaveBeenCalledTimes(1));
            expect(await screen.findByRole('alertdialog', { name: 'Session expired' })).toBeInTheDocument();
        });
    });
});
