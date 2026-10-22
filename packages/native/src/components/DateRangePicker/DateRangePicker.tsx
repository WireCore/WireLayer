import {
    calendar,
    fromWallIso,
    localeWeekInfo,
    namedDateRange,
    todayIso,
    toWallIso,
    type DateLike,
    type DateValueType,
} from '@wirecore/wirelayer-recipes/native';
import { CalendarRange } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { datePattern, parseDate, toJsDate } from '../../utils/dates.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { CalendarView, type CalendarDisplayProps } from '../Calendar/Calendar.js';
import { Chip } from '../Chip/Chip.js';
import { useFieldControl } from '../Field/Field.js';

/** Start and end as ISO dates, null while not chosen */
export interface DateRange {
    start: string | null;
    end: string | null;
}

/** A range as ISO strings or Date objects (valueType "date") */
export interface DateRangeLike {
    start: DateLike | null;
    end: DateLike | null;
}

export interface DateRangePickerProps<T extends DateRangeLike = DateRange> extends CalendarDisplayProps {
    /** Start and end; Date objects are accepted too */
    value?: T | null;
    defaultValue?: T | null;
    onValueChange?: (value: T | null) => void;
    /** What onValueChange gets: ISO strings (default) or Date objects */
    valueType?: DateValueType;
    /** Buttons below the calendar: "last7Days", "thisMonth", "lastMonth", "thisQuarter", "thisYear" … or own { label, value } */
    presets?: (string | { label: string; value: DateRangeLike })[];
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    closeLabel?: string;
    disabled?: boolean;
    invalid?: boolean;
    className?: string;
}

/**
 * Start and end in one field ("10/20/2026 – 10/24/2026"); the calendar in the sheet picks the start, then the end
 * (each step is announced), presets pick a whole range.
 */
export function DateRangePicker<T extends DateRangeLike = DateRange>({
    value,
    defaultValue = null,
    onValueChange,
    valueType = 'string',
    presets,
    clearable = false,
    size,
    'aria-label': ariaLabel,
    closeLabel,
    disabled,
    invalid,
    className,
    timeZone,
    showButtonBar,
    ...display
}: DateRangePickerProps<T>) {
    const { locale, translations } = useLocale();
    const t = translations.datePicker;
    const control = useFieldControl({ invalid, disabled });
    const [range, setRange] = useControllable<T | null>(value, defaultValue, onValueChange);
    const [open, setOpen] = useState(false);
    // The start while the end is still open (the value changes once both are chosen)
    const [pending, setPending] = useState<string | null>(null);
    const { announce, region } = useAnnouncer();
    const start = toWallIso(range?.start, false, timeZone);
    const end = toWallIso(range?.end, false, timeZone);
    const short = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
    });
    const long = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const format = (iso: string, formatter = short) => formatter.format(toJsDate(parseDate(iso)!));
    const text = start && end ? `${format(start)} – ${format(end)}` : undefined;
    const label = control.label ?? ariaLabel;
    const emit = (next: DateRange | null) =>
        setRange(
            next
                ? ({
                      start: fromWallIso(next.start, { valueType }),
                      end: fromWallIso(next.end, { valueType }),
                  } as T)
                : null
        );
    const close = () => {
        setOpen(false);
        setPending(null);
    };
    const pick = (day: string) => {
        if (!pending) {
            setPending(day);
            announce(`${translations.dateRange.start}: ${format(day, long)}`);
            return;
        }
        const [first, last] = day < pending ? [day, pending] : [pending, day];
        emit({ start: first, end: last });
        announce(`${format(first, long)} – ${format(last, long)}`);
        close();
    };
    const shownStart = pending ?? start;
    const shownEnd = pending ? null : end;
    const presetLabel = (preset: string) => translations.rangePresets[preset] ?? preset;
    const firstDay = display.firstDayOfWeek ?? localeWeekInfo(locale).firstDay;

    return (
        <>
            <PickerTrigger
                label={label}
                text={text}
                placeholder={`${datePattern(locale, t.placeholder())} – ${datePattern(locale, t.placeholder())}`}
                indicator={CalendarRange}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => setOpen(true)}
                size={size}
                onClear={clearable ? () => emit(null) : undefined}
                clearLabel={translations.dateRange.clearTrigger}
                className={className}
            />
            <Sheet
                open={open}
                onClose={close}
                title={label ?? t.content}
                description={
                    pending
                        ? `${translations.dateRange.start}: ${format(pending)} – ${translations.dateRange.end}?`
                        : undefined
                }
                closeLabel={closeLabel ?? translations.common.close}
                focusClose
                footer={
                    (start || pending) && !showButtonBar ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onPress={() => {
                                emit(null);
                                close();
                            }}
                        >
                            {translations.dateRange.clearTrigger}
                        </Button>
                    ) : undefined
                }
            >
                <CalendarView
                    className={calendar().sheetBody()}
                    initialMonth={parseDate(shownStart) ?? parseDate(todayIso(timeZone))!}
                    isSelected={(day) => day === shownStart || day === shownEnd}
                    rangeOf={(day) => ({
                        inRange:
                            !!shownStart &&
                            !!shownEnd &&
                            day >= shownStart &&
                            day <= shownEnd &&
                            shownStart !== shownEnd,
                        start: day === shownStart,
                        end: day === shownEnd,
                    })}
                    onPick={pick}
                    onToday={(day) => pick(day)}
                    onClear={() => {
                        emit(null);
                        close();
                    }}
                    showButtonBar={showButtonBar}
                    timeZone={timeZone}
                    {...display}
                />
                {presets && presets.length > 0 && (
                    <View className={calendar().presets()}>
                        {presets.map((preset) => {
                            const name = typeof preset === 'string' ? presetLabel(preset) : preset.label;
                            const target =
                                typeof preset === 'string'
                                    ? namedDateRange(preset, todayIso(timeZone), firstDay)
                                    : {
                                          start: toWallIso(preset.value.start, false, timeZone),
                                          end: toWallIso(preset.value.end, false, timeZone),
                                      };
                            return (
                                <Chip
                                    key={name}
                                    label={name}
                                    disabled={!target}
                                    onPress={() => {
                                        if (!target) return;
                                        emit(target);
                                        close();
                                    }}
                                />
                            );
                        })}
                    </View>
                )}
            </Sheet>
            {region}
        </>
    );
}
