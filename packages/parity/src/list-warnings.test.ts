import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { el, frameworks, render } from './harness.js';

// A value that is not among the items of a list control shows as raw text ("DE" for a list of country names) – in
// development the component warns, once its items are there. Nothing changes at runtime.

const countries = [
    { value: 'Germany', label: 'Germany' },
    { value: 'Austria', label: 'Austria' },
];

describe.each(frameworks)('%s values outside the items', (framework) => {
    let warn: MockInstance;
    beforeEach(() => {
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());
    // One value per framework and case – a warning is logged once per message
    const code = (name: string) => `${framework}-${name}`;
    const warned = (value: string) =>
        warn.mock.calls.some(([message]) => String(message).includes(`the value "${value}" is not among its items`));

    it.each(['Select', 'MultiSelect', 'Combobox', 'Listbox'])(
        '%s warns about a value outside its items',
        async (name) => {
            const value = code(name);
            const multiple = name === 'MultiSelect' || name === 'Listbox';
            await render(
                framework,
                el(name as 'Select', {
                    items: countries,
                    'aria-label': 'Country',
                    defaultValue: multiple ? [value] : value,
                })
            );
            expect(warned(value)).toBe(true);
            expect(String(warn.mock.calls[0]![0])).toContain(`${name}: the value`);
        }
    );

    it('does not warn for known values, while loading, without items, with a data source or free text', async () => {
        const values = ['loading', 'empty', 'source', 'custom'].map(code);
        await render(
            framework,
            el(
                'div',
                {},
                el('Select', { items: countries, 'aria-label': 'Known', defaultValue: 'Austria' }),
                el('Select', { items: countries, 'aria-label': 'Loading', defaultValue: values[0], loading: true }),
                el('Select', { items: [], 'aria-label': 'Empty', defaultValue: values[1] }),
                el('Select', {
                    items: [],
                    'aria-label': 'Source',
                    defaultValue: values[2],
                    dataSource: {
                        getItems: () => new Promise(() => {}),
                        getItemsByKeys: () => new Promise(() => {}),
                    },
                }),
                el('Combobox', {
                    items: countries,
                    'aria-label': 'Custom',
                    defaultValue: values[3],
                    allowCustomValue: true,
                })
            )
        );
        expect(warn).not.toHaveBeenCalled();
    });
});
