// Shared logic of the option lists (Select, MultiSelect, Combobox, Autocomplete, Listbox, TagsInput, VirtualSelect):
// items of any shape, values of any type, stable string keys for Ark, groups and filtering.

/** Reads a field of an item: the name of a property or a function */
export type ItemAccessor<T, R> = string | ((item: T) => R);

/** Value type of an item: its `value` property, otherwise the item itself */
export type ItemValueOf<T> = T extends { value: infer V } ? V : T;

/** How to read value, label, disabled state and group of an item, and how to identify object values */
export interface ListItemAccessors<T = unknown> {
    itemValue?: ItemAccessor<T, unknown>;
    itemLabel?: ItemAccessor<T, string>;
    itemDisabled?: ItemAccessor<T, boolean>;
    itemGroup?: ItemAccessor<T, string | null | undefined>;
    // The value type is unknown here – any accessor of the component's value type fits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valueKey?: ItemAccessor<any, string | number>;
}

/** One item, normalised: `key` is the string Ark works with, `value` the original value */
export interface ListOption<T = unknown> {
    key: string;
    value: unknown;
    label: string;
    disabled: boolean;
    group?: string;
    description?: string;
    icon?: unknown;
    /** The original item (for slots and render functions) */
    item: T;
}

/** Options under one heading; `label` is undefined for items without a group */
export interface ListGroup<T = unknown> {
    label: string | undefined;
    options: ListOption<T>[];
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

function read<T>(item: T, accessor: ItemAccessor<T, unknown> | undefined, fallback: string): unknown {
    if (typeof accessor === 'function') return accessor(item);
    return isObject(item) ? item[accessor ?? fallback] : undefined;
}

/** JSON with sorted object keys: equal objects get the same text */
function stableStringify(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (isObject(value) && !(value instanceof Date)) {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
            .join(',')}}`;
    }
    return JSON.stringify(value) ?? String(value);
}

/**
 * The string key of a value. Strings stay as they are (form submission and DOM keep the old values), numbers and
 * booleans become their text, objects are compared by `valueKey` or – without it – by their content.
 */
export function listValueKey(value: unknown, valueKey?: ListItemAccessors['valueKey']): string {
    if (typeof value === 'string') return value;
    if (isObject(value)) return valueKey ? String(read(value, valueKey, '')) : stableStringify(value);
    return String(value);
}

/** Normalises one item: `value`/`label`/`disabled`/`group` (or the accessors); a primitive item is its own value */
export function toListOption<T>(item: T, accessors: ListItemAccessors<T> = {}): ListOption<T> {
    const value =
        accessors.itemValue !== undefined
            ? read(item, accessors.itemValue, 'value')
            : isObject(item) && 'value' in item
              ? item.value
              : item;
    const label =
        accessors.itemLabel !== undefined ? read(item, accessors.itemLabel, 'label') : read(item, 'label', '');
    const group = read(item, accessors.itemGroup, 'group');
    const description = read(item, undefined, 'description');
    return {
        key: listValueKey(value, accessors.valueKey),
        value,
        label: String(label ?? (isObject(value) ? '' : (value ?? ''))),
        disabled: !!read(item, accessors.itemDisabled, 'disabled'),
        group: group === null || group === undefined || group === '' ? undefined : String(group),
        description: typeof description === 'string' ? description : undefined,
        icon: read(item, undefined, 'icon'),
        item,
    };
}

export function toListOptions<T>(items: readonly T[], accessors: ListItemAccessors<T> = {}): ListOption<T>[] {
    return items.map((item) => toListOption(item, accessors));
}

/**
 * Groups options under their group heading, in the order of the first appearance of each group. Options without a
 * group stay where they are. Ark's collection must follow this order (keyboard navigation follows the DOM).
 */
export function groupListOptions<T>(options: readonly ListOption<T>[]): ListGroup<T>[] {
    const groups: ListGroup<T>[] = [];
    const named = new Map<string, ListGroup<T>>();
    for (const option of options) {
        if (option.group === undefined) {
            const last = groups.at(-1);
            if (last && last.label === undefined) last.options.push(option);
            else groups.push({ label: undefined, options: [option] });
            continue;
        }
        let group = named.get(option.group);
        if (!group) {
            group = { label: option.group, options: [] };
            named.set(option.group, group);
            groups.push(group);
        }
        group.options.push(option);
    }
    return groups;
}

/** Options whose label contains the query; `contains` decides about case and accents (Ark's useFilter) */
export function filterListOptions<T>(
    options: readonly ListOption<T>[],
    query: string,
    contains: (text: string, query: string) => boolean
): ListOption<T>[] {
    const text = query.trim();
    return text ? options.filter((option) => contains(option.label, text)) : [...options];
}

/** Looks options up by key; earlier lists win (e.g. the current items before remembered ones) */
export function indexListOptions<T>(...lists: readonly (readonly ListOption<T>[])[]): Map<string, ListOption<T>> {
    const index = new Map<string, ListOption<T>>();
    for (const list of lists) for (const option of list) if (!index.has(option.key)) index.set(option.key, option);
    return index;
}

/**
 * The options of the given values. A value that is not among the items (not loaded yet, typed freely) still gets
 * an option: an object value is read as an item (the item is the value), anything else is shown as text.
 */
export function listOptionsForValues<T>(
    values: readonly unknown[],
    index: Map<string, ListOption<T>>,
    accessors: ListItemAccessors<T> = {}
): ListOption<T>[] {
    return values.map((value) => {
        const known = index.get(listValueKey(value, accessors.valueKey));
        if (known) return known;
        if (isObject(value) && accessors.itemValue === undefined && !('value' in value)) {
            return toListOption(value as T, accessors);
        }
        return {
            key: listValueKey(value, accessors.valueKey),
            value,
            label: String(value),
            disabled: false,
            item: value as T,
        };
    });
}

/** The value of a single choice as a list: null/undefined → [] */
export const listValues = (value: unknown): unknown[] => (value === null || value === undefined ? [] : [value]);

/**
 * "Select all": the selectable options in view (filtered, enabled) are added – or removed when all of them are
 * selected already. `max` limits the selection.
 */
export function toggleAllListOptions<T>(
    selected: readonly ListOption<T>[],
    visible: readonly ListOption<T>[],
    max?: number
): ListOption<T>[] {
    const keys = new Set(selected.map((option) => option.key));
    const selectable = visible.filter((option) => !option.disabled);
    const added = selectable.filter((option) => !keys.has(option.key));
    const room = max === undefined ? added.length : Math.max(0, max - selected.length);
    // Everything selected – or nothing more allowed (max): the second click clears the options in view
    if (!added.length || !room) {
        const remove = new Set(selectable.map((option) => option.key));
        return selected.filter((option) => !remove.has(option.key));
    }
    return [...selected, ...added.slice(0, room)];
}

/** State of the "select all" checkbox: all, some or none of the selectable options in view are selected */
export function allListOptionsState<T>(
    selected: readonly ListOption<T>[],
    visible: readonly ListOption<T>[]
): boolean | 'mixed' {
    const keys = new Set(selected.map((option) => option.key));
    const selectable = visible.filter((option) => !option.disabled);
    const count = selectable.filter((option) => keys.has(option.key)).length;
    return count > 0 && count === selectable.length ? true : count > 0 ? 'mixed' : false;
}
