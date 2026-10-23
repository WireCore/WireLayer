import {
    activeSection,
    addConditionNode,
    combineValidators,
    conditionFieldsFromColumns,
    createValidators,
    debounce,
    emptyConditionGroup,
    formatBytes,
    formatDate,
    formatDateTime,
    formatHotkey,
    formatHotkeyText,
    formatList,
    formatRelativeTime,
    formatTrend,
    hasLength,
    historyInit,
    historyPush,
    historyRedo,
    historyUndo,
    HotkeyRegistry,
    isActiveCondition,
    isEditableTarget,
    isEmail,
    isIban,
    isInRange,
    isInteger,
    isPhone,
    isRequired,
    isUrl,
    matchesCondition,
    matchesField,
    matchesHotkeyStep,
    matchesPattern,
    messages,
    newConditionRule,
    nextLandmark,
    normalizeHotkey,
    overflowVisibleCount,
    relativeTimeParts,
    relativeTimeRefresh,
    removeConditionNode,
    setConditionField,
    setConditionOperator,
    sizeOverrides,
    statisticTrend,
    throttle,
    toDateTimeAttribute,
    toggleSelection,
    updateConditionNode,
    type ConditionField,
    type ConditionGroup,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it, vi } from 'vitest';
import { de as german } from '@wirecore/wirelayer-recipes/locales/de';

const key = (key: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey', boolean>> = {}) => ({
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...mods,
});

describe('format', () => {
    const now = '2026-10-21T10:00:00Z';
    it('relative times: largest fitting unit, "gestern", "jetzt"; refresh interval by distance', () => {
        expect(formatRelativeTime('2026-10-21T09:57:00Z', 'de-DE', { now })).toBe('vor 3 Minuten');
        expect(formatRelativeTime('2026-10-20T10:00:00Z', 'de-DE', { now })).toBe('gestern');
        expect(formatRelativeTime('2026-10-20T10:00:00Z', 'de-DE', { now, numeric: 'always' })).toBe('vor 1 Tag');
        expect(formatRelativeTime('2026-10-21T09:59:55Z', 'de-DE', { now })).toBe('jetzt');
        expect(formatRelativeTime('2026-10-23T10:00:00Z', 'en-US', { now })).toBe('in 2 days');
        expect(relativeTimeParts('2026-10-21T09:00:30Z', now)).toEqual({ value: -59, unit: 'minute' });
        expect(relativeTimeRefresh('2026-10-21T09:59:30Z', now)).toBe(10_000);
        expect(relativeTimeRefresh('2026-10-21T09:30:00Z', now)).toBe(60_000);
        expect(formatRelativeTime('no date')).toBe('');
    });

    it('dates in a time zone, <time datetime> values', () => {
        expect(formatDate('2026-10-21T23:30:00Z', 'de-DE', { timeZone: 'Europe/Berlin' })).toBe('22.10.2026');
        expect(formatDate('2026-10-21', 'de-DE', { dateStyle: 'long', timeZone: 'UTC' })).toBe('21. Oktober 2026');
        expect(formatDateTime('2026-10-21T12:30:00Z', 'de-DE', { timeZone: 'Europe/Berlin' })).toBe(
            '21.10.2026, 14:30'
        );
        expect(toDateTimeAttribute('2026-10-21')).toBe('2026-10-21');
        expect(toDateTimeAttribute(Date.UTC(2026, 9, 21, 12))).toBe('2026-10-21T12:00:00.000Z');
    });

    it('bytes (decimal and binary), lists, trends', () => {
        expect(formatBytes(1_234_567)).toBe('1.2 MB');
        expect(formatBytes(1_234_567, 'de-DE', { base: 'binary' })).toBe('1,2 MiB');
        expect(formatBytes(512)).toBe('512 byte');
        expect(formatBytes(2048, 'en-US', { unitDisplay: 'long' })).toBe('2 kilobytes');
        expect(formatList(['Anna', 'Ben', 'Clara'])).toBe('Anna, Ben, and Clara');
        expect(formatList(['Mail', 'SMS'], 'de-DE', { type: 'disjunction' })).toBe('Mail oder SMS');
        expect(formatTrend(12)).toBe('+12%');
        expect(formatTrend(0)).toBe('0%');
        expect(statisticTrend(-2)).toEqual({ direction: 'down', tone: 'negative' });
        expect(statisticTrend(-2, true)).toEqual({ direction: 'down', tone: 'positive' });
        expect(statisticTrend(0)).toEqual({ direction: 'flat', tone: 'neutral' });
    });
});

