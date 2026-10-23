import {
    barsListWidths,
    bulletScale,
    chatEntries,
    chatPromptAction,
    clampRange,
    codeFileKind,
    countText,
    diffLines,
    editorColorToken,
    editorColorValue,
    formatRemaining,
    funnelStages,
    headingSlug,
    kanbanLimitState,
    languageFromFileName,
    markdownElements,
    markdownToText,
    parseInline,
    parseMarkdown,
    pieLegend,
    promptHeight,
    radialBarRings,
    referencePlugin,
    referenceSummary,
    resolveCodeLanguage,
    safeUrl,
    sanitizeEditorHtml,
    seriesChartConfig,
    seriesTable,
    sessionTimeoutState,
    sourceHost,
    tooltipLabel,
    validateAuth,
    waterfallBars,
    waterfallConfig,
    type ChartTheme,
    type MarkdownElement,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it, vi } from 'vitest';
import { de as german } from '@wirecore/wirelayer-recipes/locales/de';

// Logic of the app patterns, chat, Markdown, charts, editor and code blocks (framework-neutral, @wirecore/wirelayer-recipes)

/** All tags and attributes in element descriptions */
const walk = (nodes: (MarkdownElement | string)[]): MarkdownElement[] =>
    nodes.flatMap((node) => (typeof node === 'string' ? [] : [node, ...walk(node.children)]));

describe('Markdown', () => {
    it('parses headings, paragraphs, lists, quotes, code, rules and tables', () => {
        const blocks = parseMarkdown(
            '# Title\n\nText\nmore\n\n- a\n- b\n  - inner\n\n3. three\n4. four\n\n> Quote\n\n```js\nx()\n```\n\n***\n\n| A | B |\n|:-:|--:|\n| 1 | 2 |'
        );
        expect(blocks.map((block) => block.type)).toEqual([
            'heading',
            'paragraph',
            'list',
            'list',
            'quote',
            'code',
            'rule',
            'table',
        ]);
        expect(blocks[1]).toEqual({ type: 'paragraph', children: [{ type: 'text', text: 'Text more' }] });
        const list = blocks[2] as Extract<(typeof blocks)[number], { type: 'list' }>;
        expect(list.items[1]!.children.map((child) => child.type)).toEqual(['paragraph', 'list']);
        expect(blocks[3]).toMatchObject({ ordered: true, start: 3 });
        expect(blocks[5]).toEqual({ type: 'code', language: 'js', text: 'x()' });
        expect(blocks[7]).toMatchObject({ align: ['center', 'end'] });
    });

    it('parses inline markup: strong, emphasis, strikethrough, code, links, escapes, breaks', () => {
        expect(parseInline('**bold** *italic* ~~gone~~ `a*b*` \\*none\\* snake_case_name')).toEqual([
            { type: 'strong', children: [{ type: 'text', text: 'bold' }] },
            { type: 'text', text: ' ' },
            { type: 'em', children: [{ type: 'text', text: 'italic' }] },
            { type: 'text', text: ' ' },
            { type: 'del', children: [{ type: 'text', text: 'gone' }] },
            { type: 'text', text: ' ' },
            { type: 'code', text: 'a*b*' },
            { type: 'text', text: ' *none* snake_case_name' },
        ]);
        expect(parseInline('[Page](/a "Title") <https://x.de> https://wirecore.de/b.')).toEqual([
            { type: 'link', href: '/a', title: 'Title', children: [{ type: 'text', text: 'Page' }] },
            { type: 'text', text: ' ' },
            { type: 'link', href: 'https://x.de', children: [{ type: 'text', text: 'https://x.de' }] },
            { type: 'text', text: ' ' },
            {
                type: 'link',
                href: 'https://wirecore.de/b',
                children: [{ type: 'text', text: 'https://wirecore.de/b' }],
            },
            { type: 'text', text: '.' },
        ]);
        expect(parseMarkdown('a\nb', { breaks: true })[0]).toEqual({
            type: 'paragraph',
            children: [{ type: 'text', text: 'a' }, { type: 'break' }, { type: 'text', text: 'b' }],
        });
    });

    it('creates only allowed elements: no raw HTML, safe links with rel, task lists with names', () => {
        const elements = walk(
            markdownElements('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n- [ ] Open\n- [x] Done', {
                linkTarget: '_blank',
            })
        );
        expect(elements.map((element) => element.tag)).toEqual([
            'p',
            'p',
            'ul',
            'li',
            'label',
            'input',
            'div',
            'li',
            'label',
            'input',
            'div',
        ]);
        expect(markdownToText('<script>alert(1)</script>')).toBe('<script>alert(1)</script>');
        expect(elements.find((element) => element.tag === 'input')?.attrs).toMatchObject({
            type: 'checkbox',
            checked: false,
            disabled: true,
            'aria-label': 'Open',
        });
        const [link] = walk(markdownElements('[a](https://x.de)', { linkTarget: '_blank' })).filter(
            (e) => e.tag === 'a'
        );
        expect(link!.attrs).toEqual({ href: 'https://x.de', rel: 'noopener noreferrer nofollow', target: '_blank' });
        // Headings start at h2 by default
        expect(markdownElements('# A\n###### B').map((element) => element.tag)).toEqual(['h2', 'h6']);
        expect(markdownElements('# A', { headingLevel: 1 })[0]!.tag).toBe('h1');
    });

    it.each([
        'javascript:alert(1)',
        'JavaScript:alert(1)',
        ' javascript:alert(1)',
        'java\tscript:alert(1)',
        'java\nscript:alert(1)',
        'javascript&#58;alert(1)',
        '&#106;avascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
    ])('drops unsafe link addresses: %s', (href) => {
        expect(safeUrl(href)).toBeUndefined();
        const elements = walk(markdownElements(`[Click](${href.replace(/[()\s]/g, '')})`));
        expect(elements.some((element) => element.tag === 'a')).toBe(false);
    });

    it('keeps safe addresses', () => {
        for (const href of [
            'https://x.de',
            'http://x.de',
            'mailto:a@b.de',
            'tel:+49401234',
            '/path',
            './a',
            '#anchor',
            '?q=1',
            'file.pdf',
            '//cdn.de/a',
        ])
            expect(safeUrl(href)).toBe(href);
    });

    it('images become links (nothing is loaded); deep nesting stays text', () => {
        expect(walk(markdownElements('![Logo](https://x.de/logo.png)')).map((element) => element.tag)).toEqual([
            'p',
            'a',
        ]);
        const deep = `${'>'.repeat(200)} deep`;
        expect(() => markdownElements(deep)).not.toThrow();
        expect(() => markdownElements(`${'*'.repeat(5000)}x`)).not.toThrow();
        expect(markdownToText('# Title\n\n- **one**\n- two')).toBe('Title one two');
    });
});

