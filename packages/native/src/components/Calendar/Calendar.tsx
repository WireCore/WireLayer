import {
    calendar,
    fromWallIso,
    rowWeekNumber,
    todayIso,
    toWallIso,
    type DateLike,
    type DateValueType,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useLocale } from '../../locale.js';
import { addMonths, monthGrid, parseDate, toIso, toJsDate, type CalendarDate } from '../../utils/dates.js';
import { Icon } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';

/** Options of the month view shared by Calendar, DatePicker and DateRangePicker */
export interface CalendarDisplayProps {
    /** Earliest selectable date (ISO or Date) */
    min?: DateLike;
    /** Latest selectable date (ISO or Date) */
    max?: DateLike;
    /** Dates that cannot be chosen, e.g. weekends – receives the ISO date */
    isDateUnavailable?: (date: string) => boolean;
    /** Single dates that cannot be chosen (holidays, booked days) */
    excludeDates?: DateLike[];
    /** Column with the ISO calendar weeks ("Wk") */
    showWeekNumbers?: boolean;
    /** "Today" and "Clear" below the calendar */
    showButtonBar?: boolean;
    /** Today is bold and underlined (default true) */
    highlightToday?: boolean;
    /** Leaves the days of the previous and next month empty */
    hideOutsideDays?: boolean;
    /** First day of the week: 0 = Sunday … 6 = Saturday; default from the locale */
    firstDayOfWeek?: number;
    /** IANA zone that decides which day is today */
    timeZone?: string;
}

interface CalendarViewProps extends CalendarDisplayProps {
    /** Month shown first */
    initialMonth: CalendarDate;
    isSelected: (iso: string) => boolean;
    /** Range state of a day (DateRangePicker) */
    rangeOf?: (iso: string) => { inRange: boolean; start: boolean; end: boolean };
    onPick: (iso: string) => void;
    /** Button bar: "Today" and "Clear" */
    onToday?: (iso: string) => void;
    onClear?: () => void;
    className?: string;
}

/**
 * Month view: the days of the month are a radio group named by the month; every day is named with its weekday and
 * full date. Previous/next switch the month. Used by Calendar, DatePicker and DateRangePicker.
 */