describe('hotkeys', () => {
    it('matches steps: mod is Ctrl or ⌘, shift only for letters or when named', () => {
        expect(matchesHotkeyStep(key('k', { ctrlKey: true }), 'mod+k')).toBe(true);
        expect(matchesHotkeyStep(key('k', { metaKey: true }), 'mod+k')).toBe(true);
        expect(matchesHotkeyStep(key('k'), 'mod+k')).toBe(false);
        expect(matchesHotkeyStep(key('?', { shiftKey: true }), '?')).toBe(true);
        expect(matchesHotkeyStep(key('K', { shiftKey: true }), 'k')).toBe(false);
        expect(matchesHotkeyStep(key('K', { shiftKey: true, ctrlKey: true }), 'mod+shift+k')).toBe(true);
        expect(matchesHotkeyStep(key('Escape'), 'esc')).toBe(true);
        expect(normalizeHotkey('Shift+Mod+K')).toBe(normalizeHotkey('mod+shift+k'));
    });

    it('formats per platform and language', () => {
        const de = german.hotkeys.keys;
        expect(formatHotkey('mod+shift+k', de)).toEqual([['Strg', 'Umschalt', 'K']]);
        expect(formatHotkey('mod+shift+k', de, true)).toEqual([['⌘', '⇧', 'K']]);
        expect(formatHotkey('g i', de)).toEqual([['G'], ['I']]);
        expect(formatHotkey('alt+arrowup', messages.en.hotkeys.keys)).toEqual([['Alt', '↑']]);
        expect(formatHotkeyText('mod+k', de)).toBe('Strg+K');
        expect(formatHotkeyText('mod+k', de, true)).toBe('⌘K');
    });

    it('registry: sequences, field exception, conflicts in development, unregistering', () => {
        const registry = new HotkeyRegistry();
        const save = vi.fn();
        const inbox = vi.fn();
        const help = vi.fn();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const offSave = registry.register('mod+s', save, { description: 'Save' });
        registry.register('g i', inbox, { description: 'Inbox' });
        registry.register('h', help);
        const event = (init: KeyboardEventInit, target?: EventTarget) => {
            const keyboard = new KeyboardEvent('keydown', { cancelable: true, ...init });
            if (target) Object.defineProperty(keyboard, 'target', { value: target });
            registry.handle(keyboard);
            return keyboard;
        };
        expect(event({ key: 's', ctrlKey: true }).defaultPrevented).toBe(true);
        expect(save).toHaveBeenCalledTimes(1);
        event({ key: 'g' });
        event({ key: 'i' });
        expect(inbox).toHaveBeenCalledTimes(1);
        const input = document.createElement('input');
        event({ key: 'h' }, input);
        expect(help).not.toHaveBeenCalled();
        event({ key: 's', ctrlKey: true }, input);
        expect(save).toHaveBeenCalledTimes(2);
        expect(isEditableTarget(document.createElement('textarea'))).toBe(true);
        expect(isEditableTarget(document.createElement('button'))).toBe(false);

        registry.register('Mod+S', vi.fn(), { description: 'Also save' });
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('"Mod+S" is registered more than once'));
        expect([...registry.conflicts().keys()]).toEqual(['mod+s']);
        expect(registry.list().map((entry) => entry.description)).toEqual(['Save', 'Inbox', 'Also save']);
        offSave();
        expect(registry.conflicts().size).toBe(0);
        warn.mockRestore();
    });
});

const fields: ConditionField[] = [
    { id: 'name', label: 'Name', type: 'text' },
    { id: 'load', label: 'Load', type: 'number' },
    { id: 'since', label: 'Since', type: 'date' },
    { id: 'location', label: 'Location', type: 'select', options: [{ value: 'FRA', label: 'Frankfurt' }] },
    { id: 'online', label: 'Online', type: 'boolean' },
];
const rows = [
    { name: 'web-01', load: 42, since: '2024-03-01', location: 'FRA', online: true },
    { name: 'db-primary', load: 71, since: '2023-11-15', location: 'FRA', online: true },
    { name: 'backup', load: 18, since: '', location: 'NUE', online: false },
];
const names = (tree: ConditionGroup) =>
    rows.filter((row) => matchesCondition(row, tree, fields)).map((row) => row.name);

