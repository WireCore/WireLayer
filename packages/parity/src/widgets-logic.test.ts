import {
    addRecentEmoji,
    announcer,
    caretAfterDigits,
    checkJson,
    colorChannels,
    colorFromChannels,
    countryFlag,
    defaultEmojis,
    localeEmojis,
    detectLogLevel,
    dragFilesState,
    filterLogLines,
    findPhoneCountry,
    formatColor,
    formatJson,
    formatPhoneNumber,
    gridIndexForKey,
    hslToRgb,
    insertMention,
    isValidPhoneNumber,
    jsonErrorOffset,
    jsonExpandedIds,
    jsonTree,
    logWindow,
    matchesAccept,
    mentionQuery,
    mentionSegments,
    moveBetween,
    nationalDigits,
    oklchToRgb,
    panelRectForKey,
    parseColorText,
    parseHex,
    parseMentionMarkup,
    parsePhoneNumber,
    phonePlaceholder,
    ringParts,
    rgbToHsb,
    rgbToHsl,
    rgbToOklch,
    searchEmojis,
    searchJson,
    SortableController,
    sortableTargetForKey,
    toE164,
    toHex,
    toMentionMarkup,
    translations,
    typedSignature,
    updateMentions,
    UploadQueue,
    watermarkBackground,
    type SortableContainer,
    type UploadState,
} from '@wirecore/wirelayer-recipes';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { de } from '@wirecore/wirelayer-recipes/locales/de';

// Logic of the building blocks and special inputs: colours (OKLCH), phone numbers, emojis, sortable moves, mentions,
// JSON, logs, uploads, watermark, ring parts and the floating panel's keys

afterEach(() => announcer.reset());