describe('chat', () => {
    const at = (time: string) => `2026-10-20T${time}:00`;
    it('groups messages of one author within the time, separators per day', () => {
        const entries = chatEntries([
            { id: 1, text: 'a', author: 'Anna', time: at('09:00') },
            { id: 2, text: 'b', author: 'Anna', time: at('09:03') },
            { id: 3, text: 'c', author: 'Anna', time: at('09:20') },
            { id: 4, text: 'd', own: true, time: at('09:21') },
            { id: 5, text: 'e', own: true, time: '2026-10-21T08:00:00' },
            { id: 6, text: 'f', system: true, time: '2026-10-21T08:01:00' },
        ]);
        expect(
            entries.map((entry) =>
                entry.type === 'separator' ? 'day' : `${entry.message.id}${entry.grouped ? 'g' : ''}`
            )
        ).toEqual(['day', '1', '2g', '3', '4', 'day', '5', '6']);
        expect(chatEntries([{ id: 1, text: 'a', time: at('09:00') }], { separators: false })).toHaveLength(1);
    });

    it('Enter sends, Shift+Enter and composing do not; mod-enter needs Ctrl/Cmd', () => {
        const key = (init: Partial<KeyboardEvent>) =>
            ({
                key: 'Enter',
                shiftKey: false,
                ctrlKey: false,
                metaKey: false,
                altKey: false,
                isComposing: false,
                ...init,
            }) as KeyboardEvent;
        expect(chatPromptAction(key({}))).toBe('send');
        expect(chatPromptAction(key({ shiftKey: true }))).toBeUndefined();
        expect(chatPromptAction(key({ isComposing: true }))).toBeUndefined();
        expect(chatPromptAction(key({ key: 'a' }))).toBeUndefined();
        expect(chatPromptAction(key({}), 'mod-enter')).toBeUndefined();
        expect(chatPromptAction(key({ ctrlKey: true }), 'mod-enter')).toBe('send');
    });

    it('grows the prompt between one line and maxRows; hosts of sources', () => {
        expect(promptHeight(10, 24, 16, 8)).toBe(40);
        expect(promptHeight(100, 24, 16, 8)).toBe(100);
        expect(promptHeight(500, 24, 16, 8)).toBe(208);
        expect(sourceHost('https://www.wirecore.de/a')).toBe('wirecore.de');
        expect(sourceHost('/faq')).toBe('/faq');
    });
});

