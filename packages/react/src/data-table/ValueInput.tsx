import { Checkbox } from '../components/Checkbox/Checkbox.js';
import { DatePicker } from '../components/DatePicker/DatePicker.js';
import { Input } from '../components/Input/Input.js';
import { MultiSelect } from '../components/MultiSelect/MultiSelect.js';
import { NumberInput } from '../components/NumberInput/NumberInput.js';
import { Select } from '../components/Select/Select.js';
import { Textarea } from '../components/Textarea/Textarea.js';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';

export interface ValueInputProps {
    type: 'text' | 'textarea' | 'number' | 'select' | 'multiSelect' | 'date' | 'datetime' | 'boolean' | 'checkbox';
    value: unknown;
    onChange: (value: unknown) => void;
    label: string;
    /** Choices of select and multiSelect: texts, or values of any type ({ value, label, group }, numbers) */
    options?: readonly unknown[];
    /** Select: an "All" choice (empty value) first – for filters */
    any?: boolean;
    invalid?: boolean;
}

/** One value of a filter condition or an edited cell – the matching input for the type */
export function ValueInput({ type, value, onChange, label, options, any = false, invalid }: ValueInputProps) {
    const translations = useTranslations();
    const t = translations.dataTable;
    // Choices with values of their own keep them (objects, numbers); text choices stay text as before
    const byValue = (options ?? []).some((option) => typeof option !== 'string');
    const items: unknown[] = [
        ...(any ? [{ value: '', label: t.filterAll }] : []),
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

    if (type === 'text')
        return (
            <Input
                size="sm"
                aria-label={label}
                invalid={invalid}
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
    if (type === 'number')
        return (
            <NumberInput
                size="sm"
                aria-label={label}
                invalid={invalid}
                value={typeof value === 'number' ? value : null}
                onValueChange={onChange}
            />
        );
    if (type === 'date' || type === 'datetime')
        return (
            <DatePicker
                aria-label={label}
                invalid={invalid}
                withTime={type === 'datetime'}
                value={text || null}
                onValueChange={onChange}
            />
        );
    if (type === 'multiSelect')
        return (
            <MultiSelect
                aria-label={label}
                items={items}
                invalid={invalid}
                placeholder={t.filterAll}
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
            aria-label={label}
            items={items}
            invalid={invalid}
            placeholder={translations.common.placeholder}
            value={byValue ? (value ?? (any ? '' : null)) : text}
            onValueChange={(next) => onChange(next ?? '')}
        />
    );
}
