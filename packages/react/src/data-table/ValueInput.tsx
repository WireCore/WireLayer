import { useContext, type ReactNode } from 'react';
import { Checkbox } from '../components/Checkbox/Checkbox.js';
import { Input } from '../components/Input/Input.js';
import { MultiSelect } from '../components/MultiSelect/MultiSelect.js';
import type { ListItemState } from '../components/Select/list.js';
import { Select } from '../components/Select/Select.js';
import { Textarea } from '../components/Textarea/Textarea.js';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { FeatureContext } from './features.js';
import type { DataTableEditInputOptions } from './types.js';

export interface ValueInputProps {
    type: 'text' | 'textarea' | 'number' | 'select' | 'multiSelect' | 'date' | 'datetime' | 'boolean' | 'checkbox';
    value: unknown;
    onChange: (value: unknown) => void;
    label: string;
    /** Choices of select and multiSelect: texts, or values of any type ({ value, label, group }, numbers) */
    options?: readonly unknown[];
    /** Select: an "All" choice (empty value) first – for filters (a multiSelect shows "All" while it is empty) */
    any?: boolean;
    invalid?: boolean;
    /** Settings of the input (the column's `filterInputProps` or `editInputProps`) */
    inputProps?: DataTableEditInputOptions;
    /** An edited cell: a cleared select gives null (a filter: an empty text) */
    edit?: boolean;
    /** The value of a filter: a text field shows "Filter …" (translations `filterText`) without its own placeholder */
    filter?: boolean;
    /** Both ends of a range (`[from, to]`) in one field – dates with the dateRangeInput feature */
    range?: boolean;
    /** An option of select and multiSelect (the column's `renderOption`) */
    renderOption?: (item: unknown, state: ListItemState) => ReactNode;
}

/** One value of a filter condition or an edited cell – the matching input for the type */
export function ValueInput({
    type,
    value,
    onChange,
    label,
    options,
    any = false,
    invalid,
    inputProps,
    edit = false,
    filter = false,
    range = false,
    renderOption,
}: ValueInputProps) {
    const translations = useTranslations();
    const t = translations.dataTable;
    // DatePicker and NumberInput come from the features dateInput and numberInput – without them the browser's inputs
    const {
        dateInput: DatePicker,
        numberInput: NumberInput,
        dateRangeInput: DateRangePicker,
    } = useContext(FeatureContext);
    // Choices with values of their own keep them (objects, numbers); text choices stay text as before
    const byValue = (options ?? []).some((option) => typeof option !== 'string');
    const items: unknown[] = [
        ...(any && type !== 'multiSelect' ? [{ value: '', label: t.filterAll }] : []),
        ...(type === 'boolean'
            ? [
                  { value: 'true', label: t.yes },
                  { value: 'false', label: t.no },
              ]
            : (options ?? []).map((option) =>
                  typeof option === 'string' ? { value: option, label: option } : option
              )),
    ];
    const text = value === null || value === undefined ? '' : String(value);

    if (range && (type === 'date' || type === 'datetime') && DateRangePicker)
        return (
            <DateRangePicker
                size="sm"
                aria-label={label}
                invalid={invalid}
                placeholder={inputProps?.placeholder}
                withTime={type === 'datetime'}
                // The range [from, to] as the picker's { start, end } and back
                value={
                    Array.isArray(value) && (value[0] || value[1])
                        ? { start: value[0] ?? null, end: value[1] ?? null }
                        : null
                }
                onValueChange={(next) => onChange([next?.start ?? null, next?.end ?? null])}
            />
        );
    if (type === 'text')
        return (
            <Input
                size="sm"
                aria-label={label}
                invalid={invalid}
                placeholder={inputProps?.placeholder ?? (filter ? t.filterText : undefined)}
                value={text}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    if (type === 'textarea')
        return (
            <Textarea
                size="sm"
                autoResize
                aria-label={label}
                invalid={invalid}
                value={text}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    if (type === 'number' && NumberInput)
        return (
            <NumberInput
                size="sm"
                aria-label={label}
                invalid={invalid}
                placeholder={inputProps?.placeholder}
                min={inputProps?.min}
                max={inputProps?.max}
                step={inputProps?.step}
                allowDecimal={inputProps?.allowDecimal}
                formatOptions={inputProps?.formatOptions}
                value={typeof value === 'number' ? value : null}
                onValueChange={onChange}
            />
        );
    if (type === 'number')
        return (
            <Input
                type="number"
                size="sm"
                aria-label={label}
                invalid={invalid}
                placeholder={inputProps?.placeholder}
                min={inputProps?.min}
                max={inputProps?.max}
                step={inputProps?.step ?? (inputProps?.allowDecimal === false ? 1 : undefined)}
                value={typeof value === 'number' ? String(value) : ''}
                // The browser's number input: an empty or invalid entry is no number; allowDecimal false rounds
                onChange={({ target }) =>
                    onChange(
                        target.value && Number.isFinite(Number(target.value))
                            ? inputProps?.allowDecimal === false
                                ? Math.round(Number(target.value))
                                : Number(target.value)
                            : null
                    )
                }
            />
        );
    if ((type === 'date' || type === 'datetime') && DatePicker)
        return (
            <DatePicker
                size="sm"
                aria-label={label}
                invalid={invalid}
                placeholder={inputProps?.placeholder}
                withTime={type === 'datetime'}
                value={text || null}
                onValueChange={onChange}
            />
        );
    if (type === 'date' || type === 'datetime')
        return (
            <Input
                type={type === 'date' ? 'date' : 'datetime-local'}
                size="sm"
                aria-label={label}
                invalid={invalid}
                value={text.slice(0, type === 'date' ? 10 : 16)}
                onChange={({ target }) => onChange(target.value || null)}
            />
        );
    if (type === 'multiSelect')
        return (
            <MultiSelect
                size="sm"
                aria-label={label}
                items={items}
                invalid={invalid}
                placeholder={inputProps?.placeholder ?? t.filterAll}
                filter={inputProps?.filter}
                maxShown={inputProps?.maxShown}
                clearable={inputProps?.clearable}
                selectAll={inputProps?.selectAll}
                renderItem={renderOption}
                value={Array.isArray(value) ? (value as unknown[]) : []}
                onValueChange={onChange}
            />
        );
    if (type === 'checkbox')
        return (
            <Checkbox
                aria-label={label}
                invalid={invalid}
                checked={value === true}
                onCheckedChange={(checked) => onChange(checked === true)}
            />
        );
    return (
        <Select
            size="sm"
            aria-label={label}
            items={items}
            invalid={invalid}
            placeholder={inputProps?.placeholder ?? translations.common.placeholder}
            filter={inputProps?.filter}
            clearable={inputProps?.clearable}
            renderItem={renderOption}
            value={byValue ? (value ?? (any ? '' : null)) : text}
            onValueChange={(next) => onChange(next ?? (edit ? null : ''))}
        />
    );
}