describe('Kanban, session timeout, auth', () => {
    it('WIP limit states', () => {
        expect(kanbanLimitState(2)).toBe('within');
        expect(kanbanLimitState(2, 3)).toBe('within');
        expect(kanbanLimitState(3, 3)).toBe('reached');
        expect(kanbanLimitState(4, 3)).toBe('over');
    });

    it('warns before the end, then expires; remaining time as m:ss', () => {
        expect(sessionTimeoutState(1000_000, 0, 120_000)).toEqual({ remaining: 1000_000, warn: false, expired: false });
        expect(sessionTimeoutState(100_000, 0, 120_000)).toEqual({ remaining: 100_000, warn: true, expired: false });
        expect(sessionTimeoutState(0, 5, 120_000)).toEqual({ remaining: 0, warn: false, expired: true });
        expect(formatRemaining(119_001)).toBe('2:00');
        expect(formatRemaining(65_000)).toBe('1:05');
        expect(formatRemaining(3_725_000)).toBe('1:02:05');
    });

    it('validates the fields of each mode, with own checks and other languages', () => {
        const empty = { name: '', email: '', password: '', code: '', remember: false };
        expect(validateAuth('signIn', empty)).toEqual({ email: 'Required', password: 'Required' });
        expect(validateAuth('signUp', { ...empty, name: 'A', email: 'a@', password: 'short' })).toEqual({
            email: 'Please enter a valid email address',
            password: 'At least 8 characters',
        });
        expect(validateAuth('reset', { ...empty, email: 'a@b.de' })).toEqual({});
        expect(validateAuth('code', { ...empty, code: '123' }, { codeLength: 4 })).toEqual({
            code: '4 to 4 characters',
        });
        const ownDomain = (value: string) => (value.endsWith('@wirecore.de') ? undefined : 'Company addresses only');
        expect(validateAuth('reset', { ...empty, email: 'a@b.de' }, { validators: { email: ownDomain } })).toEqual({
            email: 'Company addresses only',
        });
        expect(validateAuth('signIn', empty, { texts: german.validation }).email).toBe('Pflichtfeld');
    });
});

const theme: ChartTheme = {
    palette: [
        'rgba(1, 1, 1, 1)',
        'rgba(2, 2, 2, 1)',
        'rgba(3, 3, 3, 1)',
        'rgba(4, 4, 4, 1)',
        'rgba(5, 5, 5, 1)',
        'rgba(6, 6, 6, 1)',
    ],
    surface: 'white',
    text: 'grey',
    grid: 'silver',
    font: 'Inter',
};
const format = (value: number) => `${value} €`;

