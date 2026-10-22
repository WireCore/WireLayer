import { DateInput as ArkDateInput } from '@ark-ui/react/date-input';
import { useFieldContext } from '@ark-ui/react/field';
import { Portal } from '@ark-ui/react/portal';
import { createListCollection, Select as ArkSelect } from '@ark-ui/react/select';
import { DateFormatter } from '@internationalized/date';
import {
    datePicker as datePickerRecipe,
    formatTime,
    parseTimeText,
    select as selectRecipe,
    timeWithZoneOffset,
    timeZoneLabel,
    timeZoneLongLabel,
    todayIso,
    zonedTime,
    zonedToInstant,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Check, Clock, X } from 'lucide-react';
import { useId, useMemo, useState, type CSSProperties } from 'react';
import { DateSegments } from '../DatePicker/DatePickerBase.js';
import { fromTime, timeSlots, toTime } from '../DatePicker/dates.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

// Only hour and minute: the date input edits a date-time on a fixed day
const placeholder = fromTime('00:00');

/** A time in the list: "HH:mm" or with its own label ("12:00", "Noon") */
export type TimeOption = string | { value: string; label: string };

export interface TimePickerProps {
    /** "HH:mm", e.g. "14:30" ("HH:mm:ss" with withSeconds); with timeZone "14:30+02:00" */
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    /** Earliest time ("HH:mm") – also the start of the list */
    min?: string;
    /** Latest time ("HH:mm") – also the end of the list */
    max?: string;
    /** Minutes between the times in the list */
    step?: number;
    /** Adds seconds to the field and the value ("HH:mm:ss") */
    withSeconds?: boolean;
    /** 12 or 24 hours; default from the locale */
    hourCycle?: 'h12' | 'h23';
    /** Own times for the list instead of every `step` minutes, optionally named */
    options?: TimeOption[];
    /** 24 or 12 hours follow the locale */
    locale?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** IANA zone ("Europe/Berlin"): the time is typed in the zone, the value gets its offset ("14:30+02:00") */
    timeZone?: string;
    /** Day whose offset applies with timeZone (ISO, default today) */
    referenceDate?: string;
    /** Short zone name after the time ("CEST") */
    showTimeZone?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof datePickerRecipe>;
}

/**
 * Time field: type the digits one after another ("1430"), arrow keys change hour or minute – or pick from the
 * list of times (every `step` minutes). Gives "HH:mm".
 */
