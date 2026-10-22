import {
    addIsoDays,
    dayStrip,
    fromWallIso,
    localeWeekInfo,
    miniCalendar,
    startOfIsoWeekRow,
    todayIso,
    toWallIso,
    type DateLike,
    type DateValueType,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocale } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { useControllable } from '../../utils/useControllable.js';

export interface MiniCalendarProps<T extends DateLike = string> {
    /** Chosen day (ISO "2026-10-20" or Date) */
    value?: T | null;
    defaultValue?: T | null;
    onValueChange?: (value: T | null) => void;
    /** What onValueChange gets: an ISO string (default) or a Date */
    valueType?: DateValueType;
    /** First day shown at the start (default: the start of the week of the value or today) */
    startDate?: DateLike;
    /** Number of days in the strip (default 7) */
    days?: number;
    /** Earliest day that can be chosen */
    min?: DateLike;
    /** Latest day that can be chosen */
    max?: DateLike;
    /** Days that cannot be chosen – receives the ISO date */
    isDateUnavailable?: (date: string) => boolean;
    /** First day of the week for the start: 0 = Sunday … 6; default from the locale */
    firstDayOfWeek?: number;
    /** Name of the strip (default "Days") */
    label?: string;
    disabled?: boolean;
    className?: string;
}

/** Days in a row with arrows to earlier and later days – a radio group, each day named with its full date */
export function MiniCalendar<T extends DateLike = string>({
    value,
    defaultValue = null,
    onValueChange,
    valueType = 'string',
    startDate,
    days = 7,
    min,
    max,
    isDateUnavailable,
    firstDayOfWeek,
    label,
    disabled = false,
    className,
}: MiniCalendarProps<T>) {
    const { locale, translations } = useLocale();
    const t = translations.miniCalendar;
    const [selected, setSelected] = useControllable<T | null>(value, defaultValue, onValueChange);
    const iso = toWallIso(selected, false);
    const today = todayIso();
    const [start, setStart] = useState(
        () =>
            toWallIso(startDate, false) ??
            startOfIsoWeekRow(iso ?? today, firstDayOfWeek ?? localeWeekInfo(locale).firstDay)
    );
    const minIso = toWallIso(min, false);
    const maxIso = toWallIso(max, false);
    const styles = miniCalendar();
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    const full = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
    const asDate = (day: string) => new Date(`${day}T12:00:00Z`);

    return (
        <View className={styles.base({ class: className })}>
            <Pressable
                role="button"
                aria-label={t.previous}
                disabled={disabled}
                className={styles.nav()}
                onPress={() => setStart(addIsoDays(start, -days))}
            >
                <Icon icon={ChevronLeft} className={styles.navIcon()} />
            </Pressable>
            <View role="radiogroup" aria-label={label ?? t.label} className={styles.days()}>
                {dayStrip(start, days).map((day) => {
                    const unavailable =
                        disabled ||
                        (!!minIso && day < minIso) ||
                        (!!maxIso && day > maxIso) ||
                        !!isDateUnavailable?.(day);
                    const checked = day === iso;
                    const look = miniCalendar({ selected: checked, today: day === today, unavailable });
                    const choose = () => setSelected(fromWallIso(day, { valueType }) as T);
                    return (
                        <Pressable
                            key={day}
                            role="radio"
                            aria-checked={checked}
                            aria-label={full.format(asDate(day))}
                            disabled={unavailable}
                            aria-disabled={unavailable || undefined}
                            className={look.day()}
                            onPress={choose}
                            {...(unavailable ? {} : toggleOnSpace(choose))}
                        >
                            <Text className={look.weekday()}>{weekday.format(asDate(day))}</Text>
                            <Text className={look.number()}>{Number(day.slice(8, 10))}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <Pressable
                role="button"
                aria-label={t.next}
                disabled={disabled}
                className={styles.nav()}
                onPress={() => setStart(addIsoDays(start, days))}
            >
                <Icon icon={ChevronRight} className={styles.navIcon()} />
            </Pressable>
        </View>
    );
}