describe('ready-made charts', () => {
    const data = [
        { month: 'Jan', revenue: 10, margin: 1 },
        { month: 'Feb', revenue: 20, margin: 2 },
        { month: 'Mar', revenue: 30, margin: 3 },
    ];

    it('series on a second axis, log scale, stacks, references and the shown range', () => {
        const config = seriesChartConfig(
            {
                kind: 'composite',
                data,
                categoryKey: 'month',
                series: [
                    { key: 'revenue', label: 'Revenue' },
                    { key: 'margin', type: 'line', axis: 'end', tone: 'success', dashed: true },
                ],
                scale: 'logarithmic',
                stacked: true,
                references: [
                    { value: 25, label: 'Target' },
                    { axis: 'x', from: 1, to: 2 },
                ],
                range: [1, 2],
            },
            theme,
            format
        );
        expect(config.type).toBe('bar');
        expect(config.data.labels).toEqual(['Feb', 'Mar']);
        const [bars, line] = config.data.datasets as Record<string, unknown>[];
        expect(bars).toMatchObject({ type: 'bar', label: 'Revenue', data: [20, 30], yAxisID: 'y', stack: 'all' });
        expect(line).toMatchObject({
            type: 'line',
            label: 'margin',
            yAxisID: 'y2',
            borderColor: theme.palette[2],
            borderDash: [6, 4],
        });
        const scales = config.options.scales as Record<string, Record<string, unknown>>;
        expect(scales.y).toMatchObject({ type: 'logarithmic', stacked: true });
        expect(scales.y2).toMatchObject({ position: 'right', type: 'logarithmic' });
        const references = (config.options.plugins as Record<string, { items: { shift: number }[] }>).wcReferences;
        expect(references!.items.map((item) => item.shift)).toEqual([0, 1]);
        // The value formatter in ticks and tooltips
        expect((scales.y!.ticks as { callback: (value: number) => string }).callback(5)).toBe('5 €');
        expect(tooltipLabel(format)({ dataset: { label: 'Revenue' }, raw: 7 })).toBe('Revenue: 7 €');
        expect(tooltipLabel(format)({ dataset: {}, raw: [5, 12] })).toBe('7 €');
    });

    it('horizontal bars swap the axes; the table follows the range', () => {
        const config = seriesChartConfig(
            { kind: 'bar', data, categoryKey: 'month', series: [{ key: 'revenue' }], horizontal: true },
            theme,
            format
        );
        expect(config.options.indexAxis).toBe('y');
        expect((config.data.datasets[0] as Record<string, unknown>).xAxisID).toBe('x');
        expect(seriesTable(data, 'month', [{ key: 'revenue', label: 'Revenue' }], format, [0, 1])).toEqual({
            columns: ['Revenue'],
            rows: [
                { label: 'Jan', values: ['10 €'] },
                { label: 'Feb', values: ['20 €'] },
            ],
        });
        expect(
            referenceSummary(
                [
                    { value: 5, label: 'Target' },
                    { from: 1, to: 2 },
                ],
                format
            )
        ).toBe('Target: 5 € · 1 €–2 €');
    });

    it('brush range is clamped and keeps a minimum size', () => {
        expect(clampRange(undefined, 10)).toEqual([0, 9]);
        expect(clampRange([7, 3], 10)).toEqual([3, 7]);
        expect(clampRange([9, 9], 10)).toEqual([8, 9]);
        expect(clampRange([-5, 50], 10)).toEqual([0, 9]);
    });

    it('waterfall: floating bars from the running sum, totals from zero', () => {
        const bars = waterfallBars([
            { label: 'Revenue', value: 500 },
            { label: 'Costs', value: -320 },
            { label: 'Result', total: true },
        ]);
        expect(bars.map((bar) => [bar.range, bar.kind])).toEqual([
            [[0, 500], 'up'],
            [[500, 180], 'down'],
            [[0, 180], 'total'],
        ]);
        const config = waterfallConfig(
            [
                { label: 'A', value: 5 },
                { label: 'B', value: -2 },
            ],
            theme,
            format,
            german.chart
        );
        expect(config.data.datasets[0]!.backgroundColor).toEqual([theme.palette[2], theme.palette[4]]);
        const label = (config.options.plugins.tooltip.callbacks.label as (context: { dataIndex: number }) => string)({
            dataIndex: 1,
        });
        expect(label).toBe('Veränderung: -2 € · Summe: 3 €');
    });

    it('pie legend with value and share', () => {
        expect(
            pieLegend(
                [
                    { label: 'A', value: 1 },
                    { label: 'B', value: 3, tone: 'danger' },
                ],
                format
            )
        ).toEqual([
            { label: 'A', tone: 'primary', value: '1 €', share: '25%' },
            { label: 'B', tone: 'danger', value: '3 €', share: '75%' },
        ]);
    });

    it('the reference plugin draws areas behind and lines in front', () => {
        const context = {
            save: vi.fn(),
            restore: vi.fn(),
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            setLineDash: vi.fn(),
            fillText: vi.fn(),
        };
        const chart = {
            ctx: context as unknown as CanvasRenderingContext2D,
            chartArea: { left: 0, right: 100, top: 0, bottom: 50 },
            scales: {
                y: { getPixelForValue: (value: number) => 50 - value },
                x: { getPixelForValue: (value: number) => value * 10 },
            },
            options: {
                plugins: {
                    wcReferences: {
                        items: [
                            { value: 20, label: 'Target' },
                            { from: 10, to: 30 },
                        ],
                        colors: { muted: 'rgba(0, 0, 0, 1)' },
                        text: 'grey',
                        font: 'Inter',
                        valueAxis: 'y',
                        categoryAxis: 'x',
                    },
                },
            },
        };
        referencePlugin.beforeDatasetsDraw(chart);
        expect(context.fillRect).toHaveBeenCalledWith(0, 20, 100, 20);
        expect(context.stroke).not.toHaveBeenCalled();
        referencePlugin.afterDatasetsDraw(chart);
        expect(context.moveTo).toHaveBeenCalledWith(0, 30);
        expect(context.lineTo).toHaveBeenCalledWith(100, 30);
        expect(context.fillText).toHaveBeenCalledWith('Target', 96, 24);
    });
});

