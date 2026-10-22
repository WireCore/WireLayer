import {
    formatTime,
    inTimeRange,
    pluralText,
    timeGrid,
    timeGridSlots,
    timeToSeconds,
    type TimeGridSlot,
} from '@wirecore/wirelayer-recipes/native';
import { useId } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { pressedProps, toggleOnSpace } from '../../utils/keyboard.js';
import { Loader } from '../../utils/Loader.js';
import { useControllable } from '../../utils/useControllable.js';

/** A chosen range of slots: start times of the first and last slot */
export interface TimeGridRange {
    start: string | null;
    end: string | null;
}

export interface TimeGridProps<T extends string | TimeGridRange | null = string | null> {
    /** Chosen start time ("HH:mm"); with range { start, end } (start times of the first and last slot) */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    /** The bookable times; default every `interval` minutes from `start` up to `end` */
    times?: (string | TimeGridSlot)[];
    /** First slot ("HH:mm") when `times` is not given */
    start?: string;
    /** End of the last slot ("HH:mm") when `times` is not given */
    end?: string;
    /** Minutes between the slots when `times` is not given */
    interval?: number;
    /** Times that are taken */
    disabledTimes?: string[];
    /** A start and an end slot instead of one */
    range?: boolean;
    /** 12 or 24 hours; default from the locale */
    hourCycle?: 'h12' | 'h23';
    /** Name of the group (default "Available times") */
    label?: string;
    /** Shows that the slots are being loaded */
    loading?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** Slots per row (default 3) */
    columns?: number;
    className?: string;
}

/**
 * Free time slots for a booking (44 pt each): radio buttons for one time, toggle buttons for a range (start, then
 * end). Taken slots stay visible but cannot be chosen; the number of free slots is announced.
 */
export function TimeGrid<T extends string | TimeGridRange | null = string | null>({
    value,
    defaultValue,
    onValueChange,
    times,
    start = '08:00',
    end = '18:00',
    interval = 30,
    disabledTimes = [],
    range = false,
    hourCycle,
    label,
    loading = false,
    disabled = false,
    size,
    columns = 3,
    className,
}: TimeGridProps<T>) {
    const { locale, translations } = useLocale();
    const t = translations.timeGrid;
    const [current, setCurrent] = useControllable<T>(
        value,
        (defaultValue ?? (range ? { start: null, end: null } : null)) as T,
        onValueChange
    );
    const id = useId();
    const { announce, region } = useAnnouncer();
    const slots: TimeGridSlot[] = (times ?? timeGridSlots(start, end, interval)).map((slot) =>
        typeof slot === 'string' ? { value: slot } : slot
    );
    const taken = (slot: TimeGridSlot) => !!slot.disabled || disabledTimes.includes(slot.value);
    const free = slots.filter((slot) => !taken(slot)).length;
    const styles = timeGrid({ size });
    const span = range ? (current as TimeGridRange | null) : null;
    const pick = (slot: string) => {
        if (!range) return setCurrent(slot as T);
        // First tap: start; second: end (the earlier one becomes the start); a third starts over
        if (!span?.start || span.end) return setCurrent({ start: slot, end: null } as T);
        const [first, last] =
            (timeToSeconds(slot) ?? 0) < (timeToSeconds(span.start) ?? 0) ? [slot, span.start] : [span.start, slot];
        // Taken slots inside the range block it
        const blocked = slots.some((entry) => taken(entry) && inTimeRange(entry.value, { start: first, end: last }));
        if (blocked) return setCurrent({ start: slot, end: null } as T);
        setCurrent({ start: first, end: last } as T);
        announce(`${formatTime(first, locale, { hourCycle })} – ${formatTime(last, locale, { hourCycle })}`);
    };

    return (
        <View className={styles.base({ class: className })}>
            <Text nativeID={`${id}label`} className={styles.label()}>
                {label ?? t.label}
            </Text>
            {loading ? (
                <View role="status" className={styles.statusRow()}>
                    <Loader className={styles.spinner()} />
                    <Text className={styles.status()}>{t.loading}</Text>
                </View>
            ) : !slots.length ? (
                <Text role="status" className={styles.status()}>
                    {t.empty}
                </Text>
            ) : (
                <View
                    role={range ? 'group' : 'radiogroup'}
                    aria-labelledby={`${id}label`}
                    accessibilityHint={pluralText(t.available, free, locale)}
                    className={styles.grid()}
                >
                    {slots.map((slot) => {
                        const off = disabled || taken(slot);
                        const checked = range
                            ? slot.value === span?.start || slot.value === span?.end
                            : slot.value === current;
                        const within = range && !checked && !!span?.end && inTimeRange(slot.value, span);
                        const look = timeGrid({ size, checked, inRange: within, taken: taken(slot) });
                        const text = slot.label ?? formatTime(slot.value, locale, { hourCycle });
                        return (
                            <View key={slot.value} className={look.cell()} style={{ width: `${100 / columns}%` }}>
                                <Pressable
                                    role={range ? 'button' : 'radio'}
                                    {...(range ? pressedProps(checked || within) : { 'aria-checked': checked })}
                                    aria-label={text}
                                    disabled={off}
                                    aria-disabled={off || undefined}
                                    className={look.slot()}
                                    onPress={() => pick(slot.value)}
                                    {...(off || range ? {} : toggleOnSpace(() => pick(slot.value)))}
                                >
                                    <Text className={look.slotText()}>{text}</Text>
                                </Pressable>
                            </View>
                        );
                    })}
                </View>
            )}
            {region}
        </View>
    );
}
