import { screen, waitFor, within } from '@testing-library/dom';
import { act, cleanup as cleanupReact } from '@testing-library/react';
import { cleanup as cleanupVue } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { announcer } from '@wirecore/wirelayer-recipes';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { el, frameworks, normalize, render, type El, type Framework } from './harness.js';

// Building blocks and special inputs in Vue and React: mentions, phone numbers, colour field, emoji grid, uploads
// with progress, sortable lists with the keyboard, typed signature, JSON, logs, marquee and downloads

const tick = (ms = 0) => act(() => new Promise((done) => setTimeout(done, ms)));
const region = () =>
    document.querySelector('[data-wc-announcer] [role=status]') ?? screen.queryAllByRole('status').at(-1);

afterEach(() => {
    announcer.reset();
    localStorage.clear();
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
            'FloatingPanel open',
            el(
                'FloatingPanel',
                { title: 'Notes', defaultOpen: true, defaultPosition: { x: 20, y: 20 } },
                el('p', {}, 'string')
            ),
            '[role=dialog]',
        ],
    ];
    it.each(cases)('%s', async (_, node, ready) => {
        expect(await openDom('vue', node, ready)).toBe(await openDom('react', node, ready));
    });
});

const people = [
    { value: 'anna', label: 'Anna Berg' },
    { value: 'ben', label: 'Ben Ott' },
    { value: 'clara', label: 'Clara Weiß' },
];