describe('conditions', () => {
    it('matches nested and/or groups with every field type; incomplete rules do not filter', () => {
        const tree: ConditionGroup = {
            type: 'group',
            id: 'root',
            combinator: 'and',
            children: [
                { type: 'rule', id: 'a', field: 'load', operator: 'between', value: [20, null] },
                {
                    type: 'group',
                    id: 'g',
                    combinator: 'or',
                    children: [
                        { type: 'rule', id: 'b', field: 'name', operator: 'startsWith', value: 'WEB' },
                        { type: 'rule', id: 'c', field: 'since', operator: 'dateBefore', value: '2024-01-01' },
                    ],
                },
                { type: 'rule', id: 'd', field: 'name', operator: 'contains', value: '' },
            ],
        };
        expect(names(tree)).toEqual(['web-01', 'db-primary']);
        expect(names({ ...tree, combinator: 'or' })).toEqual(['web-01', 'db-primary']);
        expect(names({ ...tree, not: true })).toEqual(['backup']);
        const select = (operator: string, value?: unknown) =>
            names({
                ...emptyConditionGroup('and', 'r'),
                children: [{ type: 'rule', id: 'x', field: 'location', operator: operator as never, value }],
            });
        expect(select('in', ['NUE'])).toEqual(['backup']);
        expect(select('notEquals', 'FRA')).toEqual(['backup']);
        expect(
            names({
                ...emptyConditionGroup('and', 'r'),
                children: [{ type: 'rule', id: 'x', field: 'online', operator: 'equals', value: false }],
            })
        ).toEqual(['backup']);
        expect(
            names({
                ...emptyConditionGroup('and', 'r'),
                children: [{ type: 'rule', id: 'x', field: 'since', operator: 'empty' }],
            })
        ).toEqual(['backup']);
        expect(names(emptyConditionGroup())).toHaveLength(3);
        expect(isActiveCondition(emptyConditionGroup())).toBe(false);
        expect(matchesCondition(rows[0], null)).toBe(true);
    });

    it('edits the tree: add, update, remove; field and operator changes keep or reset the value', () => {
        let tree = emptyConditionGroup('and', 'root');
        const rule = newConditionRule(fields, 'load', 'r1');
        expect(rule).toEqual({ type: 'rule', id: 'r1', field: 'load', operator: 'equals', value: null });
        tree = addConditionNode(tree, 'root', rule);
        tree = addConditionNode(tree, 'root', { ...emptyConditionGroup('or', 'g1'), children: [] });
        tree = addConditionNode(tree, 'g1', newConditionRule(fields, 'name', 'r2'));
        tree = updateConditionNode(tree, 'r2', (node) => ({ ...node, value: 'web' }) as typeof node);
        expect((tree.children[1] as ConditionGroup).children[0]).toMatchObject({ id: 'r2', value: 'web' });
        expect(setConditionOperator({ ...rule, value: 5 }, fields, 'gt').value).toBe(5);
        expect(setConditionOperator({ ...rule, value: 5 }, fields, 'between').value).toEqual([null, null]);
        expect(setConditionField({ ...rule, value: 5 }, fields, 'name')).toMatchObject({
            operator: 'contains',
            value: '',
        });
        tree = removeConditionNode(tree, 'r2');
        expect((tree.children[1] as ConditionGroup).children).toEqual([]);
    });

    it('fields from DataTable columns: types, options, accessors', () => {
        const columns = [
            { id: 'name', header: 'Name', filter: 'text' },
            {
                id: 'group',
                header: 'Group',
                columns: [
                    { id: 'load', header: 'Last', filter: 'number', accessor: (row: { load: number }) => row.load * 2 },
                ],
            },
            { id: 'location', header: 'City', filter: 'multiSelect' },
            { id: 'plain', header: 'No filter' },
        ];
        const result = conditionFieldsFromColumns(columns as never, rows);
        expect(result.map((field) => [field.id, field.type])).toEqual([
            ['name', 'text'],
            ['load', 'number'],
            ['location', 'select'],
        ]);
        expect(result[2]!.options).toEqual([
            { value: 'FRA', label: 'FRA' },
            { value: 'NUE', label: 'NUE' },
        ]);
        expect(result[1]!.accessor!(rows[0] as never)).toBe(84);
    });
});

describe('validators', () => {
    it('return the translated message or undefined; empty values pass except for isRequired', () => {
        expect(isRequired()('')).toBe('Required');
        expect(isRequired()(false)).toBe('Required');
        expect(isRequired()('x')).toBeUndefined();
        expect(isEmail()('')).toBeUndefined();
        expect(isEmail()('anna@')).toBe('Please enter a valid email address');
        expect(isEmail()('anna@example.de')).toBeUndefined();
        expect(isUrl()('ftp://example.de')).toBeDefined();
        expect(isUrl()('https://example.de/path')).toBeUndefined();
        expect(hasLength({ min: 3 })('ab')).toBe('At least 3 characters');
        expect(hasLength({ min: 2, max: 4 })('abcde')).toBe('2 to 4 characters');
        expect(isInRange({ min: 1, max: 1000 })(1500)).toBe('Between 1 and 1,000');
        expect(isInRange({ min: 1 })('abc')).toBe('Please enter a number');
        expect(isInteger()('1,5')).toBe('Please enter a whole number');
        expect(matchesPattern(/^[A-Z]{3}$/, { message: 'Three capital letters' })('ab')).toBe('Three capital letters');
        expect(matchesField(() => 'secret')('Secret')).toBe('The entries do not match');
        expect(isIban()('DE89 3704 0044 0532 0130 00')).toBeUndefined();
        expect(isIban()('DE89 3704 0044 0532 0130 01')).toBe('Please enter a valid IBAN');
        expect(isPhone()('+49 (0)30 1234-567')).toBeUndefined();
        expect(isPhone()('12')).toBe('Please enter a valid phone number');
        expect(combineValidators(isRequired(), isEmail())('')).toBe('Required');
    });

    it('are Standard Schemas and come in other languages', () => {
        const result = isEmail()['~standard'].validate('x');
        expect(result.issues?.[0]?.message).toBe('Please enter a valid email address');
        expect(isEmail()['~standard'].validate('a@b.de')).toEqual({ value: 'a@b.de' });
        const de = createValidators(german.validation, 'de-DE');
        expect(de.isRequired()('')).toBe('Pflichtfeld');
        expect(de.isInRange({ max: 1000 })(2000)).toBe('Höchstens 1.000');
    });
});

