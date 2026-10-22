import {
    parseQuarter,
    periodOf,
    periodPreset,
    periodStart,
    periodGrid,
    shiftMonth,
    todayIso,
    type Period,
    type PeriodPreset,
    type PeriodRange,
} from '@wirecore/wirelayer-recipes/native';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFieldControl } from '../components/Field/Field.js';
import { Button } from '../components/Button/Button.js';
import { Chip } from '../components/Chip/Chip.js';
import { useLocale } from '../locale.js';
import { useAnnouncer } from './announce.js';
import { Icon } from './Icon.js';
import { PickerTrigger } from './PickerTrigger.js';
import { Sheet } from './Sheet.js';
import { useControllable } from './useControllable.js';

/** Props shared by MonthPicker, QuarterPicker and YearPicker */
export interface PeriodPickerProps<T> {
    /** "2026-10" (month), "2026-Q4" (quarter) or "2026" (year); with range { start, end } */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    /** Start and end instead of one */
    range?: boolean;
    /** Earliest selectable period (same format as the value) */
    min?: string;
    /** Latest selectable period */
    max?: string;
    /** Buttons below the grid: "thisMonth", "lastQuarter", "last3Years" … or own { label, value } */
    presets?: (PeriodPreset | { label: string; value: PeriodRange })[];
    disabled?: boolean;
    invalid?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    closeLabel?: string;
    className?: string;
}

/** A value of a period picker: one period, a range, or nothing */
export type PeriodValue = string | PeriodRange | null;

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Month and year in the order and with the separator of the locale's short date ("10.2026", "10/2026", "2026-10") –
 * Intl's own month-year format uses "/" in German
 */
function monthYear(locale: string, month: string, year: string) {
    const parts = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    })
        .formatToParts(new Date(Date.UTC(2026, 9, 20)))
        .filter((part) => part.type !== 'day');
    const separator = parts.find((part) => part.type === 'literal')?.value.trim() || '.';
    const monthFirst =
        parts.findIndex((part) => part.type === 'month') < parts.findIndex((part) => part.type === 'year');
    return monthFirst ? `${month}${separator}${year}` : `${year}${separator}${month}`;
}

/** "MM.JJJJ" / "MM/YYYY" in the locale's order, "JJJJ" for years */
function placeholderOf(period: Period, locale: string, parts: { month: string; year: string }) {
    return period === 'year' ? parts.year : monthYear(locale, parts.month, parts.year);
}