describe.each(frameworks)('%s', (framework) => {
    /** The v-model listener in Vue, onValueChange in React */
    const onModel = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';

    describe('Mentions', () => {
        it('"@" opens suggestions (combobox pattern), arrows choose, Enter inserts the mention as markup', async () => {
            const onChange = vi.fn();
            await render(framework, el('Mentions', { items: people, 'aria-label': 'Message', [onModel]: onChange }));
            const field = screen.getByRole('textbox', { name: 'Message' });
            expect(field).toHaveAttribute('aria-autocomplete', 'list');
            await userEvent.type(field, 'Hello @');
            const list = screen.getByRole('listbox', { name: 'Suggestions' });
            expect(within(list).getAllByRole('option')).toHaveLength(3);
            await userEvent.type(field, 'b');
            expect(
                within(list)
                    .getAllByRole('option')
                    .map((option) => option.textContent?.trim())
            ).toEqual(['Anna Berg', 'Ben Ott']);
            await userEvent.keyboard('{ArrowDown}');
            const options = within(list).getAllByRole('option');
            expect(options[1]).toHaveAttribute('aria-selected', 'true');
            expect(field).toHaveAttribute('aria-activedescendant', options[1]!.id);
            await userEvent.keyboard('{Enter}');
            expect(screen.queryByRole('listbox')).toBeNull();
            expect(onChange).toHaveBeenLastCalledWith('Hello @[Ben Ott](ben) ');
            expect(field).toHaveValue('Hello @Ben Ott ');
            // The mention is marked behind the text
            expect(document.querySelector('mark')).toHaveTextContent('@Ben Ott');
            // Editing inside a mention turns it into text
            await userEvent.type(field, '{Backspace}{Backspace}');
            expect(onChange).toHaveBeenLastCalledWith('Hello @Ben Ot');
            expect(document.querySelector('mark')).toBeNull();
        });

        it('loading: the list shows "Loading" while the app loads entries (search event)', async () => {
            const onSearch = vi.fn();
            await render(framework, el('Mentions', { items: [], loading: true, onSearch, 'aria-label': 'Message' }));
            await userEvent.type(screen.getByRole('textbox', { name: 'Message' }), '@an');
            expect(onSearch).toHaveBeenLastCalledWith('@', 'an');
            expect(screen.getByRole('listbox', { name: 'Suggestions' })).toHaveTextContent('Loading');
        });

        it('several triggers with their own entries; Escape closes, a click takes an entry', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el('Mentions', {
                    'aria-label': 'Comment',
                    triggers: [
                        { char: '@', items: people },
                        { char: '#', items: ['Release', 'Bug'] },
                    ],
                    [onModel]: onChange,
                })
            );
            const field = screen.getByRole('textbox', { name: 'Comment' });
            await userEvent.type(field, '#');
            expect(
                within(screen.getByRole('listbox'))
                    .getAllByRole('option')
                    .map((o) => o.textContent?.trim())
            ).toEqual(['Release', 'Bug']);
            await waitFor(() => expect(screen.getAllByRole('status').at(-1)).toHaveTextContent('2 suggestions'));
            await userEvent.keyboard('{Escape}');
            expect(screen.queryByRole('listbox')).toBeNull();
            await userEvent.type(field, 'B');
            await userEvent.click(screen.getByRole('option', { name: 'Bug' }));
            expect(onChange).toHaveBeenLastCalledWith('#[Bug](Bug) ');
            expect(field).toHaveFocus();
        });
    });

    describe('PhoneInput', () => {
        it('formats for the country, drops the trunk 0, reports E.164; "+43" switches the country', async () => {
            const onChange = vi.fn();
            const onCountry = vi.fn();
            await render(
                framework,
                el(
                    'Field',
                    { label: 'Phone' },
                    el('PhoneInput', {
                        [onModel]: onChange,
                        [framework === 'vue' ? 'onUpdate:country' : 'onCountryChange']: onCountry,
                    })
                )
            );
            const field = screen.getByRole('textbox', { name: 'Phone' });
            expect(field).toHaveAttribute('type', 'tel');
            await userEvent.type(field, '030123456');
            expect(field).toHaveValue('301 23456');
            expect(onChange).toHaveBeenLastCalledWith('+4930123456');
            await userEvent.clear(field);
            await userEvent.type(field, '+43 1 234567');
            expect(onCountry).toHaveBeenLastCalledWith('AT');
            expect(onChange).toHaveBeenLastCalledWith('+431234567');
            expect(screen.getByRole('combobox', { name: 'Country' })).toHaveTextContent('+43');
        });

        it('a number of the wrong length is invalid after leaving the field', async () => {
            await render(framework, el('PhoneInput', { 'aria-label': 'Phone' }));
            const field = screen.getByRole('textbox', { name: 'Phone' });
            await userEvent.type(field, '301');
            expect(field).not.toHaveAttribute('aria-invalid');
            await userEvent.tab();
            expect(field).toHaveAttribute('aria-invalid', 'true');
        });
    });

    describe('ColorInput', () => {
        it('takes typed colours in any format on Enter and reports them in its format; bad text goes back', async () => {
            const onChange = vi.fn();
            await render(
                framework,
                el(
                    'Field',
                    { label: 'Color' },
                    el('ColorInput', { defaultValue: '#1e66f5', format: 'rgb', [onModel]: onChange })
                )
            );
            const field = screen.getByRole('textbox', { name: 'Color' });
            expect(field).toHaveValue('rgb(30 102 245)');
            await userEvent.clear(field);
            await userEvent.type(field, '#ff0000{Enter}');
            expect(onChange).toHaveBeenLastCalledWith('rgb(255 0 0)');
            expect(field).toHaveValue('rgb(255 0 0)');
            await userEvent.clear(field);
            await userEvent.type(field, 'Blue');
            expect(field).toHaveAttribute('aria-invalid', 'true');
            await userEvent.tab();
            expect(field).toHaveValue('rgb(255 0 0)');
            expect(field).not.toHaveAttribute('aria-invalid');
            expect(screen.getByRole('button', { name: 'Open color picker' })).toBeInTheDocument();
        });
    });

    describe('EmojiPicker', () => {
        it('searches German words, moves through the grid with arrows, Enter chooses and remembers it', async () => {
            const onSelect = vi.fn();
            await render(framework, el('LocaleProvider', { locale: 'de-DE' }, el('EmojiPicker', { onSelect })));
            const search = screen.getByRole('searchbox', { name: 'Emoji suchen' });
            await userEvent.type(search, 'glück');
            const grid = screen.getByRole('grid', { name: 'Suchergebnisse' });
            expect(within(grid).getByRole('button', { name: 'Kleeblatt' })).toBeInTheDocument();
            await waitFor(() => expect(screen.getAllByRole('status').at(-1)).toHaveTextContent(/Emoji/));
            await userEvent.clear(search);
            // Arrow down from the search goes into the grid; arrows move the focus (one tab stop)
            await userEvent.keyboard('{ArrowDown}');
            const first = screen.getByRole('button', { name: 'Grinsendes Gesicht' });
            await waitFor(() => expect(first).toHaveFocus());
            expect(first).toHaveAttribute('tabindex', '0');
            await userEvent.keyboard('{ArrowRight}');
            const second = screen.getByRole('button', { name: 'Grinsen mit großen Augen' });
            await waitFor(() => expect(second).toHaveFocus());
            await userEvent.keyboard('{ArrowDown}');
            await waitFor(() =>
                expect(document.activeElement).toBe(screen.getAllByRole('gridcell')[9]!.firstElementChild)
            );
            await userEvent.keyboard('{Enter}');
            expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ category: 'smileys' }));
            expect(JSON.parse(localStorage.getItem('wirecore-emoji-recent')!)).toHaveLength(1);
            expect(await screen.findByRole('button', { name: 'Zuletzt verwendet' })).toBeInTheDocument();
        });

        it('English names in English; English words also find in German', async () => {
            await render(framework, el('LocaleProvider', { locale: 'en-US' }, el('EmojiPicker', { recent: false })));
            await userEvent.type(screen.getByRole('searchbox', { name: 'Search emoji' }), 'clover');
            expect(screen.getByRole('button', { name: 'Four leaf clover' })).toBeInTheDocument();
        });
    });

    describe('FileUpload', () => {
        it('uploads each file with progress; cancel and retry; announces the result', async () => {
            const uploads: { file: File; progress: (n: number) => void; done: () => void; signal: AbortSignal }[] = [];
            const upload = (file: File, options: { onProgress: (n: number) => void; signal: AbortSignal }) =>
                new Promise<void>((resolve, reject) => {
                    uploads.push({ file, progress: options.onProgress, done: resolve, signal: options.signal });
                    options.signal.addEventListener('abort', () => reject(new Error('aborted')));
                });
            await render(framework, el('FileUpload', { label: 'Attachment', maxFiles: 3, upload, autoUpload: true }));
            const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
            await userEvent.upload(input, new File(['abc'], 'report.pdf', { type: 'application/pdf' }));
            await waitFor(() => expect(uploads).toHaveLength(1));
            await act(async () => uploads[0]!.progress(40));
            const bar = screen.getByRole('progressbar', { name: 'Progress of report.pdf' });
            expect(bar).toHaveAttribute('aria-valuenow', '40');
            expect(screen.getByText('Uploading … 40%')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Cancel upload of report.pdf' }));
            expect(uploads[0]!.signal.aborted).toBe(true);
            expect(await screen.findByText('Cancelled')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Upload report.pdf again' }));
            await waitFor(() => expect(uploads).toHaveLength(2));
            await act(async () => uploads[1]!.done());
            expect(await screen.findByText('Uploaded')).toBeInTheDocument();
            await waitFor(() => expect(region()).toHaveTextContent('report.pdf uploaded'));
        });

        it('without autoUpload: "Upload" starts it; rejected files come with codes', async () => {
            const upload = vi.fn(() => Promise.resolve());
            const onReject = vi.fn();
            await render(
                framework,
                el('FileUpload', {
                    label: 'Image',
                    accept: 'image/png',
                    upload,
                    [framework === 'vue' ? 'onFilesReject' : 'onFilesReject']: onReject,
                })
            );
            const input = document.querySelector<HTMLInputElement>('input[type=file]')!;
            await userEvent.upload(input, new File(['a'], 'photo.png', { type: 'image/png' }));
            expect(await screen.findByText('Ready to upload')).toBeInTheDocument();
            expect(upload).not.toHaveBeenCalled();
            await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
            expect(upload).toHaveBeenCalledTimes(1);
            expect(await screen.findByText('Uploaded')).toBeInTheDocument();
            await userEvent
                .setup({ applyAccept: false })
                .upload(input, new File(['a'], 'note.txt', { type: 'text/plain' }));
            await waitFor(() =>
                expect(onReject).toHaveBeenLastCalledWith([
                    expect.objectContaining({ errors: expect.arrayContaining(['FILE_INVALID_TYPE']) }),
                ])
            );
        });

        it('showFileList false: the files are reported, the list is left to the app', async () => {
            const onFiles = vi.fn();
            await render(
                framework,
                el('FileUpload', { label: 'Attachment', showFileList: false, onFilesChange: onFiles })
            );
            const report = new File(['abc'], 'report.pdf', { type: 'application/pdf' });
            await userEvent.upload(document.querySelector<HTMLInputElement>('input[type=file]')!, report);
            await waitFor(() => expect(onFiles).toHaveBeenLastCalledWith([report]));
            expect(screen.queryByText('report.pdf')).not.toBeInTheDocument();
        });

        it('files: the chosen files come from outside – removing one reports the rest', async () => {
            const onFiles = vi.fn();
            const report = new File(['abc'], 'report.pdf', { type: 'application/pdf' });
            const offer = new File(['abc'], 'offer.pdf', { type: 'application/pdf' });
            await render(
                framework,
                el('FileUpload', {
                    label: 'Attachments',
                    maxFiles: 3,
                    files: [report, offer],
                    [framework === 'vue' ? 'onUpdate:files' : 'onFilesChange']: onFiles,
                })
            );
            expect(screen.getByText('report.pdf')).toBeInTheDocument();
            expect(screen.getByText('offer.pdf')).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Remove report.pdf' }));
            await waitFor(() => expect(onFiles).toHaveBeenLastCalledWith([offer]));
        });

        it('variant "button": only the button; it opens the file dialog', async () => {
            await render(framework, el('FileUpload', { variant: 'button', triggerLabel: 'Choose file' }));
            expect(screen.queryByRole('group')).toBeNull();
            expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument();
        });
    });

    describe('Sortable', () => {
        const items = [
            { id: 'p', label: 'Planning' },
            { id: 'u', label: 'Implementation' },
            { id: 't', label: 'Test' },
        ];

        it('Space picks up, arrows move, Space drops – every step announced; Escape restores', async () => {
            const onChange = vi.fn();
            await render(framework, el('Sortable', { defaultValue: items, label: 'Tasks', [onModel]: onChange }));
            const handle = screen.getByRole('button', { name: 'Move Planning' });
            expect(handle).toHaveAccessibleDescription(/Press Space or Enter to pick up/);
            handle.focus();
            await userEvent.keyboard(' ');
            expect(handle).toHaveAttribute('aria-pressed', 'true');
            await waitFor(() => expect(region()).toHaveTextContent('Planning picked up, position 1 of 3.'));
            await userEvent.keyboard('{ArrowDown}');
            expect(onChange).toHaveBeenLastCalledWith([items[1], items[0], items[2]]);
            await waitFor(() => expect(screen.getByRole('button', { name: 'Move Planning' })).toHaveFocus());
            await waitFor(() => expect(region()).toHaveTextContent('Planning: position 2 of 3.'));
            expect(screen.getAllByRole('listitem').map((item) => item.textContent?.trim())).toEqual([
                'Implementation',
                'Planning',
                'Test',
            ]);
            await userEvent.keyboard(' ');
            await waitFor(() => expect(region()).toHaveTextContent('Planning dropped, position 2 of 3.'));
            expect(screen.getByRole('button', { name: 'Move Planning' })).toHaveAttribute('aria-pressed', 'false');
            // Escape puts it back
            await userEvent.keyboard(' ');
            await userEvent.keyboard('{End}');
            expect(onChange).toHaveBeenLastCalledWith([items[1], items[2], items[0]]);
            await waitFor(() => expect(screen.getByRole('button', { name: 'Move Planning' })).toHaveFocus());
            await userEvent.keyboard('{Escape}');
            expect(onChange).toHaveBeenLastCalledWith([items[1], items[0], items[2]]);
            await waitFor(() => expect(region()).toHaveTextContent(/Move cancelled/));
        });

        it('moves between lists of a group with the arrow keys across (Kanban)', async () => {
            const onTodo = vi.fn();
            const onDone = vi.fn();
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('Sortable', { defaultValue: [items[0]], group: 'board', label: 'To do', [onModel]: onTodo }),
                    el('Sortable', { defaultValue: [items[2]], group: 'board', label: 'Done', [onModel]: onDone })
                )
            );
            screen.getByRole('button', { name: 'Move Planning' }).focus();
            await userEvent.keyboard(' ');
            await userEvent.keyboard('{ArrowRight}');
            expect(onTodo).toHaveBeenLastCalledWith([]);
            expect(onDone).toHaveBeenLastCalledWith([items[0], items[2]]);
            await waitFor(() => expect(region()).toHaveTextContent('Planning in Done, position 1 of 2.'));
            await waitFor(() => expect(screen.getByRole('button', { name: 'Move Planning' })).toHaveFocus());
            expect(screen.getByText('No items – move here')).toBeInTheDocument();
            await userEvent.keyboard(' ');
        });
    });

    describe('SignaturePad', () => {
        it('typedAlternative: the name can be typed; the value is an SVG image of it', async () => {
            const onChange = vi.fn();
            const onName = vi.fn();
            await render(
                framework,
                el(
                    'Field',
                    { label: 'Signature' },
                    el('SignaturePad', {
                        typedAlternative: true,
                        [onModel]: onChange,
                        [framework === 'vue' ? 'onUpdate:typedName' : 'onTypedNameChange']: onName,
                    })
                )
            );
            const pad = screen.getByRole('application', { name: 'Signature' });
            expect(pad).toHaveAttribute('aria-roledescription', 'signature field');
            expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();
            await userEvent.click(screen.getByRole('button', { name: 'Type signature' }));
            expect(screen.queryByRole('application')).toBeNull();
            await userEvent.type(screen.getByRole('textbox', { name: 'Name as signature' }), 'Anna Berg');
            expect(onName).toHaveBeenLastCalledWith('Anna Berg');
            const value = onChange.mock.lastCall![0] as string;
            expect(value.startsWith('data:image/svg+xml')).toBe(true);
            expect(decodeURIComponent(value)).toContain('Anna Berg');
            await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
            expect(onChange).toHaveBeenLastCalledWith('');
            await userEvent.click(screen.getByRole('button', { name: 'Draw signature' }));
            expect(screen.getByRole('application', { name: 'Signature' })).toBeInTheDocument();
        });
    });

    describe('JsonInput and JsonViewer', () => {
        it('JsonInput describes the check result, marks invalid JSON with its position and formats', async () => {
            const onChange = vi.fn();
            const onParse = vi.fn();
            await render(
                framework,
                el('JsonInput', {
                    'aria-label': 'JSON',
                    [onModel]: onChange,
                    [framework === 'vue' ? 'onValueParse' : 'onValueParse']: onParse,
                })
            );
            const field = screen.getByRole('textbox', { name: 'JSON' });
            await userEvent.type(field, '{{"a":');
            expect(field).toHaveAttribute('aria-invalid', 'true');
            expect(field).toHaveAccessibleDescription(/Invalid JSON/);
            expect(screen.getByRole('button', { name: 'Format' })).toBeDisabled();
            await userEvent.type(field, '[[1]}');
            expect(field).not.toHaveAttribute('aria-invalid');
            expect(onParse).toHaveBeenLastCalledWith({ a: [1] });
            expect(field).toHaveAccessibleDescription('Valid JSON');
            await userEvent.click(screen.getByRole('button', { name: 'Format' }));
            expect(onChange).toHaveBeenLastCalledWith('{\n  "a": [\n    1\n  ]\n}');
        });

        it('JsonViewer: a tree with typed values; search opens and marks hits; Ctrl+C copies the node', async () => {
            const writeText = vi.fn(() => Promise.resolve());
            Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
            await render(
                framework,
                el('JsonViewer', {
                    data: { name: 'web-01', tags: ['prod', 'eu'], deep: { inner: { owner: 'Anna' } } },
                    search: true,
                })
            );
            const tree = screen.getByRole('tree', { name: 'JSON data' });
            expect(within(tree).getByRole('treeitem', { name: /^name:\s?"web-01"\s?string$/ })).toBeInTheDocument();
            // One level open: the nested owner is hidden until searched
            expect(within(tree).queryByRole('treeitem', { name: /^owner/ })).toBeNull();
            await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'anna');
            await waitFor(() => expect(within(tree).getByRole('treeitem', { name: /^owner/ })).toBeInTheDocument());
            expect(tree.querySelector('mark')).toHaveTextContent('Anna');
            await waitFor(() => expect(screen.getAllByRole('status').at(-1)).toHaveTextContent('1 match'));
            const item = within(tree).getByRole('treeitem', { name: /^name/ });
            expect(item).toHaveAttribute('aria-keyshortcuts', 'Control+C');
            item.focus();
            await userEvent.keyboard('{Control>}c{/Control}');
            expect(writeText).toHaveBeenCalledWith('web-01');
        });
    });

    describe('LogViewer', () => {
        it('filters by search and level, with the number of lines; levels as icon and text', async () => {
            await render(
                framework,
                el('LogViewer', { lines: ['INFO Start', 'WARN Slow', 'ERROR Broken', 'ERROR Broken again'] })
            );
            const log = screen.getByRole('region', { name: 'Log' });
            expect(within(log).getAllByRole('listitem')).toHaveLength(4);
            expect(within(log).getAllByText('Error')).toHaveLength(2);
            await userEvent.type(screen.getByRole('searchbox', { name: 'Search log' }), 'broken');
            expect(within(log).getAllByRole('listitem')).toHaveLength(2);
            await waitFor(() => expect(screen.getAllByRole('status').at(-1)).toHaveTextContent('2 of 4 lines'));
            await userEvent.clear(screen.getByRole('searchbox', { name: 'Search log' }));
            await userEvent.click(
                within(screen.getByRole('group', { name: 'Levels' })).getByRole('button', { name: 'Error' })
            );
            expect(
                within(log)
                    .getAllByRole('listitem')
                    .map((line) => line.getAttribute('aria-posinset'))
            ).toEqual(['1', '2']);
            expect(screen.getByRole('button', { name: 'Follow' })).toHaveAttribute('aria-pressed', 'true');
        });
    });

    describe('LogViewer with a data source', () => {
        it('older lines page by page (newest first) above the given lines', async () => {
            const pages = [['ERROR Broken', 'WARN Slow'], ['INFO Start']];
            const getItems = vi.fn(async ({ page = 1 }: { page?: number }) => ({
                items: pages[page - 1] ?? [],
                hasMore: page < pages.length,
            }));
            await render(framework, el('LogViewer', { dataSource: { getItems }, lines: ['INFO Live'], search: false }));
            const log = screen.getByRole('region', { name: 'Log' });
            const texts = () =>
                within(log)
                    .queryAllByRole('listitem')
                    .map((line) => line.textContent ?? '');
            await waitFor(() => expect(texts()).toHaveLength(3));
            expect(texts()[0]).toContain('Slow');
            expect(texts()[2]).toContain('Live');
            await userEvent.click(screen.getByRole('button', { name: 'Load older entries' }));
            await waitFor(() => expect(texts()).toHaveLength(4));
            expect(texts()[0]).toContain('Start');
            expect(getItems).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
            expect(screen.queryByRole('button', { name: 'Load older entries' })).toBeNull();
        });
    });

    describe('Marquee, QrCode, RingProgress, DownloadTrigger', () => {
        it('Marquee: the pause button stops and resumes the band (WCAG 2.2.2)', async () => {
            await render(framework, el('Marquee', { label: 'Partner' }, el('span', {}, 'Alpha')));
            const band = screen.getByRole('region', { name: 'Partner' });
            const pause = screen.getByRole('button', { name: 'Pause ticker' });
            // Hover and focus pause it as well – the focus is on the button now
            await userEvent.click(pause);
            expect(screen.getByRole('button', { name: 'Resume ticker' })).toBeInTheDocument();
            expect(band).toHaveAttribute('data-paused');
            await userEvent.click(screen.getByRole('button', { name: 'Resume ticker' }));
            await userEvent.unhover(band);
            screen.getByRole('button', { name: 'Pause ticker' }).blur();
            await waitFor(() => expect(band).not.toHaveAttribute('data-paused'));
        });

        it('QrCode is an image named by its value; RingProgress a progress bar with the value as text', async () => {
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('QrCode', { value: 'https://wirecore.dev' }),
                    el('RingProgress', { value: 30, max: 60, label: 'Storage' })
                )
            );
            expect(screen.getByRole('img', { name: 'QR code: https://wirecore.dev' })).toBeInTheDocument();
            const ring = screen.getByRole('progressbar', { name: 'Storage' });
            expect(ring).toHaveAttribute('aria-valuenow', '30');
            expect(ring).toHaveAttribute('aria-valuetext', '50 %');
        });

        it('DownloadTrigger saves text as a file; a failing URL reports the error', async () => {
            const createObjectURL = vi.fn<(blob: Blob | MediaSource) => string>(() => 'blob:x');
            URL.createObjectURL = createObjectURL;
            URL.revokeObjectURL = vi.fn();
            const onError = vi.fn();
            const fetchMock = vi.fn(() =>
                Promise.resolve(new Response(null, { status: 404, statusText: 'Not Found' }))
            );
            vi.stubGlobal('fetch', fetchMock);
            await render(
                framework,
                el(
                    'div',
                    {},
                    el('DownloadTrigger', { data: 'a;b', fileName: 'data.csv', mimeType: 'text/csv' }),
                    el('DownloadTrigger', { url: '/missing.pdf', fileName: 'missing.pdf', onError }, 'PDF')
                )
            );
            await userEvent.click(screen.getByRole('button', { name: 'Download' }));
            await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
            const blob = createObjectURL.mock.calls[0]![0] as Blob;
            expect(blob.type).toBe('text/csv');
            await userEvent.click(screen.getByRole('button', { name: 'PDF' }));
            await waitFor(() => expect(onError).toHaveBeenCalled());
            vi.unstubAllGlobals();
        });
    });
});