describe('behaviors', () => {
    it('debounce: last arguments win, cancel and flush; throttle: first at once, the last one at the end', () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 100);
        debounced(1);
        debounced(2);
        expect(debounced.pending()).toBe(true);
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledExactlyOnceWith(2);
        debounced(3);
        debounced.flush();
        expect(fn).toHaveBeenLastCalledWith(3);
        debounced(4);
        debounced.cancel();
        vi.advanceTimersByTime(200);
        expect(fn).toHaveBeenCalledTimes(2);

        const throttled = vi.fn();
        const call = throttle(throttled, 100);
        call('a');
        call('b');
        call('c');
        expect(throttled).toHaveBeenCalledExactlyOnceWith('a');
        vi.advanceTimersByTime(100);
        expect(throttled).toHaveBeenLastCalledWith('c');
        vi.useRealTimers();
    });

    it('history: push drops the redo steps, undo/redo move, limit keeps the newest', () => {
        let state = historyInit(1);
        state = historyPush(state, 2);
        state = historyPush(state, 3);
        state = historyUndo(state, 2);
        expect(state).toEqual({ past: [], present: 1, future: [2, 3] });
        state = historyRedo(state);
        expect(state.present).toBe(2);
        state = historyPush(state, 9);
        expect(state.future).toEqual([]);
        expect(historyPush(historyPush(historyInit(0), 1, 1), 2, 1).past).toEqual([1]);
    });

    it('selection toggles by key; overflow counts what fits; the active section', () => {
        const a = { id: 1 };
        expect(toggleSelection([a], { id: 1 }, { key: (item) => item.id })).toEqual([]);
        expect(toggleSelection([a], { id: 2 }, { multiple: false, key: (item) => item.id })).toEqual([{ id: 2 }]);
        const widths = [50, 50, 50, 50];
        expect(overflowVisibleCount({ widths, available: 212, moreWidth: 30, gap: 4 })).toBe(4);
        expect(overflowVisibleCount({ widths, available: 200, moreWidth: 30, gap: 4 })).toBe(3);
        expect(overflowVisibleCount({ widths, available: 160, moreWidth: 30, gap: 4 })).toBe(2);
        expect(
            overflowVisibleCount({ widths: [...widths, 50], available: 120, moreWidth: 30, gap: 4, maxRows: 2 })
        ).toBe(3);
        expect(overflowVisibleCount({ widths, available: 1000, moreWidth: 30, maxVisible: 2 })).toBe(2);
        expect(overflowVisibleCount({ widths, available: 0, moreWidth: 30 })).toBe(4);
        expect(
            activeSection(
                [
                    { id: 'a', top: -200 },
                    { id: 'b', top: 40 },
                    { id: 'c', top: 500 },
                ],
                64
            )
        ).toBe('b');
        expect(activeSection([{ id: 'a', top: 300 }])).toBe('a');
    });

    it('landmarks: the next one around the focus, wrapping; sizes for every recipe that has them', () => {
        document.body.innerHTML = '<header><button>a</button></header><main><p>x</p></main><footer></footer>';
        const landmarks = [...document.body.children] as HTMLElement[];
        expect(nextLandmark(landmarks, document.querySelector('button'))).toBe(landmarks[1]);
        expect(nextLandmark(landmarks, landmarks[2]!, 1)).toBe(landmarks[0]);
        expect(nextLandmark(landmarks, landmarks[0]!, -1)).toBe(landmarks[2]);
        document.body.innerHTML = '';
        const sized = sizeOverrides('sm');
        expect(sized.button).toEqual({ defaultVariants: { size: 'sm' } });
        expect(sized.input).toEqual({ defaultVariants: { size: 'sm' } });
        expect(sized.card).toBeUndefined();
        expect(sizeOverrides('2xl').avatar).toBeDefined();
        expect(sizeOverrides('2xl').button).toBeUndefined();
    });
});
