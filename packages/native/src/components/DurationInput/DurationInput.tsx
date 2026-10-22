import {
    durationInput,
    durationToParts,
    durationUnit,
    formatDuration,
    input,
    partsToDuration,
    type DurationParts,
    type DurationValueType,
} from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocale } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldControl } from '../Field/Field.js';

export interface DurationInputProps {
    /** Total minutes (default), total seconds or ISO 8601 ("PT2H30M") – see valueType */
    value?: number | string | null;
    defaultValue?: number | string | null;
    onValueChange?: (value: number | string | null) => void;
    /** What onValueChange gets: total minutes, total seconds or an ISO 8601 duration */
    valueType?: DurationValueType;
    /** Adds days before the hours (the hours then stop at 23) */
    withDays?: boolean;
    /** Adds seconds after the minutes */
    withSeconds?: boolean;
    /** Highest number of hours (default 999, with days 23) */
    maxHours?: number;
    disabled?: boolean;
    invalid?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** Clear button in the field while it has a value */
    clearable?: boolean;
    /** Accessible name without a surrounding Field */
    'aria-label'?: string;
    className?: string;
}

type Unit = 'days' | 'hours' | 'minutes' | 'seconds';
const units: Record<Unit, 'day' | 'hour' | 'minute' | 'second'> = {
    days: 'day',
    hours: 'hour',
    minutes: 'minute',
    seconds: 'second',
};

/**
 * Duration as one number field per unit (hours and minutes, optionally days and seconds) with the number pad; the
 * whole duration is read as description ("2 hours 30 minutes").
 */
export function DurationInput({
    value,
    defaultValue = null,
    onValueChange,
    valueType = 'minutes',
    withDays = false,
    withSeconds = false,
    maxHours,
    disabled,
    invalid,
    size,
    clearable = false,
    'aria-label': ariaLabel,
    className,
}: DurationInputProps) {
    const { locale, translations } = useLocale();
    const t = translations.durationInput;
    const control = useFieldControl({ invalid, disabled });
    const [current, setCurrent] = useControllable(value, defaultValue, onValueChange);
    const parts = durationToParts(current, valueType, withDays);
    const [focused, setFocused] = useState<Unit | null>(null);
    const styles = durationInput({ size, focused: !!focused, invalid: control.invalid, disabled: control.disabled });
    const field = input();
    const limits: Record<Unit, number> = {
        days: 999,
        hours: maxHours ?? (withDays ? 23 : 999),
        minutes: 59,
        seconds: 59,
    };
    const shown: Unit[] = [
        ...(withDays ? ['days' as const] : []),
        'hours',
        'minutes',
        ...(withSeconds ? ['seconds' as const] : []),
    ];
    const spoken = parts ? formatDuration(parts, locale) : undefined;
    const label = control.label ?? ariaLabel;
    const set = (unit: Unit, text: string) => {
        const digits = text.replace(/\D/g, '');
        const base: DurationParts = parts ?? { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const next = { ...base, [unit]: Math.min(limits[unit], Number(digits || 0)) };
        const empty = !digits && shown.every((entry) => entry === unit || !base[entry]);
        setCurrent(empty ? null : partsToDuration(next, valueType));
    };

    return (
        <View
            role="group"
            aria-label={label}
            accessibilityHint={[control.description, spoken].filter(Boolean).join('. ') || undefined}
            className={styles.base({ class: className })}
        >
            {shown.map((unit) => (
                <View key={unit} className={styles.part()}>
                    <TextInput
                        value={parts ? String(parts[unit]) : ''}
                        placeholder="0"
                        aria-label={label ? `${label}, ${t[unit]}` : t[unit]}
                        {...({ 'aria-invalid': control.invalid || undefined } as object)}
                        keyboardType="number-pad"
                        inputMode="numeric"
                        maxLength={3}
                        selectTextOnFocus
                        editable={!control.disabled}
                        aria-disabled={control.disabled || undefined}
                        className={styles.control()}
                        onChangeText={(text) => set(unit, text)}
                        onFocus={() => setFocused(unit)}
                        onBlur={() => setFocused(null)}
                    />
                    <Text className={styles.unit()} aria-hidden>
                        {durationUnit(2, units[unit], locale, 'short')}
                    </Text>
                </View>
            ))}
            <View className={styles.spacer()} />
            {clearable && parts && !control.disabled && (
                <Pressable
                    role="button"
                    aria-label={t.clearTrigger}
                    className={field.clear()}
                    onPress={() => setCurrent(null)}
                >
                    <Icon icon={X} className={field.clearIcon()} />
                </Pressable>
            )}
        </View>
    );
}