export function CalendarView({
    initialMonth,
    isSelected,
    rangeOf,
    onPick,
    onToday,
    onClear,
    min,
    max,
    isDateUnavailable,
    excludeDates,
    showWeekNumbers = false,
    showButtonBar = false,
    highlightToday = true,
    hideOutsideDays = false,
    firstDayOfWeek,
    timeZone,
    className,
}: CalendarViewProps) {
    const { locale, translations } = useLocale();
    const [visible, setVisible] = useState<CalendarDate>(initialMonth);
    const styles = calendar();
    const now = todayIso(timeZone);
    const minIso = toWallIso(min, false);
    const maxIso = toWallIso(max, false);
    const excluded = new Set((excludeDates ?? []).map((date) => toWallIso(date, false)));
    const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        toJsDate({ ...visible, day: 1 })
    );
    const dayName = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
    const weekdayName = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    const weeks = monthGrid(visible, locale, firstDayOfWeek);
    const t = translations.datePicker;
    const unavailableDay = (iso: string) =>
        (!!minIso && iso < minIso) || (!!maxIso && iso > maxIso) || excluded.has(iso) || !!isDateUnavailable?.(iso);

    return (
        <View className={styles.base({ class: className })}>
            <View className={styles.header()}>
                <Pressable
                    role="button"
                    aria-label={t.prevTrigger('day')}
                    className={styles.nav()}
                    onPress={() => setVisible(addMonths(visible, -1))}
                >
                    <Icon icon={ChevronLeft} className={styles.navIcon()} />
                </Pressable>
                <Text role="heading" aria-live="polite" className={styles.title()}>
                    {monthName}
                </Text>
                <Pressable
                    role="button"
                    aria-label={t.nextTrigger('day')}
                    className={styles.nav()}
                    onPress={() => setVisible(addMonths(visible, 1))}
                >
                    <Icon icon={ChevronRight} className={styles.navIcon()} />
                </Pressable>
            </View>
            {/* The day buttons carry the weekday in their names – the header row is decoration */}
            <View className={styles.weekdays()} aria-hidden>
                {showWeekNumbers && (
                    <View className={styles.weekNumberHead()}>
                        <Text className={styles.weekNumberText()}>{t.weekColumnShort}</Text>
                    </View>
                )}
                {weeks[0]!.map((date) => (
                    <View key={toIso(date)} className={styles.weekday()}>
                        <Text className={styles.weekdayText()}>{weekdayName.format(toJsDate(date))}</Text>
                    </View>
                ))}
            </View>
            <View role="radiogroup" aria-label={monthName}>
                {weeks.map((week) => {
                    const days = week.map(toIso);
                    return (
                        <View key={days[0]} className={styles.week()}>
                            {showWeekNumbers && (
                                <View className={styles.weekNumber()} aria-hidden>
                                    <Text className={styles.weekNumberText()}>{rowWeekNumber(days)}</Text>
                                </View>
                            )}
                            {week.map((date) => {
                                const iso = toIso(date);
                                const outside = date.month !== visible.month;
                                const unavailable = unavailableDay(iso);
                                const checked = isSelected(iso);
                                const range = rangeOf?.(iso);
                                const day = calendar({
                                    selected: checked,
                                    today: highlightToday && iso === now,
                                    outside,
                                    unavailable,
                                    inRange: range?.inRange,
                                    rangeStart: range?.start,
                                    rangeEnd: range?.end,
                                });
                                if (outside)
                                    return (
                                        <View key={iso} className={day.day()} aria-hidden>
                                            {!hideOutsideDays && (
                                                <View className={day.dayMark()}>
                                                    <Text className={day.dayText()}>{date.day}</Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                const name = dayName.format(toJsDate(date));
                                return (
                                    <Pressable
                                        key={iso}
                                        role="radio"
                                        aria-checked={checked}
                                        aria-label={
                                            unavailable
                                                ? t.dayCell({ valueText: name, selected: false, unavailable })
                                                : name
                                        }
                                        disabled={unavailable}
                                        aria-disabled={unavailable || undefined}
                                        className={day.day()}
                                        onPress={() => onPick(iso)}
                                    >
                                        {range?.inRange && <View className={day.rangeFill()} aria-hidden />}
                                        <View className={day.dayMark()}>
                                            <Text className={day.dayText()}>{date.day}</Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    );
                })}
            </View>
            {showButtonBar && (
                <View className={styles.buttonBar()}>
                    <Button
                        variant="text"
                        size="sm"
                        disabled={unavailableDay(now)}
                        onPress={() => {
                            const today = parseDate(now)!;
                            setVisible({ ...today, day: 1 });
                            onToday?.(now);
                        }}
                    >
                        {translations.calendar.today}
                    </Button>
                    <Button variant="text" size="sm" onPress={onClear}>
                        {translations.calendar.clear}
                    </Button>
                </View>
            )}
        </View>
    );
}

export interface CalendarProps<T extends DateLike = string> extends CalendarDisplayProps, ViewProps {
    /** ISO date, e.g. "2026-10-20" (a Date is accepted too) */
    value?: T | null;
    defaultValue?: T | null;
    onValueChange?: (value: T | null) => void;
    /** What onValueChange gets: ISO strings (default) or Date objects */
    valueType?: DateValueType;
    /** Month shown first (ISO) – default: the value or today */
    defaultMonth?: string;
    /** Choosing the selected day again clears it */
    allowDeselect?: boolean;
    className?: string;
}

/**
 * Month view: the days of the month are a radio group named by the month; every day is named with its
 * weekday and full date. Previous/next switch the month.
 */
export function Calendar<T extends DateLike = string>({
    value,
    defaultValue = null,
    onValueChange,
    valueType = 'string',
    defaultMonth,
    allowDeselect = false,
    min,
    max,
    isDateUnavailable,
    excludeDates,
    showWeekNumbers,
    showButtonBar,
    highlightToday,
    hideOutsideDays,
    firstDayOfWeek,
    timeZone,
    className,
    ...props
}: CalendarProps<T>) {
    const [selected, setSelected] = useControllable<T | null>(value, defaultValue, onValueChange);
    const iso = toWallIso(selected, false, timeZone);
    const emit = (next: string | null) => setSelected(fromWallIso(next, { valueType }) as T | null);

    return (
        <View {...props} className={className}>
            <CalendarView
                initialMonth={parseDate(defaultMonth) ?? parseDate(iso) ?? parseDate(todayIso(timeZone))!}
                isSelected={(day) => day === iso}
                onPick={(day) => emit(allowDeselect && day === iso ? null : day)}
                onToday={emit}
                onClear={() => emit(null)}
                min={min}
                max={max}
                isDateUnavailable={isDateUnavailable}
                excludeDates={excludeDates}
                showWeekNumbers={showWeekNumbers}
                showButtonBar={showButtonBar}
                highlightToday={highlightToday}
                hideOutsideDays={hideOutsideDays}
                firstDayOfWeek={firstDayOfWeek}
                timeZone={timeZone}
            />
        </View>
    );
}
