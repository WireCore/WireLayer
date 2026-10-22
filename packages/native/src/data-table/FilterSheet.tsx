import {
    cellText,
    dataTable,
    dataTableMatchModes,
    isActiveFilter,
    listValueKey,
    parseLocaleNumber,
    type DataTableFilterValue,
    type DataTableMatchMode,
} from '@wirecore/wirelayer-recipes/native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '../components/Button/Button.js';
import { DatePicker } from '../components/DatePicker/DatePicker.js';
import { Field } from '../components/Field/Field.js';
import { Input } from '../components/Input/Input.js';
import { MultiSelect } from '../components/MultiSelect/MultiSelect.js';
import { SegmentedControl } from '../components/SegmentedControl/SegmentedControl.js';
import { Select } from '../components/Select/Select.js';
import { useLocale } from '../locale.js';
import { Sheet } from '../utils/Sheet.js';
import type { DataTableColumn, DataTableOption } from './types.js';

/** A choice of a select filter: key for the picker, label, value compared with the cell */
interface FilterChoice {
    key: string;
    label: string;
    value: unknown;
}

/** Choices with values of their own (numbers, objects): the filter compares the value, not the shown text */
export const byValue = (column: { filterOptions?: readonly DataTableOption[] }) =>
    (column.filterOptions ?? []).some((option) => typeof option !== 'string');

/** Match mode of a column filter (as in the filter row of the web DataTable) */
export const filterMode = <TData,>(column: DataTableColumn<TData>): DataTableMatchMode =>
    column.filterMatchMode ??
    (byValue(column) && column.filter === 'multiSelect' ? 'in' : dataTableMatchModes[column.filter ?? 'text'][0]!);

const isRange = <TData,>(column: DataTableColumn<TData>) =>
    filterMode(column) === 'between' && (column.filter === 'number' || column.filter === 'date');

/** What the input of a filter holds: the text, the key(s) of the choices, an ISO date, [from, to] */
type Draft = Record<string, unknown>;

/** The value of the filter's first condition */
const filterInput = (filter: DataTableFilterValue | undefined) =>
    filter === undefined ? undefined : typeof filter === 'string' ? filter : filter.constraints[0]?.value;

/** The filter of a column from its input value – undefined when it filters nothing */
export function toColumnFilter<TData>(
    column: DataTableColumn<TData>,
    value: unknown,
    choices: FilterChoice[],
    locale: string
): DataTableFilterValue | undefined {
    const type = column.filter ?? 'text';
    let input: unknown = value;
    if (type === 'number') {
        const parse = (text: unknown) =>
            typeof text === 'string' && text.trim() ? parseLocaleNumber(text, locale) : null;
        input = Array.isArray(value) ? value.map(parse) : parse(value);
    } else if (type === 'select' || type === 'multiSelect') {
        const pick = (key: unknown) => choices.find((choice) => choice.key === key);
        const valueOf = (key: unknown) => (byValue(column) ? pick(key)?.value : pick(key)?.label);
        input = Array.isArray(value) ? value.map(valueOf).filter((entry) => entry !== undefined) : valueOf(value);
    }
    // Text, select and yes/no keep the plain text (like the filter row of the web); the others a rule
    const plain =
        (type === 'text' || type === 'select' || type === 'boolean') && !column.filterMatchMode && !byValue(column);
    const filter: DataTableFilterValue =
        plain && typeof input === 'string'
            ? input
            : { operator: 'and', constraints: [{ matchMode: filterMode(column), value: input ?? null }] };
    return isActiveFilter(filter) ? filter : undefined;
}

/** The input value of a column filter (inverse of toColumnFilter) */
function fromColumnFilter<TData>(
    column: DataTableColumn<TData>,
    filter: DataTableFilterValue | undefined,
    choices: FilterChoice[]
): unknown {
    const value = filterInput(filter);
    const type = column.filter ?? 'text';
    if (value === undefined || value === null) return undefined;
    if (type === 'number') return Array.isArray(value) ? value.map((part) => String(part ?? '')) : String(value);
    if (type === 'select' || type === 'multiSelect') {
        const keyOf = (entry: unknown) =>
            choices.find((choice) =>
                byValue(column) ? listValueKey(choice.value) === listValueKey(entry) : choice.label === entry
            )?.key;
        return Array.isArray(value) ? value.map(keyOf).filter(Boolean) : keyOf(value);
    }
    return value;
}

export interface FilterSheetProps<TData> {
    open: boolean;
    onClose: () => void;
    /** The columns with a filter */
    columns: DataTableColumn<TData>[];
    /** The rows – choices of select filters without `filterOptions` */
    rows: readonly TData[];
    filters: Record<string, DataTableFilterValue>;
    onApply: (filters: Record<string, DataTableFilterValue>) => void;
}

/**
 * The column filters in a sheet: one input per filterable column (text, number, date – from and to with
 * `between` –, a choice, several choices, yes/no), "Apply" and "Clear". Every opening starts with the
 * applied filters.
 */
