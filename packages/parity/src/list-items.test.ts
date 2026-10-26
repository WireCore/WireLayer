import {
    allListOptionsState,
    filterListOptions,
    groupListOptions,
    indexListOptions,
    listOptionsForValues,
    listValueKey,
    listValues,
    toggleAllListOptions,
    toListOptions,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Shared logic of the option lists (Select, MultiSelect, Combobox, Listbox, …)
describe('option lists', () => {
    const people = [
        { id: 1, name: 'Anna Berg', team: 'Sales' },
        { id: 2, name: 'Jonas Weber', team: 'Engineering' },
        { id: 3, name: 'Lea Schulz', team: 'Sales', inactive: true },
    ];

    it('keeps strings as keys and turns other values into stable keys', () => {
        expect(listValueKey('web')).toBe('web');
        expect(listValueKey(2)).toBe('2');
        expect(listValueKey(false)).toBe('false');
        // Objects: by content (key order does not matter) or by valueKey
        expect(listValueKey({ b: 1, a: [2] })).toBe(listValueKey({ a: [2], b: 1 }));
        expect(listValueKey({ id: 7, name: 'x' }, 'id')).toBe('7');
        expect(listValueKey({ id: 7 }, (value: { id: number }) => `p${value.id}`)).toBe('p7');
    });

    it('reads SelectItems, plain values and any objects with accessors', () => {
        const [item] = toListOptions([{ value: 'web', label: 'Web', group: 'Dev', description: 'More' }]);
        expect(item).toMatchObject({ key: 'web', value: 'web', label: 'Web', group: 'Dev', description: 'More' });
        expect(toListOptions(['Purchasing', 3]).map((option) => [option.value, option.label])).toEqual([
            ['Purchasing', 'Purchasing'],
            [3, '3'],
        ]);
        const options = toListOptions(people, {
            itemValue: 'id',
            itemLabel: (person) => person.name,
            itemDisabled: 'inactive',
            itemGroup: 'team',
        });
        expect(
            options.map((option) => [option.key, option.value, option.label, option.disabled, option.group])
        ).toEqual([
            ['1', 1, 'Anna Berg', false, 'Sales'],
            ['2', 2, 'Jonas Weber', false, 'Engineering'],
            ['3', 3, 'Lea Schulz', true, 'Sales'],
        ]);
        // Without itemValue an object without `value` is its own value
        expect(toListOptions(people, { itemLabel: 'name' })[0]!.value).toBe(people[0]);
    });

    it('groups in the order of first appearance and keeps ungrouped items in place', () => {
        const options = toListOptions(
            [
                { value: 'a' },
                { value: 'b', group: 'X' },
                { value: 'c', group: 'Y' },
                { value: 'd', group: 'X' },
                { value: 'e' },
            ],
            { itemLabel: 'value' }
        );
        expect(groupListOptions(options).map((group) => [group.label, group.options.map((o) => o.key)])).toEqual([
            [undefined, ['a']],
            ['X', ['b', 'd']],
            ['Y', ['c']],
            [undefined, ['e']],
        ]);
    });

    it('filters by label with the given matcher', () => {
        const options = toListOptions(people, { itemValue: 'id', itemLabel: 'name' });
        const contains = (text: string, query: string) => text.toLowerCase().includes(query.toLowerCase());
        expect(filterListOptions(options, ' web ', contains).map((option) => option.key)).toEqual(['2']);
        expect(filterListOptions(options, '', contains)).toHaveLength(3);
    });

    it("also finds by keywords: an accessor (one text or a list) or the items' own keywords", () => {
        const contains = (text: string, query: string) => text.toLowerCase().includes(query.toLowerCase());
        const options = toListOptions(people, { itemValue: 'id', itemLabel: 'name', itemKeywords: 'team' });
        expect(options[0]!.keywords).toEqual(['Sales']);
        expect(filterListOptions(options, 'engineer', contains).map((option) => option.key)).toEqual(['2']);
        const listed = toListOptions(people, {
            itemValue: 'id',
            itemLabel: 'name',
            itemKeywords: (person) => [person.team, `#${person.id}`],
        });
        expect(filterListOptions(listed, '#3', contains).map((option) => option.key)).toEqual(['3']);
        const own = toListOptions([{ value: 'de', label: 'Germany', keywords: ['Deutschland', 'DE'] }]);
        expect(filterListOptions(own, 'deutsch', contains)).toHaveLength(1);
        expect(toListOptions([{ value: 'x', label: 'X' }])[0]!.keywords).toBeUndefined();
    });

    it('null chooses an item with the value null ("All") – otherwise it means nothing chosen', () => {
        const withAll = toListOptions([
            { value: null, label: 'All' },
            { value: true, label: 'Yes' },
        ]);
        expect(listValues(null, withAll)).toEqual([null]);
        expect(listValues(null, toListOptions([{ value: true, label: 'Yes' }]))).toEqual([]);
        expect(listValues(undefined, withAll)).toEqual([]);
        expect(listValues(true, withAll)).toEqual([true]);
        expect(listOptionsForValues(listValues(null, withAll), indexListOptions(withAll))[0]!.label).toBe('All');
    });

    it('finds the options of values – also values that are not among the items', () => {
        const options = toListOptions(people, { itemValue: 'id', itemLabel: 'name' });
        const index = indexListOptions(options);
        expect(listOptionsForValues([2, 9], index).map((option) => option.label)).toEqual(['Jonas Weber', '9']);
        // An object value outside the items is read as an item
        const objects = listOptionsForValues([{ id: 5, name: 'Max' }], new Map(), {
            itemLabel: 'name',
            valueKey: 'id',
        });
        expect(objects[0]).toMatchObject({ key: '5', label: 'Max' });
    });

    it('"select all" takes the enabled options in view, up to max, and clears them again', () => {
        const options = toListOptions(people, { itemValue: 'id', itemLabel: 'name', itemDisabled: 'inactive' });
        const all = toggleAllListOptions([], options);
        expect(all.map((option) => option.value)).toEqual([1, 2]);
        expect(allListOptionsState(all, options)).toBe(true);
        expect(toggleAllListOptions(all, options)).toEqual([]);
        const limited = toggleAllListOptions([], options, 1);
        expect(limited.map((option) => option.value)).toEqual([1]);
        expect(allListOptionsState(limited, options)).toBe('mixed');
        // At the maximum the next click clears instead of doing nothing
        expect(toggleAllListOptions(limited, options, 1)).toEqual([]);
    });
});
