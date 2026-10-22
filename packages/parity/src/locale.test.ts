import { screen } from '@testing-library/dom';
import { act, render as renderReact } from '@testing-library/react';
import { render as renderVue } from '@testing-library/vue';
import * as react from '@wirecore/wirelayer-react';
import {
    localeDirection,
    localizeDigits,
    localizeTexts,
    messages,
    parseQuarter,
    pluralText,
    registerLocale,
    resolveLocale,
    type PluralForms,
    type Translations,
} from '@wirecore/wirelayer-recipes';
import { ar } from '@wirecore/wirelayer-recipes/locales/ar';
import { cs } from '@wirecore/wirelayer-recipes/locales/cs';
import { es } from '@wirecore/wirelayer-recipes/locales/es';
import { fr } from '@wirecore/wirelayer-recipes/locales/fr';
import { hu } from '@wirecore/wirelayer-recipes/locales/hu';
import { it as italian } from '@wirecore/wirelayer-recipes/locales/it';
import { lv } from '@wirecore/wirelayer-recipes/locales/lv';
import { nl } from '@wirecore/wirelayer-recipes/locales/nl';
import { pl } from '@wirecore/wirelayer-recipes/locales/pl';
import { pt } from '@wirecore/wirelayer-recipes/locales/pt';
import { ptBR } from '@wirecore/wirelayer-recipes/locales/pt-BR';
import { tr } from '@wirecore/wirelayer-recipes/locales/tr';
import * as vue from '@wirecore/wirelayer-vue';
import { createElement } from 'react';
import { beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { h, nextTick, ref, type Component } from 'vue';
import { el, frameworks, normalize, render } from './harness.js';

const items = [
    { value: 'web', label: 'Software & Web' },
    { value: 'hosting', label: 'Hosting' },
];

describe.each(frameworks)('%s LocaleProvider', (framework) => {
    it('uses English without a provider', async () => {
        await render(framework, el('Select', { items, 'aria-label': 'Service' }));
        expect(screen.getByRole('combobox', { name: 'Service' })).toHaveTextContent('Select');
    });

    it('switches texts and number/date formats to English', async () => {
        await render(
            framework,
            el(
                'LocaleProvider',
                { locale: 'en-US' },
                el(
                    'div',
                    {},
                    el('Select', { items, 'aria-label': 'Service' }),
                    el('Pagination', { count: 30, pageSize: 10 }),
                    el('NumberInput', { defaultValue: 1234.5, 'aria-label': 'Budget' }),
                    el('Field', { label: 'Date' }, el('DatePicker', { defaultValue: '2026-10-20' }))
                )
            )
        );
        expect(screen.getByRole('combobox', { name: 'Service' })).toHaveTextContent('Select');
        expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
        expect(screen.getByText('1–10 of 30')).toBeInTheDocument();
        expect(screen.getByRole('spinbutton', { name: 'Budget' })).toHaveValue('1,234.5');
        expect(screen.getByRole('button', { name: 'Open calendar' })).toBeInTheDocument();
        // en-US orders the parts month/day/year
        const segments = screen
            .getAllByRole('spinbutton')
            .filter((segment) => segment.closest('[data-scope="date-picker"]'));
        expect(segments.map((segment) => segment.textContent)).toEqual(['10', '20', '2026']);
    });

    it('passes a right-to-left locale on to Ark', async () => {
        const container = await render(
            framework,
            el('LocaleProvider', { locale: 'he-IL' }, el('Slider', { label: 'Price', defaultValue: [20, 80] }))
        );
        expect(container.querySelector('[data-part="root"]')).toHaveAttribute('dir', 'rtl');
        // No built-in Hebrew texts – English instead
        expect(screen.getAllByText('Minimum')).not.toHaveLength(0);
    });

    it('takes the texts of another language', async () => {
        const french = { ...messages.en, common: { ...messages.en.common, close: 'Fermer' } };
        await render(
            framework,
            el(
                'LocaleProvider',
                { locale: 'fr-FR', translations: french },
                el('Alert', { title: 'Note', dismissible: true })
            )
        );
        expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    });
});

describe('switching the language at runtime', () => {
    // DataView reads its texts through `const t = translations.dataView` – it has to follow, too
    const view = { items: [], label: 'Server', children: () => null };

    it('vue', async () => {
        const locale = ref('de-DE');
        renderVue({
            render: () =>
                h(vue.LocaleProvider, { locale: locale.value }, () => [
                    h(vue.Spinner),
                    h(vue.DataView as Component, { items: view.items, label: view.label }),
                ]),
        });
        await nextTick();
        expect(screen.getByText('Wird geladen')).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'Ansicht' })).toBeInTheDocument();
        locale.value = 'en-US';
        await nextTick();
        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();
        expect(screen.getByText('No entries')).toBeInTheDocument();
    });

    it('react', async () => {
        const tree = (locale: string) =>
            createElement(
                react.LocaleProvider,
                { locale },
                createElement(react.Spinner),
                createElement(react.DataView, view)
            );
        const { rerender } = renderReact(tree('de-DE'));
        expect(screen.getByText('Wird geladen')).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'Ansicht' })).toBeInTheDocument();
        await act(async () => rerender(tree('en-US')));
        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();
        expect(screen.getByText('No entries')).toBeInTheDocument();
    });
});