describe('colours', () => {
    it('reads and writes hex (short, alpha)', () => {
        expect(parseHex('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
        expect(parseHex('1e66f580')).toEqual({ r: 30, g: 102, b: 245, a: 0.502 });
        expect(parseHex('#12')).toBeNull();
        expect(toHex({ r: 30, g: 102, b: 245, a: 1 })).toBe('#1e66f5');
        expect(toHex({ r: 30, g: 102, b: 245, a: 0.5 })).toBe('#1e66f580');
    });

    it('converts to HSL and HSB and back', () => {
        const blue = parseHex('#1e66f5')!;
        const hsl = rgbToHsl(blue);
        expect(Math.round(hsl.h)).toBe(220);
        expect(toHex(hslToRgb(hsl.h, hsl.s, hsl.l))).toBe('#1e66f5');
        expect(rgbToHsb({ r: 255, g: 0, b: 0, a: 1 })).toEqual({ h: 0, s: 100, b: 100 });
    });

    it('computes OKLCH like the CSS reference (red, white, grey) and back', () => {
        const red = rgbToOklch({ r: 255, g: 0, b: 0, a: 1 });
        expect(red.l).toBeCloseTo(0.628, 3);
        expect(red.c).toBeCloseTo(0.2577, 3);
        expect(red.h).toBeCloseTo(29.23, 1);
        expect(rgbToOklch({ r: 255, g: 255, b: 255, a: 1 })).toMatchObject({ c: 0, h: 0 });
        expect(rgbToOklch({ r: 255, g: 255, b: 255, a: 1 }).l).toBeCloseTo(1, 4);
        expect(toHex(oklchToRgb(red))).toBe('#ff0000');
        expect(formatColor('#ff0000', 'oklch')).toBe('oklch(62.8% 0.258 29.2)');
    });

    it('maps colours outside sRGB into it, keeping lightness and hue', () => {
        const rgb = oklchToRgb({ l: 0.7, c: 0.4, h: 150 });
        for (const channel of [rgb.r, rgb.g, rgb.b]) expect(channel).toBeGreaterThanOrEqual(0);
        for (const channel of [rgb.r, rgb.g, rgb.b]) expect(channel).toBeLessThanOrEqual(255);
        expect(rgbToOklch(rgb).l).toBeCloseTo(0.7, 2);
    });

    it('formats and parses every format', () => {
        expect(formatColor('#1e66f5', 'rgb')).toBe('rgb(30 102 245)');
        expect(formatColor('#1e66f580', 'rgb')).toBe('rgb(30 102 245 / 50%)');
        expect(formatColor('#ff0000', 'hsl')).toBe('hsl(0 100% 50%)');
        expect(formatColor('#ff0000', 'hsb')).toBe('hsb(0 100% 100%)');
        expect(parseColorText('rgb(30 102 245)')).toBe('#1e66f5');
        expect(parseColorText('rgba(30, 102, 245, 0.5)')).toBe('#1e66f580');
        expect(parseColorText('hsl(0 100% 50%)')).toBe('#ff0000');
        // The rounded text is off by one step in a channel; precise values give the colour exactly
        expect(parseColorText('oklch(62.8% 0.258 29.2)')).toBe('#ff0001');
        expect(parseColorText('oklch(0.627955 0.257683 29.2339)')).toBe('#ff0000');
        expect(parseColorText('Bluish')).toBeNull();
    });

    it('reads and writes the channel fields per format', () => {
        expect(colorChannels('#ff0000', 'rgb')).toEqual([255, 0, 0]);
        expect(colorChannels('#ff0000', 'oklch')).toEqual([62.8, 0.258, 29.2]);
        expect(colorFromChannels('rgb', [0, 0, 255])).toBe('#0000ff');
        expect(colorFromChannels('oklch', [62.7955, 0.257683, 29.2339], '#00000080')).toBe('#ff000080');
    });
});

describe('phone numbers', () => {
    const de = findPhoneCountry('de')!;
    const us = findPhoneCountry('US')!;
    const it_ = findPhoneCountry('IT')!;

    it('drops the trunk prefix and formats per country', () => {
        expect(nationalDigits('030 / 123 456', de)).toBe('30123456');
        expect(formatPhoneNumber('30123456', de)).toBe('301 23456');
        expect(formatPhoneNumber('2015550123', us)).toBe('(201) 555-0123');
        expect(formatPhoneNumber('201', us)).toBe('(201');
        // Italy keeps the leading 0
        expect(nationalDigits('06 1234567', it_)).toBe('061234567');
    });

    it('writes E.164 and checks the length', () => {
        expect(toE164('30123456', de)).toBe('+4930123456');
        expect(toE164('', de)).toBe('');
        expect(isValidPhoneNumber('30123456', de)).toBe(true);
        expect(isValidPhoneNumber('301', de)).toBe(false);
        expect(isValidPhoneNumber('20155501234', us)).toBe(false);
    });

    it('splits international numbers by calling code; +1 keeps the current country', () => {
        expect(parsePhoneNumber('+49 30 123456', us)).toMatchObject({ country: { code: 'DE' }, digits: '30123456' });
        expect(parsePhoneNumber('0043 1 234567', de)).toMatchObject({ country: { code: 'AT' }, digits: '1234567' });
        expect(parsePhoneNumber('+1 416 555 0100', findPhoneCountry('CA')!)).toMatchObject({ country: { code: 'CA' } });
        expect(parsePhoneNumber('+1 416 555 0100', de)).toMatchObject({ country: { code: 'US' } });
        expect(parsePhoneNumber('0171 2345678', de)).toMatchObject({ country: { code: 'DE' }, digits: '1712345678' });
    });

    it('keeps the caret after the same digit, shows flags and placeholders', () => {
        expect(caretAfterDigits('(201) 555-0123', 3)).toBe(4);
        expect(caretAfterDigits('301 23456', 4)).toBe(5);
        expect(caretAfterDigits('301', 0)).toBe(0);
        expect(countryFlag('de')).toBe('🇩🇪');
        expect(phonePlaceholder(us)).toBe('(123) 456-7890');
    });
});

describe('emojis', () => {
    it('finds emojis by English words, ignoring case and accents; names first', () => {
        const all = defaultEmojis();
        expect(all.length).toBeGreaterThan(300);
        expect(all.find((entry) => entry.emoji === '🍀')!.name).toBe('Four leaf clover');
        expect(searchEmojis(all, 'Luck').map((entry) => entry.emoji)).toContain('🍀');
        expect(searchEmojis(all, 'thumbs up')[0]!.emoji).toBe('👍');
        expect(searchEmojis(all, 'glück')).toEqual([]);
        expect(searchEmojis(all, 'xyzxyz')).toEqual([]);
        expect(searchEmojis(all, '  ')).toHaveLength(all.length);
    });

    it('localeEmojis: names and words of a language module; English words always find', () => {
        expect(localeEmojis()).toEqual(defaultEmojis());
        const german = localeEmojis(de.emojiPicker.emojis);
        expect(german).toHaveLength(defaultEmojis().length);
        expect(german.find((entry) => entry.emoji === '🍀')!.name).toBe('Kleeblatt');
        expect(german.find((entry) => entry.emoji === '👍')!.name).toBe('Daumen hoch');
        // Accents ignored: "gluck" finds "glück"
        expect(searchEmojis(german, 'gluck').map((entry) => entry.emoji)).toContain('🍀');
        expect(searchEmojis(german, 'daumen hoch')[0]!.emoji).toBe('👍');
        expect(searchEmojis(german, 'clover')[0]!.emoji).toBe('🍀');
        const french = localeEmojis('🍀 Trèfle à quatre feuilles|chance');
        expect(french.find((entry) => entry.emoji === '🍀')!.name).toBe('Trèfle à quatre feuilles');
        expect(searchEmojis(french, 'chance')[0]!.emoji).toBe('🍀');
        expect(searchEmojis(french, 'luck').map((entry) => entry.emoji)).toContain('🍀');
        expect(french.find((entry) => entry.emoji === '👍')!.name).toBe('Thumbs up');
        expect(localeEmojis('🍀 Trèfle à quatre feuilles|chance')).toBe(french);
    });

    it('moves through a grid with arrows, Home/End and Ctrl+Home/End', () => {
        expect(gridIndexForKey('ArrowRight', 0, 10, 4)).toBe(1);
        expect(gridIndexForKey('ArrowRight', 0, 10, 4, { rtl: true })).toBe(0);
        expect(gridIndexForKey('ArrowDown', 1, 10, 4)).toBe(5);
        expect(gridIndexForKey('ArrowDown', 7, 10, 4)).toBe(7);
        expect(gridIndexForKey('ArrowUp', 5, 10, 4)).toBe(1);
        expect(gridIndexForKey('Home', 6, 10, 4)).toBe(4);
        expect(gridIndexForKey('End', 9, 10, 4)).toBe(9);
        expect(gridIndexForKey('End', 0, 10, 4, { ctrl: true })).toBe(9);
        expect(gridIndexForKey('a', 0, 10, 4)).toBeUndefined();
    });

    it('keeps recently used emojis unique and limited', () => {
        expect(addRecentEmoji(['😀', '👍'], '👍')).toEqual(['👍', '😀']);
        expect(addRecentEmoji(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
    });
});

describe('sortable', () => {
    it('finds the target of a key along the orientation and across containers', () => {
        expect(sortableTargetForKey('ArrowDown', 0, 3)).toEqual({ index: 1 });
        expect(sortableTargetForKey('ArrowUp', 0, 3)).toEqual({ index: 0 });
        expect(sortableTargetForKey('ArrowRight', 1, 3)).toEqual({ container: 1 });
        expect(sortableTargetForKey('ArrowRight', 1, 3, { rtl: true })).toEqual({ container: -1 });
        expect(sortableTargetForKey('ArrowRight', 1, 3, { orientation: 'horizontal' })).toEqual({ index: 2 });
        expect(sortableTargetForKey('ArrowDown', 1, 3, { orientation: 'horizontal' })).toEqual({ container: 1 });
        expect(sortableTargetForKey('ArrowDown', 1, 6, { orientation: 'grid', columns: 3 })).toEqual({ index: 4 });
        // Grids: the arrows that would leave the grid go to the neighbouring container
        const grid = { orientation: 'grid', columns: 3 } as const;
        expect(sortableTargetForKey('ArrowRight', 5, 6, grid)).toEqual({ container: 1, at: 'start' });
        expect(sortableTargetForKey('ArrowLeft', 0, 6, grid)).toEqual({ container: -1, at: 'end' });
        expect(sortableTargetForKey('ArrowLeft', 0, 6, { ...grid, rtl: true })).toEqual({ index: 1 });
        expect(sortableTargetForKey('ArrowDown', 4, 6, grid)).toEqual({ container: 1, at: 'start' });
        expect(sortableTargetForKey('ArrowUp', 1, 6, grid)).toEqual({ container: -1, at: 'end' });
        expect(sortableTargetForKey('ArrowDown', 2, 5, grid)).toEqual({ index: 2 });
        expect(sortableTargetForKey('End', 0, 6)).toEqual({ index: 5 });
        expect(sortableTargetForKey('x', 0, 6)).toBeUndefined();
    });

    it('moves an item between lists', () => {
        expect(moveBetween(['a', 'b'], ['c'], 0, 1)).toEqual({ from: ['b'], to: ['c', 'a'] });
        expect(moveBetween(['a'], [], 0, 5)).toEqual({ from: [], to: ['a'] });
    });

    function container(id: string, items: string[], group = 'g'): SortableContainer & { list: unknown[] } {
        const entry = {
            id,
            list: items as unknown[],
            group: () => group,
            element: () => null,
            items: () => entry.list,
            setItems: (next: unknown[]) => (entry.list = next),
            onMove: vi.fn(),
            itemLabel: (item: unknown) => String(item),
            label: () => id,
            orientation: () => 'vertical' as const,
            columns: () => 1,
            disabled: () => false,
            texts: () => translations.sortable,
        };
        return entry;
    }
    const key = (name: string) => new KeyboardEvent('keydown', { key: name, cancelable: true });

    it('picks up, moves (also into the next list), drops and reports the move', () => {
        const controller = new SortableController();
        const todo = container('todo', ['a', 'b', 'c']);
        const done = container('done', ['x']);
        controller.register(todo);
        controller.register(done);
        controller.keydown('todo', 0, key(' '));
        expect(controller.state('todo')).toMatchObject({ grabbed: 0, active: true });
        controller.keydown('todo', 0, key('ArrowDown'));
        expect(todo.list).toEqual(['b', 'a', 'c']);
        controller.keydown('todo', 1, key(' '));
        expect(controller.state('todo').grabbed).toBeNull();
        expect(todo.onMove).toHaveBeenCalledWith({
            item: 'a',
            from: { container: 'todo', index: 0 },
            to: { container: 'todo', index: 1 },
        });
        // Without elements there is no document order – the move into the neighbour comes from moveBetween
        controller.pickUp(todo, 2, 'keyboard');
        controller.keydown('todo', 2, key('Escape'));
        expect(todo.list).toEqual(['b', 'a', 'c']);
    });

    it('Escape puts the item back where it was', () => {
        const controller = new SortableController();
        const list = container('list', ['a', 'b', 'c']);
        controller.register(list);
        controller.keydown('list', 2, key('Enter'));
        controller.keydown('list', 2, key('Home'));
        expect(list.list).toEqual(['c', 'a', 'b']);
        controller.keydown('list', 0, key('Escape'));
        expect(list.list).toEqual(['a', 'b', 'c']);
        expect(list.onMove).not.toHaveBeenCalled();
    });

    it('keeps the same state object while nothing changes', () => {
        const controller = new SortableController();
        controller.register(container('list', ['a']));
        expect(controller.state('list')).toBe(controller.state('list'));
    });
});

describe('mentions', () => {
    const markup = 'Hello @[Anna Berg](anna) and #[Release](r1)!';

    it('reads markup into text and mentions and writes it back', () => {
        const parsed = parseMentionMarkup(markup, ['@', '#']);
        expect(parsed.text).toBe('Hello @Anna Berg and #Release!');
        expect(parsed.mentions).toEqual([
            { trigger: '@', id: 'anna', label: 'Anna Berg', start: 6, end: 16 },
            { trigger: '#', id: 'r1', label: 'Release', start: 21, end: 29 },
        ]);
        expect(toMentionMarkup(parsed.text, parsed.mentions)).toBe(markup);
        // Unknown trigger characters stay text
        expect(parseMentionMarkup(markup, ['@']).text).toBe('Hello @Anna Berg and #[Release](r1)!');
    });

    it('moves mentions after an edit and drops the edited one', () => {
        const { text, mentions } = parseMentionMarkup(markup, ['@', '#']);
        const typed = updateMentions(text, `Hi ${text.slice(6)}`, mentions);
        expect(typed.map((mention) => mention.start)).toEqual([3, 18]);
        const broken = updateMentions(text, text.replace('Anna Berg', 'Anna'), mentions);
        expect(broken.map((mention) => mention.id)).toEqual(['r1']);
    });

    it('finds the mention being typed before the caret', () => {
        expect(mentionQuery('Hello @An', 9, ['@'])).toEqual({ trigger: '@', query: 'An', start: 6 });
        expect(mentionQuery('Hello @Anna B', 13, ['@'])).toEqual({ trigger: '@', query: 'Anna B', start: 6 });
        expect(mentionQuery('mail@acme', 9, ['@'])).toBeNull();
        expect(mentionQuery('@a\nb', 4, ['@'])).toBeNull();
        expect(mentionQuery('@a  b', 5, ['@'])).toBeNull();
        expect(mentionQuery('#', 1, ['@', '#'])).toEqual({ trigger: '#', query: '', start: 0 });
    });

    it('inserts a mention with a space and splits the text for the highlighting', () => {
        const current = parseMentionMarkup('Hi @Be and @[Anna](a)', ['@']);
        const query = mentionQuery(current.text, 6, ['@'])!;
        const result = insertMention(current, query, 6, { id: 'ben', label: 'Ben Ott' });
        expect(toMentionMarkup(result.text, result.mentions)).toBe('Hi @[Ben Ott](ben) and @[Anna](a)');
        expect(result.caret).toBe(12);
        expect(mentionSegments(result.text, result.mentions).map((part) => !!part.mention)).toEqual([
            false,
            true,
            false,
            true,
        ]);
    });
});

describe('JSON', () => {
    const data = { name: 'web-01', 'two words': 1, tags: ['prod', 'eu'], nested: { ok: true, none: null } };

    it('builds a tree with paths as ids and opens it to a depth', () => {
        const root = jsonTree(data);
        expect(root.children!.map((node) => node.id)).toEqual(['$.name', '$["two words"]', '$.tags', '$.nested']);
        expect(root.children![2]!.children!.map((node) => [node.id, node.type])).toEqual([
            ['$.tags[0]', 'string'],
            ['$.tags[1]', 'string'],
        ]);
        expect(jsonExpandedIds(root, 1)).toEqual(['$']);
        expect(jsonExpandedIds(root, 2)).toEqual(['$', '$.tags', '$.nested']);
    });

    it('searches keys and values and opens the way to the hits', () => {
        expect(searchJson(jsonTree(data), 'EU')).toEqual({ matches: ['$.tags[1]'], expand: ['$', '$.tags'] });
        expect(searchJson(jsonTree(data), 'ok').matches).toEqual(['$.nested.ok']);
        expect(searchJson(jsonTree(data), ' ')).toEqual({ matches: [], expand: [] });
    });

    it('checks and formats JSON text, with the position of an error', () => {
        expect(checkJson('{"a":1}')).toEqual({ valid: true, value: { a: 1 } });
        const error = checkJson('{\n  "a": 1,\n}');
        expect(error.valid).toBe(false);
        expect(error).toMatchObject({ line: 3, column: 1 });
        expect(checkJson('{"tags": ["prod",]}')).toMatchObject({ line: 1, column: 18 });
        expect(jsonErrorOffset('{"a": tru}')).toBe(9);
        expect(jsonErrorOffset('"\\x"')).toBe(2);
        expect(jsonErrorOffset('[1, 2] x')).toBe(7);
        expect(jsonErrorOffset('{"a": [1, {"b": null}], "c": -0.5e3}')).toBe(-1);
        expect(jsonErrorOffset('{')).toBe(1);
        expect(formatJson('{"a":[1,2]}')).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
        expect(formatJson('{"a":1}', 0)).toBe('{"a":1}');
        expect(formatJson('{')).toBeNull();
    });
});

describe('logs', () => {
    const lines = [
        { text: 'Start', level: 'info' as const },
        { text: 'Slow', level: 'warn' as const },
        { text: 'Broken', level: 'error' as const },
        { text: 'no level' },
    ];

    it('filters by level and words (lines without level stay)', () => {
        expect(filterLogLines(lines, { levels: ['error'] })).toEqual([2, 3]);
        expect(filterLogLines(lines, { query: 'broken' })).toEqual([2]);
        expect(filterLogLines(lines, { query: 'level no' })).toEqual([3]);
    });

    it('reads the level from the text', () => {
        expect(detectLogLevel('2026-10-21 ERROR Connection')).toBe('error');
        expect(detectLogLevel('[warn] slow')).toBe('warn');
        expect(detectLogLevel('debug: x')).toBe('debug');
        expect(detectLogLevel('Hello')).toBeUndefined();
    });

    it('renders only the rows in view (plus overscan), the first rows without a height', () => {
        expect(logWindow(400, 200, 20, 1000, 5)).toEqual({ start: 15, end: 35, before: 300, after: 19300 });
        expect(logWindow(0, 0, 20, 1000)).toEqual({ start: 0, end: 100, before: 0, after: 0 });
    });
});

describe('files', () => {
    it('matches types, wildcards and extensions', () => {
        expect(matchesAccept('image/png', 'a.png', 'image/*')).toBe(true);
        expect(matchesAccept('application/pdf', 'a.pdf', ['image/png', '.pdf'])).toBe(true);
        expect(matchesAccept('text/plain', 'a.txt', 'image/*, application/pdf')).toBe(false);
        expect(matchesAccept('text/plain', 'a.txt', undefined)).toBe(true);
    });

    it('tells accepted and rejected drags apart', () => {
        const png = { kind: 'file', type: 'image/png' };
        expect(dragFilesState([png], { accept: 'image/*' })).toBe('accept');
        expect(dragFilesState([{ kind: 'file', type: 'text/plain' }], { accept: 'image/*' })).toBe('reject');
        expect(dragFilesState([png, png], { maxFiles: 2, current: 1 })).toBe('reject');
        expect(dragFilesState([{ kind: 'file', type: '' }], { accept: 'image/*' })).toBe('accept');
    });

    it('uploads with progress, cancels and retries', async () => {
        const changes: Map<File, UploadState>[] = [];
        let finish = () => {};
        const upload = vi.fn(
            (_file: File, { onProgress, signal }: { onProgress: (percent: number) => void; signal: AbortSignal }) =>
                new Promise<void>((resolve, reject) => {
                    onProgress(40.4);
                    finish = resolve;
                    signal.addEventListener('abort', () => reject(new Error('aborted')));
                })
        );
        const queue = new UploadQueue(upload, (states) => changes.push(states));
        const file = new File(['x'], 'a.txt');
        queue.add([file]);
        expect(queue.get(file)).toEqual({ status: 'pending', progress: 0 });
        const first = queue.start(file);
        expect(queue.get(file)).toEqual({ status: 'uploading', progress: 40 });
        queue.cancel(file);
        await first;
        expect(queue.get(file)?.status).toBe('cancelled');
        const second = queue.start(file);
        finish();
        await second;
        expect(queue.get(file)).toEqual({ status: 'done', progress: 100 });
        expect(upload).toHaveBeenCalledTimes(2);

        const failing = new UploadQueue(
            () => Promise.reject(new Error('503')),
            () => {}
        );
        failing.add([file]);
        await failing.startAll();
        expect(failing.get(file)).toEqual({ status: 'error', progress: 0, error: '503' });
    });
});

describe('graphics and panel keys', () => {
    it('draws the watermark tile with the text, angle and opacity', () => {
        const { backgroundImage, backgroundSize } = watermarkBackground({ text: 'A&B', rotate: -30, opacity: 0.2 });
        const svg = decodeURIComponent(backgroundImage);
        expect(svg).toContain('A&amp;B');
        expect(svg).toContain('rotate(-30');
        expect(svg).toContain('opacity="0.2"');
        expect(backgroundSize).toMatch(/^\d+px \d+px$/);
    });

    it('lays out ring parts one after another', () => {
        expect(ringParts([30, 20])).toEqual([
            { start: 0, length: 0.3 },
            { start: 0.3, length: 0.2 },
        ]);
        expect(ringParts([30, 30], 50)[1]).toEqual({ start: 0.6, length: 0.6 });
        expect(ringParts([50], 100, 0.01)[0]!.length).toBeCloseTo(0.49);
    });

    it('writes a typed signature as SVG (escaped)', () => {
        expect(decodeURIComponent(typedSignature('Anna <B>'))).toContain('Anna &lt;B&gt;');
    });

    it('moves with Alt+arrows and resizes with Alt+Shift+arrows within the limits', () => {
        const rect = { position: { x: 100, y: 100 }, size: { width: 300, height: 200 } };
        const keyOf = (key: string, shiftKey = false) => ({ key, altKey: true, shiftKey });
        expect(panelRectForKey(keyOf('ArrowLeft'), rect)).toEqual({ position: { x: 90, y: 100 } });
        expect(panelRectForKey(keyOf('ArrowLeft'), rect, { rtl: true })).toEqual({ position: { x: 110, y: 100 } });
        expect(panelRectForKey(keyOf('ArrowDown', true), rect, { step: 20 })).toEqual({
            size: { width: 300, height: 220 },
        });
        expect(panelRectForKey(keyOf('ArrowLeft', true), rect, { minSize: { width: 295, height: 100 } })).toEqual({
            size: { width: 295, height: 200 },
        });
        expect(panelRectForKey({ key: 'ArrowLeft', altKey: false, shiftKey: false }, rect)).toBeUndefined();
    });
});