export function TimePicker({
    classes,
    value,
    defaultValue = null,
    onValueChange,
    min,
    max,
    step = 30,
    withSeconds = false,
    hourCycle,
    options,
    locale: localeProp,
    disabled,
    readOnly,
    invalid,
    required,
    name,
    size,
    clearable = true,
    timeZone,
    referenceDate,
    showTimeZone,
    'aria-label': ariaLabel,
    className,
    style,
}: TimePickerProps) {
    const datePicker = useRecipe('datePicker', datePickerRecipe, classes);
    const select = useRecipe('select', selectRecipe);
    const styles = datePicker({ size });
    const list = select();
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const id = useId();
    const field = useFieldContext();
    const state = {
        disabled: disabled ?? field?.disabled,
        readOnly: readOnly ?? field?.readOnly,
        invalid: invalid ?? field?.invalid,
        required: required ?? field?.required,
    };
    const [internal, setInternal] = useState(defaultValue);
    const current = value === undefined ? internal : value;
    // With timeZone the value carries an offset – the field shows the time in the zone
    const wall = current ? (timeZone ? zonedTime(current, timeZone, referenceDate, withSeconds) : current) : null;
    const set = (time: string | null) => {
        const next = time && timeZone ? timeWithZoneOffset(time, timeZone, referenceDate) : time;
        if (next === current) return;
        setInternal(next);
        onValueChange?.(next);
    };
    const formatter = useMemo(
        () =>
            new DateFormatter(locale, {
                hour: '2-digit',
                minute: '2-digit',
                ...(withSeconds ? { second: '2-digit' } : {}),
                ...(hourCycle ? { hourCycle } : {}),
            }),
        [locale, withSeconds, hourCycle]
    );
    const collection = useMemo(
        () =>
            createListCollection({
                items: (options ?? timeSlots(step, min, max, withSeconds)).map((option) =>
                    typeof option === 'string'
                        ? {
                              value: option,
                              label: hourCycle ? formatTime(option, locale, { hourCycle, withSeconds }) : option,
                          }
                        : option
                ),
            }),
        [options, step, min, max, withSeconds, hourCycle, locale]
    );
    let zone: { short: string; long: string } | undefined;
    if (showTimeZone && timeZone) {
        const instant = zonedToInstant(`${referenceDate ?? todayIso(timeZone)}T${wall ?? '12:00'}`, timeZone);
        zone = {
            short: timeZoneLabel(timeZone, locale, instant),
            long: translations.calendar.timeZone(timeZoneLongLabel(timeZone, locale, instant)),
        };
    }
    const describedby = [field?.ariaDescribedby, zone ? `${id}tz` : undefined].filter(Boolean).join(' ') || undefined;
    // Pasting "14:30", "2:30 PM" or "14.30 Uhr" sets the time (Ark reads ISO dates only)
    const pasteText = (text: string) => {
        const time = parseTimeText(text, withSeconds);
        if (!time) return false;
        set(time);
        return true;
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <div
                className={styles.control()}
                data-invalid={state.invalid || undefined}
                data-disabled={state.disabled || undefined}
            >
                <ArkDateInput.Root
                    className={styles.dateInput()}
                    ids={field ? { label: () => field.ids.label } : undefined}
                    value={wall ? [fromTime(wall)] : []}
                    onValueChange={(details) => set(toTime(details.value[0], withSeconds))}
                    granularity={withSeconds ? 'second' : 'minute'}
                    formatter={formatter}
                    placeholderValue={placeholder}
                    min={min ? fromTime(min) : undefined}
                    max={max ? fromTime(max) : undefined}
                    {...state}
                    locale={locale}
                    shouldForceLeadingZeros
                    translations={translations.dateInput}
                >
                    <ArkDateInput.Control className={styles.dateControl()}>
                        <DateSegments
                            index={0}
                            label={field ? undefined : ariaLabel}
                            describedby={describedby}
                            paste={pasteText}
                            size={size}
                        />
                    </ArkDateInput.Control>
                </ArkDateInput.Root>
                {zone && (
                    <>
                        <span className={styles.timeZone()} aria-hidden="true">
                            {zone.short}
                        </span>
                        <span id={`${id}tz`} hidden>
                            {zone.long}
                        </span>
                    </>
                )}
                {name && <input type="hidden" name={name} value={current ?? ''} />}
                {clearable && current && !state.disabled && !state.readOnly && (
                    <button
                        type="button"
                        className={styles.clear()}
                        aria-label={translations.timePicker.clearTrigger}
                        onClick={() => set(null)}
                    >
                        <X className={styles.clearIcon()} aria-hidden="true" />
                    </button>
                )}
                <ArkSelect.Root
                    className={styles.timeSelect()}
                    collection={collection}
                    value={wall ? [wall] : []}
                    onValueChange={(details) => set(details.value[0] ?? null)}
                    disabled={state.disabled || state.readOnly}
                    ids={{ label: `${id}list` }}
                    positioning={{ placement: 'bottom-end', gutter: 4 }}
                    lazyMount
                    unmountOnExit
                >
                    <ArkSelect.Label className={styles.timeListLabel()}>
                        {translations.timePicker.trigger}
                    </ArkSelect.Label>
                    <ArkSelect.Trigger className={styles.trigger()}>
                        <Clock className={styles.triggerIcon()} aria-hidden="true" />
                    </ArkSelect.Trigger>
                    <Portal>
                        <ArkSelect.Positioner>
                            <ArkSelect.Content className={list.content({ class: styles.timeList() })}>
                                {collection.items.map((item) => (
                                    <ArkSelect.Item key={item.value} item={item} className={list.item()}>
                                        <ArkSelect.ItemText className={list.itemText()}>
                                            {item.label}
                                        </ArkSelect.ItemText>
                                        <ArkSelect.ItemIndicator>
                                            <Check className={list.itemIndicator()} aria-hidden="true" />
                                        </ArkSelect.ItemIndicator>
                                    </ArkSelect.Item>
                                ))}
                            </ArkSelect.Content>
                        </ArkSelect.Positioner>
                    </Portal>
                </ArkSelect.Root>
            </div>
        </div>
    );
}