export function FilterSheet<TData>({ open, onClose, columns, rows, filters, onApply }: FilterSheetProps<TData>) {
    const { translations, locale } = useLocale();
    const t = translations.dataTable;
    const styles = dataTable();
    const choicesById = useMemo(() => {
        const collator = new Intl.Collator(locale, { numeric: true });
        return new Map(
            columns.map((column) => {
                let choices: FilterChoice[];
                if (column.filterOptions)
                    choices = column.filterOptions.map((option, index) =>
                        typeof option === 'object'
                            ? { key: String(index), label: option.label, value: option.value }
                            : {
                                  key: String(index),
                                  label: option === true ? t.yes : option === false ? t.no : String(option),
                                  value: option,
                              }
                    );
                else {
                    const texts = [...new Set(rows.map((row) => cellText(column, row)).filter(Boolean))];
                    choices = texts
                        .sort(collator.compare)
                        .map((text, index) => ({ key: String(index), label: text, value: text }));
                }
                return [column.id, choices] as const;
            })
        );
    }, [columns, rows, locale, t]);
    const applied = (): Draft =>
        Object.fromEntries(
            columns.map((column) => [
                column.id,
                fromColumnFilter(column, filters[column.id], choicesById.get(column.id) ?? []),
            ])
        );
    const [draft, setDraft] = useState<Draft>(applied);
    // Every opening starts with the applied filters
    const [seenOpen, setSeenOpen] = useState(open);
    if (open !== seenOpen) {
        setSeenOpen(open);
        if (open) setDraft(applied());
    }
    const set = (id: string, value: unknown) => setDraft((current) => ({ ...current, [id]: value }));
    const apply = () => {
        const next: Record<string, DataTableFilterValue> = {};
        for (const column of columns) {
            const filter = toColumnFilter(column, draft[column.id], choicesById.get(column.id) ?? [], locale);
            if (filter !== undefined) next[column.id] = filter;
        }
        onApply(next);
        onClose();
    };

    const input = (column: DataTableColumn<TData>) => {
        const type = column.filter ?? 'text';
        const value = draft[column.id];
        const choices = choicesById.get(column.id) ?? [];
        if (isRange(column)) {
            const range = Array.isArray(value) ? value : [undefined, undefined];
            const setPart = (part: 0 | 1, next: unknown) => {
                const copy = [...range];
                copy[part] = next;
                set(column.id, copy);
            };
            return (
                <View className={styles.sheetSection()}>
                    <Text className={styles.sheetLabel()} aria-hidden>
                        {column.header}
                    </Text>
                    <View className={styles.range()}>
                        {([0, 1] as const).map((part) => {
                            const name = `${column.header}: ${part === 0 ? t.from : t.to}`;
                            return (
                                <View key={part} className={styles.rangePart()}>
                                    {type === 'date' ? (
                                        <DatePicker
                                            aria-label={name}
                                            clearable
                                            value={(range[part] as string | undefined) ?? null}
                                            onValueChange={(next) => setPart(part, next ?? undefined)}
                                        />
                                    ) : (
                                        <Input
                                            aria-label={name}
                                            placeholder={part === 0 ? t.from : t.to}
                                            keyboardType="numeric"
                                            value={(range[part] as string | undefined) ?? ''}
                                            onChangeText={(text) => setPart(part, text)}
                                        />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            );
        }
        if (type === 'boolean')
            return (
                <View className={styles.sheetSection()}>
                    <Text className={styles.sheetLabel()} aria-hidden>
                        {column.header}
                    </Text>
                    <SegmentedControl
                        label={column.header}
                        value={typeof value === 'string' ? value : ''}
                        onValueChange={(next) => set(column.id, next)}
                        items={[
                            { value: '', label: t.filterAll },
                            { value: 'true', label: t.yes },
                            { value: 'false', label: t.no },
                        ]}
                    />
                </View>
            );
        return (
            <Field label={column.header}>
                {type === 'select' ? (
                    <Select
                        items={choices.map((choice) => ({ value: choice.key, label: choice.label }))}
                        value={(value as string | undefined) ?? null}
                        onValueChange={(next) => set(column.id, next ?? undefined)}
                        placeholder={t.filterAll}
                        clearable
                        filter={choices.length > 8}
                    />
                ) : type === 'multiSelect' ? (
                    <MultiSelect
                        items={choices.map((choice) => ({ value: choice.key, label: choice.label }))}
                        value={Array.isArray(value) ? (value as string[]) : []}
                        onValueChange={(next) => set(column.id, next)}
                        placeholder={t.filterAll}
                        clearable
                        filter={choices.length > 8}
                    />
                ) : type === 'date' ? (
                    <DatePicker
                        clearable
                        value={(value as string | undefined) ?? null}
                        onValueChange={(next) => set(column.id, next ?? undefined)}
                    />
                ) : (
                    <Input
                        clearable
                        keyboardType={type === 'number' ? 'numeric' : 'default'}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={(value as string | undefined) ?? ''}
                        onChangeText={(text) => set(column.id, text)}
                    />
                )}
            </Field>
        );
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            title={t.filters}
            closeLabel={translations.common.close}
            focusClose
            footer={
                <>
                    <Button
                        variant="outline"
                        onPress={() => {
                            onApply({});
                            onClose();
                        }}
                    >
                        {t.clear}
                    </Button>
                    <Button onPress={apply}>{t.apply}</Button>
                </>
            }
        >
            <View className={styles.sheetBody()}>
                {columns.map((column) => (
                    <View key={column.id}>{input(column)}</View>
                ))}
            </View>
        </Sheet>
    );
}