describe('HTML charts', () => {
    it('bars list, funnel, bullet and radial bar geometry', () => {
        expect(barsListWidths([50, 100, 0])).toEqual([50, 100, 0]);
        expect(barsListWidths([50], 200)).toEqual([25]);
        const stages = funnelStages([
            { label: 'A', value: 1000 },
            { label: 'B', value: 250 },
        ]);
        expect(stages.map((stage) => [stage.width, stage.fromPrevious, stage.fromFirst])).toEqual([
            [100, undefined, 1],
            [25, 0.25, 0.25],
        ]);
        expect(bulletScale({ value: 150, target: 250, max: 300, ranges: [100, 200, 300] })).toEqual({
            value: 50,
            target: (250 / 300) * 100,
            bands: [
                { width: 100, band: 2 },
                { width: (200 / 300) * 100, band: 1 },
                { width: (100 / 300) * 100, band: 0 },
            ],
        });
        const rings = radialBarRings([{ value: 50 }, { value: 200, max: 100 }], { thickness: 10, gap: 2 });
        expect(rings.map((ring) => [ring.radius, ring.share])).toEqual([
            [45, 0.5],
            [33, 1],
        ]);
        expect(rings[0]!.dash).toBeCloseTo(Math.PI * 45);
    });
});

describe('code blocks', () => {
    it('resolves languages from names, aliases and file names; only the built-in list', () => {
        expect(resolveCodeLanguage('ts')).toBe('typescript');
        expect(resolveCodeLanguage('Bash')).toBe('shellscript');
        expect(resolveCodeLanguage('cpp')).toBeUndefined();
        expect(resolveCodeLanguage('ruby')).toBeUndefined();
        expect(languageFromFileName('src/App.vue')).toBe('vue');
        expect(languageFromFileName('Dockerfile')).toBe('dockerfile');
        expect(languageFromFileName('.env.local')).toBe('env');
        expect(languageFromFileName('README')).toBe('text');
        expect(languageFromFileName('main.rb')).toBe('text');
        expect(['a.ts', 'b.json', 'c.html', 'd.scss', 'e.sh', 'f.yml', 'g.txt', 'h.png'].map(codeFileKind)).toEqual([
            'code',
            'json',
            'markup',
            'style',
            'terminal',
            'data',
            'text',
            'image',
        ]);
    });

    it('diff lines from markers or line numbers', () => {
        expect(diffLines(['--- a', '+++ b', '-old', '+new', ' same'], { fromMarkers: true })).toEqual([
            undefined,
            undefined,
            'remove',
            'add',
            undefined,
        ]);
        expect(diffLines(['a', 'b', 'c'], { added: [1], removed: [3] })).toEqual(['add', undefined, 'remove']);
    });
});

describe('editor helpers', () => {
    it('token colours, counts and heading slugs', () => {
        expect(editorColorValue('danger', 'text')).toBe('color-mix(in srgb, var(--wc-danger) 75%, var(--wc-fg))');
        expect(editorColorValue('warn', 'background')).toBe('color-mix(in oklab, var(--wc-warn) 20%, transparent)');
        expect(editorColorToken(editorColorValue('danger', 'text'))).toBe('danger');
        expect(editorColorToken('color-mix(in oklab, var(--wc-warn) 25%, transparent)')).toBe('warn');
        expect(editorColorToken('var(--wc-info)')).toBe('info');
        expect(editorColorToken('red')).toBeUndefined();
        expect(countText('Grüße aus Hamburg, l’Été 2026!')).toEqual({ characters: 30, words: 5 });
        expect(headingSlug('Über Größe & Maß', 0)).toBe('uber-grosse-mass-1');
    });

    it('cleans HTML from the source mode', () => {
        const clean = sanitizeEditorHtml(
            '<p onclick="x()" style="color: var(--wc-danger); position: fixed">a<script>alert(1)</script></p><a href="javascript:alert(1)">b</a><img src="data:image/png;base64,AAAA" onerror="x()"><iframe src="/x"></iframe><p style="text-align: center">c</p>'
        );
        expect(clean).toBe(
            '<p style="color: var(--wc-danger)">a</p><a>b</a><img src="data:image/png;base64,AAAA"><p style="text-align: center">c</p>'
        );
        const colored =
            '<p><span style="color: color-mix(in srgb, var(--wc-info) 75%, var(--wc-fg)); background-color: color-mix(in oklab, var(--wc-warn) 20%, transparent)">x</span></p>';
        expect(sanitizeEditorHtml(colored)).toBe(colored);
    });
});