// The languages that are not built in, by the locale tag whose plural rules they follow
const locales: Record<string, [code: string, texts: Translations]> = {
    'fr-FR': ['fr', fr],
    'es-ES': ['es', es],
    'it-IT': ['it', italian],
    'pt-PT': ['pt', pt],
    'pt-BR': ['pt-BR', ptBR],
    'nl-NL': ['nl', nl],
    'pl-PL': ['pl', pl],
    'cs-CZ': ['cs', cs],
    'hu-HU': ['hu', hu],
    'lv-LV': ['lv', lv],
    'ar-EG': ['ar', ar],
    'tr-TR': ['tr', tr],
};
const languages = Object.entries(locales).map(([tag, [code, texts]]) => [tag, code, texts] as const);

describe('language modules', () => {
    it('are not built in: unregistered languages fall back to English', () => {
        expect(Object.keys(messages)).toEqual(['de', 'en']);
        expect(resolveLocale('fr-CA').translations).toBe(messages.en);
        expect(resolveLocale('ar-EG').translations).toBe(messages.en);
    });

    it('type: every language is a complete Translations object', () => {
        expectTypeOf(fr).toEqualTypeOf<Translations>();
        expectTypeOf(ptBR).toEqualTypeOf<Translations>();
        // @ts-expect-error – a language with missing sections is rejected
        const incomplete: Translations = { common: fr.common };
        expect(incomplete).toBeDefined();
    });

    // Sections, keys, functions and array lengths as in German; plural forms only need to be plural forms
    const isPlural = (value: object) =>
        'other' in value && Object.values(value).every((form) => typeof form === 'string');
    const shape = (value: unknown): unknown => {
        if (typeof value === 'function') return 'function';
        if (Array.isArray(value)) return value.map(shape);
        if (value && typeof value === 'object') {
            if (isPlural(value)) return 'plural';
            return Object.fromEntries(
                Object.keys(value)
                    .sort()
                    .map((key) => [key, shape((value as Record<string, unknown>)[key])])
            );
        }
        return typeof value;
    };
    const pluralForms = (value: unknown, path = ''): [string, PluralForms][] =>
        value && typeof value === 'object' && !Array.isArray(value)
            ? isPlural(value)
                ? [[path, value as PluralForms]]
                : Object.entries(value).flatMap(([key, child]) => pluralForms(child, path ? `${path}.${key}` : key))
            : [];

    it.each(languages)('%s has exactly the keys of German', (_tag, _code, texts) => {
        expect(shape(texts)).toEqual(shape(messages.de));
    });

    it.each(languages)('%s has a plural form for every category of whole numbers', (tag, _code, texts) => {
        const rules = new Intl.PluralRules(tag);
        const categories = new Set(Array.from({ length: 1001 }, (_, count) => rules.select(count)));
        const missing = pluralForms(texts).flatMap(([path, forms]) =>
            [...categories].filter((category) => forms[category] === undefined).map((category) => `${path}.${category}`)
        );
        expect(missing).toEqual([]);
    });

    // Texts with a counted noun – called for typical numbers
    const counted: [string, (t: Translations, count: number, tag: string) => string][] = [
        ['common.selectedCount', (t, n) => t.common.selectedCount(n)],
        ['formErrorSummary.title', (t, n) => t.formErrorSummary.title(n)],
        ['pickList.moved', (t, n) => t.pickList.moved(n, 'Target')],
        ['notificationCenter.unreadCount', (t, n) => t.notificationCenter.unreadCount(n)],
        ['tagsInput.tagsPasted', (t, n) => t.tagsInput.tagsPasted(Array.from({ length: n }, String))],
        ['textarea.remaining', (t, n) => t.textarea.remaining(n, 200)],
        ['dataTable.results', (t, n) => t.dataTable.results(n)],
        ['dataTable.rowCount', (t, n) => t.dataTable.rowCount(n)],
        ['dataTable.cellsCopied', (t, n) => t.dataTable.cellsCopied(n)],
        ['dataTable.cellsPasted', (t, n) => t.dataTable.cellsPasted(n, 0)],
        ['dataTable.changesSaved', (t, n) => t.dataTable.changesSaved(n)],
        ['dataSource.minSearch', (t, n) => t.dataSource.minSearch(n)],
        ['rating.ratingValueText', (t, n) => t.rating.ratingValueText(n)],
        ['editor.characters', (t, n) => t.editor.characters(n, undefined)],
        ['editor.words', (t, n) => t.editor.words(n)],
        ['fileUpload.pasted', (t, n) => t.fileUpload.pasted(n)],
        ['filterPanel.status', (t, n) => t.filterPanel.status(n)],
        ['jsonViewer.items', (t, n) => t.jsonViewer.items(n)],
        ['kanban.cards', (t, n) => t.kanban.cards(n, undefined)],
        ['chatMessages.newCount', (t, n) => t.chatMessages.newCount(n)],
        ['chatSources.title', (t, n) => t.chatSources.title(n)],
        ['validation.minLength', (t, n) => t.validation.minLength(n)],
        ['calendar.datesSelected', (t, n, tag) => pluralText(t.calendar.datesSelected, n, tag)],
        ['scheduler.eventCount', (t, n, tag) => pluralText(t.scheduler.eventCount, n, tag)],
        ['gantt.days', (t, n, tag) => pluralText(t.gantt.days, n, tag)],
        ['dataSource.loaded', (t, n, tag) => pluralText(t.dataSource.loaded, n, tag)],
        ['tree.matches', (t, n, tag) => pluralText(t.tree.matches, n, tag)],
        ['recurrence.WEEKLY', (t, n, tag) => pluralText(t.recurrence.WEEKLY, n, tag)],
    ];
    const counts = [0, 1, 2, 5, 11, 21, 101];
    // Arabic-Indic digits read as Latin ones; the number may be formatted (grouping)
    const digits = (text: string) =>
        text
            .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
            .replace(/(\d)[\s.,\u00a0\u202f\u066c](?=\d)/g, '$1');

    it.each(languages)('%s: counted texts for 0, 1, 2, 5, 11, 21 and 101', (tag, _code, texts) => {
        for (const [name, text] of counted)
            for (const count of counts) {
                const result = text(texts, count, tag);
                expect(result, `${name}(${count})`).toMatch(/\S/);
                expect(result, `${name}(${count})`).not.toMatch(/undefined|NaN|\{count\}|\[object/);
                // 0, 1 and 2 may be words ("aucun", "once", "عنصران"); larger numbers are always shown
                if (count > 2) expect(digits(result), `${name}(${count})`).toContain(String(count));
            }
    });

    // Languages with more than two forms: [counts that read alike], … – each group reads differently from the others
    // (only where the noun really changes – Polish "2 dni"/"5 dni", Latvian zero/other and Arabic many/other without
    // tanween look alike)
    const inflected: [string, number[][]][] = [
        ['pl-PL', [[1], [2, 22, 104], [5, 12, 25]]],
        ['cs-CZ', [[1], [2, 3, 4], [5, 11, 22]]],
        [
            'lv-LV',
            [
                [1, 21, 101],
                [2, 5, 25],
            ],
        ],
        [
            'ar-EG',
            [
                [3, 10, 103],
                [11, 25, 99],
            ],
        ],
    ];
    it.each(inflected)('%s inflects the counted noun by plural category', (tag, groups) => {
        const texts = locales[tag]![1];
        const shape = (count: number) => digits(texts.dataTable.rowCount(count)).replace(/\d+/g, '#');
        const byGroup = groups.map((group) => new Set(group.map(shape)));
        for (const forms of byGroup) expect([...forms], tag).toHaveLength(1);
        expect(new Set(byGroup.map((forms) => [...forms][0])).size, tag).toBe(groups.length);
    });
});

describe('registered languages', () => {
    beforeAll(() => {
        for (const [code, texts] of Object.values(locales)) registerLocale(code, texts);
    });

    it('resolve by language, region first', () => {
        expect(resolveLocale('fr-CA').translations).toBe(fr);
        expect(resolveLocale('FR').translations).toBe(fr);
        expect(resolveLocale('pt-BR').translations).toBe(ptBR);
        expect(resolveLocale('pt-PT').translations).toBe(pt);
        expect(resolveLocale('pt-AO').translations).toBe(pt);
        expect(resolveLocale('de-AT').translations).toBe(messages.de);
        expect(resolveLocale('sv-SE').translations).toBe(messages.en);
        // Texts passed to LocaleProvider win
        expect(resolveLocale('fr-FR', messages.en).translations).toBe(messages.en);
    });

    it('right to left for Arabic, Hebrew, Persian and Urdu', () => {
        expect(resolveLocale('ar-EG').dir).toBe('rtl');
        for (const tag of ['ar', 'ar-MA', 'he-IL', 'fa-IR', 'ur-PK']) expect(localeDirection(tag), tag).toBe('rtl');
        for (const tag of ['fr-FR', 'tr-TR', 'lv-LV', 'pl-PL']) expect(localeDirection(tag), tag).toBe('ltr');
    });

    const tree = (locale: string) =>
        el(
            'LocaleProvider',
            { locale },
            el(
                'div',
                {},
                el('Select', { items, 'aria-label': 'Service' }),
                el('Pagination', { count: 30, pageSize: 10 }),
                el('Alert', { title: 'Note', dismissible: true }),
                el('Slider', { label: 'Price', defaultValue: [20, 80] }),
                el('Field', { label: 'Date' }, el('DatePicker', { defaultValue: '2026-10-20' }))
            )
        );

    describe.each(['fr-FR', 'ar-EG', 'pl-PL'])('%s', (tag) => {
        const texts = locales[tag]![1];

        it('Vue and React render the same DOM', async () => {
            expect(normalize(await render('vue', tree(tag)))).toBe(normalize(await render('react', tree(tag))));
        });

        it.each(frameworks)('%s shows the registered texts', async (framework) => {
            const container = await render(framework, tree(tag));
            expect(screen.getByRole('combobox', { name: 'Service' })).toHaveTextContent(texts.common.placeholder);
            expect(screen.getByRole('navigation', { name: texts.pagination.rootLabel })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: texts.pagination.nextTriggerLabel })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: texts.common.close })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: texts.datePicker.trigger(false) })).toBeInTheDocument();
            expect(screen.getAllByText(texts.slider.thumbs[0]!)).not.toHaveLength(0);
            expect(container.querySelector('[data-scope="slider"][data-part="root"]')).toHaveAttribute(
                'dir',
                tag === 'ar-EG' ? 'rtl' : 'ltr'
            );
        });
    });
});