/** Grid of months (3 × 4), quarters (2 × 2) or years (3 × 4) in a sheet; the field shows the period in the locale */
export function PeriodPicker<T extends PeriodValue>({
    period,
    value,
    defaultValue,
    onValueChange,
    range = false,
    min,
    max,
    presets,
    disabled,
    invalid,
    size,
    clearable = false,
    'aria-label': ariaLabel,
    closeLabel,
    className,
}: PeriodPickerProps<T> & { period: Period }) {
    const { locale, translations } = useLocale();
    const tq = translations.quarterPicker;
    const control = useFieldControl({ invalid, disabled });
    const [current, setCurrent] = useControllable<T>(
        value,
        (defaultValue ?? (range ? { start: null, end: null } : null)) as T,
        onValueChange
    );
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState<string | null>(null);
    const { announce, region } = useAnnouncer();
    const today = periodOf(todayIso(), period);
    const single = range ? null : (current as string | null);
    const span = range ? (current as PeriodRange | null) : null;
    const anchor = pending ?? single ?? span?.start ?? today;
    const [year, setYear] = useState(() => Number(anchor.slice(0, 4)));
    const label = control.label ?? ariaLabel;

    const textOf = (value: string) => {
        if (period === 'year') return value;
        if (period === 'quarter') {
            const parsed = parseQuarter(value);
            return parsed ? tq.quarter(parsed.quarter, parsed.year) : value;
        }
        return monthYear(locale, value.slice(5, 7), value.slice(0, 4));
    };
    const longOf = (value: string) =>
        period === 'month'
            ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
                  new Date(`${value}-15T12:00:00Z`)
              )
            : textOf(value);
    const text = range
        ? span?.start && span.end
            ? `${textOf(span.start)} – ${textOf(span.end)}`
            : undefined
        : single
          ? textOf(single)
          : undefined;
    const emit = (next: PeriodValue) => setCurrent(next as T);
    const close = () => {
        setOpen(false);
        setPending(null);
    };
    const pick = (cell: string) => {
        if (!range) {
            emit(cell);
            announce(longOf(cell));
            return close();
        }
        if (!pending) {
            setPending(cell);
            announce(`${translations.dateRange.start}: ${longOf(cell)}`);
            return;
        }
        const [first, last] = cell < pending ? [cell, pending] : [pending, cell];
        emit({ start: first, end: last });
        announce(`${longOf(first)} – ${longOf(last)}`);
        close();
    };

    // The cells of the visible year (months, quarters) or block of twelve years
    const blockStart = period === 'year' ? year - (((year % 12) + 12) % 12) : year;
    const cells =
        period === 'month'
            ? Array.from({ length: 12 }, (_, index) => `${year}-${pad(index + 1)}`)
            : period === 'quarter'
              ? Array.from({ length: 4 }, (_, index) => `${year}-Q${index + 1}`)
              : Array.from({ length: 12 }, (_, index) => String(blockStart + index));
    const columns = period === 'quarter' ? 2 : 3;
    const monthName = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    const cellLabel = (cell: string) => {
        if (period === 'month') return monthName.format(new Date(`${cell}-15T12:00:00Z`));
        if (period === 'quarter') return textOf(cell);
        return cell;
    };
    const quarterMonths = (cell: string) => {
        const first = periodStart(cell, 'quarter');
        const last = shiftMonth(first.slice(0, 7), 2);
        return `${monthName.format(new Date(`${first.slice(0, 7)}-15T12:00:00Z`))} – ${monthName.format(new Date(`${last}-15T12:00:00Z`))}`;
    };
    const outOfRange = (cell: string) => (!!min && cell < min) || (!!max && cell > max);
    const shownStart = pending ?? span?.start ?? null;
    const shownEnd = pending ? null : (span?.end ?? null);
    const step = period === 'year' ? 12 : 1;
    const title = period === 'year' ? `${blockStart} – ${blockStart + 11}` : String(year);
    const styles = periodGrid();
    const prevLabel = period === 'year' ? translations.datePicker.prevTrigger('year') : tq.prevYear;
    const nextLabel = period === 'year' ? translations.datePicker.nextTrigger('year') : tq.nextYear;
    const presetLabel = (preset: string) => translations.rangePresets[preset] ?? preset;

    return (
        <>
            <PickerTrigger
                label={label}
                text={text}
                placeholder={
                    period === 'quarter'
                        ? tq.placeholder
                        : placeholderOf(period, locale, translations.dateInput.placeholder())
                }
                indicator={CalendarDays}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => {
                    setYear(Number(anchor.slice(0, 4)));
                    setOpen(true);
                }}
                size={size}
                onClear={clearable ? () => emit(range ? { start: null, end: null } : null) : undefined}
                clearLabel={period === 'quarter' ? tq.clearTrigger : translations.datePicker.clearTrigger}
                className={className}
            />
            <Sheet
                open={open}
                onClose={close}
                title={label ?? (period === 'quarter' ? tq.content : translations.datePicker.content)}
                description={
                    pending
                        ? `${translations.dateRange.start}: ${textOf(pending)} – ${translations.dateRange.end}?`
                        : undefined
                }
                closeLabel={closeLabel ?? translations.common.close}
                focusClose
            >
                <View className={styles.base()}>
                    <View className={styles.header()}>
                        <Pressable
                            role="button"
                            aria-label={prevLabel}
                            className={styles.nav()}
                            onPress={() => setYear(year - step)}
                        >
                            <Icon icon={ChevronLeft} className={styles.navIcon()} />
                        </Pressable>
                        <Text role="heading" aria-live="polite" className={styles.title()}>
                            {title}
                        </Text>
                        <Pressable
                            role="button"
                            aria-label={nextLabel}
                            className={styles.nav()}
                            onPress={() => setYear(year + step)}
                        >
                            <Icon icon={ChevronRight} className={styles.navIcon()} />
                        </Pressable>
                    </View>
                    <View role="radiogroup" aria-label={title} className={styles.grid()}>
                        {cells.map((cell) => {
                            const selected = range ? cell === shownStart || cell === shownEnd : cell === single;
                            const inRange = range && !!shownStart && !!shownEnd && cell > shownStart && cell < shownEnd;
                            const unavailable = outOfRange(cell);
                            const look = periodGrid({ selected, inRange, current: cell === today, unavailable });
                            return (
                                <View key={cell} className={look.cell()} style={{ width: `${100 / columns}%` }}>
                                    <Pressable
                                        role="radio"
                                        aria-checked={selected}
                                        aria-label={
                                            period === 'quarter'
                                                ? tq.quarterButton(
                                                      parseQuarter(cell)!.quarter,
                                                      parseQuarter(cell)!.year,
                                                      quarterMonths(cell)
                                                  )
                                                : longOf(cell)
                                        }
                                        disabled={unavailable}
                                        aria-disabled={unavailable || undefined}
                                        className={look.item()}
                                        onPress={() => pick(cell)}
                                    >
                                        <Text className={look.itemText()}>{cellLabel(cell)}</Text>
                                        {period === 'quarter' && (
                                            <Text className={look.itemSubtext()}>{quarterMonths(cell)}</Text>
                                        )}
                                    </Pressable>
                                </View>
                            );
                        })}
                    </View>
                    {presets && presets.length > 0 && (
                        <View className={styles.presets()}>
                            {presets.map((preset) => {
                                const name = typeof preset === 'string' ? presetLabel(preset) : preset.label;
                                const target = typeof preset === 'string' ? periodPreset(preset, period) : preset.value;
                                return (
                                    <Chip
                                        key={name}
                                        label={name}
                                        disabled={!target}
                                        onPress={() => {
                                            if (!target) return;
                                            emit(range ? target : target.start);
                                            close();
                                        }}
                                    />
                                );
                            })}
                        </View>
                    )}
                    {(range ? !!span?.start : !!single) && (
                        <Button
                            variant="outline"
                            size="sm"
                            className={styles.clear()}
                            onPress={() => {
                                emit(range ? { start: null, end: null } : null);
                                close();
                            }}
                        >
                            {translations.calendar.clear}
                        </Button>
                    )}
                </View>
            </Sheet>
            {region}
        </>
    );
}
