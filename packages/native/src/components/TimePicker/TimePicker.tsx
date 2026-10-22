import {
    formatTime,
    select,
    timeSlots,
    timeWithZoneOffset,
    timeZoneLabel,
    todayIso,
    zonedTime,
} from '@wirecore/wirelayer-recipes/native';
import { Check, Clock } from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { useLocale } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldControl } from '../Field/Field.js';

/** A time of the list, optionally named ("12:00 – Noon") */
export interface TimeOption {
    /** "HH:mm" */
    value: string;
    label?: string;
    disabled?: boolean;
}

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
    /** Own times for the list instead of every `step` minutes, optionally named */
    options?: TimeOption[];
    /** Adds seconds to the value ("HH:mm:ss") */
    withSeconds?: boolean;
    /** 12 or 24 hours; default from the locale */
    hourCycle?: 'h12' | 'h23';
    /** IANA zone ("Europe/Berlin"): the list is in the zone, the value gets its offset ("14:30+02:00") */
    timeZone?: string;
    /** Day whose offset applies with timeZone (ISO, default today) */
    referenceDate?: string;
    /** Short zone name after the time ("CEST") */
    showTimeZone?: boolean;
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

/** The trigger opens the times every `step` minutes as radio buttons; 24 or 12 hours follow the locale */
export function TimePicker({
    value,
    defaultValue = null,
    onValueChange,
    min = '00:00',
    max = '23:59',
    step = 30,
    options,
    withSeconds = false,
    hourCycle,
    timeZone,
    referenceDate,
    showTimeZone = false,
    clearable = false,
    size,
    'aria-label': ariaLabel,
    closeLabel,
    disabled,
    invalid,
    className,
}: TimePickerProps) {
    const { locale, translations } = useLocale();
    const control = useFieldControl({ invalid, disabled });
    const [selected, setSelected] = useControllable(value, defaultValue, onValueChange);
    const [open, setOpen] = useState(false);
    const day = referenceDate ?? (timeZone ? todayIso(timeZone) : undefined);
    // The wall time in the zone ("14:30") – the value may carry an offset
    const wall = selected ? (timeZone ? zonedTime(selected, timeZone, day, withSeconds) : selected) : null;
    const format = (time: string) => formatTime(time, locale, { hourCycle, withSeconds });
    const zone = showTimeZone && timeZone ? ` ${timeZoneLabel(timeZone, locale)}` : '';
    const times: { value: string; label?: string; disabled?: boolean }[] =
        options ?? timeSlots(step, min, max, withSeconds).map((time) => ({ value: time }));
    const label = control.label ?? ariaLabel;
    const styles = select();
    const focusTarget = useRef<ComponentRef<typeof Pressable>>(null);
    const focusIndex = Math.max(
        times.findIndex((time) => time.value === wall),
        0
    );
    const emit = (time: string | null) =>
        setSelected(time && timeZone ? timeWithZoneOffset(time, timeZone, day) : time);
    const placeholder = translations.dateInput.placeholder();

    return (
        <>
            <PickerTrigger
                label={label}
                text={wall ? `${format(wall)}${zone}` : undefined}
                placeholder={`${placeholder.hour}:${placeholder.minute}${withSeconds ? `:${placeholder.second}` : ''}`}
                indicator={Clock}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => setOpen(true)}
                size={size}
                onClear={clearable ? () => emit(null) : undefined}
                clearLabel={translations.timePicker.clearTrigger}
                className={className}
            />
            <Sheet
                open={open}
                onClose={() => setOpen(false)}
                title={label ?? translations.timePicker.trigger}
                closeLabel={closeLabel ?? translations.common.close}
                listRole="radiogroup"
                onShow={() => {
                    if (Platform.OS === 'web') focusTarget.current?.focus();
                }}
            >
                {times.map((time, index) => {
                    const checked = time.value === wall;
                    return (
                        <Pressable
                            key={time.value}
                            ref={index === focusIndex ? focusTarget : undefined}
                            role="radio"
                            aria-checked={checked}
                            disabled={time.disabled}
                            aria-disabled={time.disabled || undefined}
                            className={select({ selected: checked }).option()}
                            onPress={() => {
                                emit(time.value);
                                setOpen(false);
                            }}
                        >
                            <Text className={styles.optionText()}>
                                {time.label ? `${format(time.value)} – ${time.label}` : format(time.value)}
                            </Text>
                            {checked && <Icon icon={Check} className={styles.optionCheck()} />}
                        </Pressable>
                    );
                })}
            </Sheet>
        </>
    );
}