describe('numbers in texts', () => {
    it('localizeDigits writes the digits and grouping of the locale', () => {
        expect(localizeDigits('Page 3 of 10', 'ar-EG')).toBe('Page ٣ of ١٠');
        expect(localizeDigits('12345 Zeilen, Q1 2026', 'de-DE')).toBe('12.345 Zeilen, Q1 2026');
        expect(localizeDigits('12345 rows', 'en-US')).toBe('12,345 rows');
        // Parts of dates, times and grouped numbers, Latin tokens and passed-in strings keep their form
        expect(localizeDigits('21.10.2026, 10:30', 'ar-EG')).toBe('٢١.١٠.٢٠٢٦, ١٠:٣٠');
        expect(localizeDigits('F6 und web-01: 12345', 'de-DE', ['web-01'])).toBe('F6 und web-01: 12.345');
        // Digits of another script are read back
        expect(localizeDigits('١٢٣٤٥', 'de-DE')).toBe('12.345');
    });

    it('localizeTexts formats every number of a language module', () => {
        const texts = localizeTexts(ar, 'ar-EG');
        expect(localizeTexts(ar, 'ar-EG')).toBe(texts);
        for (const text of [
            texts.dataTable.rowCount(25),
            texts.pagination.summary({ start: 1, end: 10, count: 30 }),
            texts.common.selectedCount(3),
            texts.dataTable.findMatches(2, 14),
        ])
            expect(text, text).not.toMatch(/[0-9]/);
        expect(texts.dataTable.rowCount(25)).toContain('٢٥');
        // ar-MA writes Latin digits – the Arabic plural texts follow
        expect(localizeTexts(ar, 'ar-MA').dataTable.rowCount(25)).toMatch(/25/);
        // Names stay as they are
        expect(texts.chip.remove('web-01')).toContain('web-01');
        expect(localizeTexts(messages.de, 'de-DE').dataTable.rowCount(12345)).toBe('12.345 Zeilen');
    });

    it.each(frameworks)('%s LocaleProvider passes the localized texts on', async (framework) => {
        registerLocale('ar', ar);
        await render(
            framework,
            el('LocaleProvider', { locale: 'ar-EG' }, el('Pagination', { count: 30, pageSize: 10 }))
        );
        expect(
            screen.getByText(localizeDigits(ar.pagination.summary({ start: 1, end: 10, count: 30 }), 'ar-EG'))
        ).toBeInTheDocument();
    });

    it('pluralText takes exact forms first ("=1")', () => {
        expect(pluralText({ '=0': 'Keine', one: '{count} Zeile', other: '{count} Zeilen' }, 0, 'de-DE')).toBe('Keine');
        expect(pluralText(lv.recurrence.DAILY, 1, 'lv-LV')).toBe('Katru dienu');
        expect(pluralText(lv.recurrence.DAILY, 21, 'lv-LV')).toBe('Ik pēc 21 dienas');
        expect(pluralText(lv.recurrence.WEEKLY, 2, 'lv-LV')).toBe('Ik pēc 2 nedēļām');
    });

    it.each(languages)('%s: parseQuarter reads the quarter texts back', (tag, _code, texts) => {
        for (const quarter of [1, 2, 3, 4]) {
            const text = texts.quarterPicker.quarter(quarter, 2026);
            expect(parseQuarter(text), text).toEqual({ year: 2026, quarter });
            const localized = localizeTexts(texts, tag).quarterPicker.quarter(quarter, 2026);
            expect(parseQuarter(localized), localized).toEqual({ year: 2026, quarter });
        }
        expect(parseQuarter('T1 2026')).toEqual({ year: 2026, quarter: 1 });
        expect(parseQuarter('III kw. 2026')).toEqual({ year: 2026, quarter: 3 });
        expect(parseQuarter('2026 Q1')).toEqual({ year: 2026, quarter: 1 });
    });
});
