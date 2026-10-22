import { formatTime, select, timeSlots, timeToSeconds } from '@wirecore/wirelayer-recipes/native';
import { Check, Clock } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Platform, Pressable, Text } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { useFieldControl } from '../Field/Field.js';

/** Start and end time ("09:00" – "17:30") */
export interface TimeRange {
    start: string | null;
    end: string | null;
}

export interface TimeRangePickerProps {
    /** Start and end ("09:00" – "17:30") */
    value?: TimeRange | null;
    defaultValue?: TimeRange | null;
    onValueChange?: (value: TimeRange | null) => void;
    /** Earliest time ("HH:mm") */
    min?: string;
    /** Latest time ("HH:mm") */
    max?: string;
    /** Minutes between the times in the lists (default 30) */
    step?: number;
    /** 12 or 24 hours; default from the locale */
    hourCycle?: 'h12' | 'h23';
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

/** Start and end time in one field ("09:00 – 17:30"): the sheet lists the start times, then the end times after it */
export function TimeRangePicker({
    value,
    defaultValue = null,
    onValueChange,
    min = '00:00',
    max = '23:59',
    step = 30,
    hourCycle,
    disabled,
    invalid,
    size,
    clearable = false,
    'aria-label': ariaLabel,
    closeLabel,
    className,
}: TimeRangePickerProps) {
    const { locale, translations } = useLocale();
    const t = translations.dateRange;
    const control = useFieldControl({ invalid, disabled });
    const [range, setRange] = useControllable(value, defaultValue, onValueChange);
    const [open, setOpen] = useState(false);
    const [start, setStart] = useState<string | null>(null);
    const { announce, region } = useAnnouncer();
    const format = (time: string) => formatTime(time, locale, { hourCycle });
    const label = control.label ?? ariaLabel;
    const all = timeSlots(step, min, max);
    // Step 1: the start; step 2: the times after it
    const times = start ? all.filter((time) => (timeToSeconds(time) ?? 0) > (timeToSeconds(start) ?? 0)) : all;
    const chosen = start ? range?.end : range?.start;
    const styles = select();
    const focusTarget = useRef<ComponentRef<typeof Pressable>>(null);
    const focusIndex = Math.max(times.indexOf(chosen ?? ''), 0);
    const close = () => {
        setOpen(false);
        setStart(null);
    };
    // The end times replace the start times: the focus moves to the first (or chosen) one
    useEffect(() => {
        if (start && Platform.OS === 'web') focusTarget.current?.focus();
    }, [start]);
    const text = range?.start && range.end ? `${format(range.start)} – ${format(range.end)}` : undefined;

    return (
        <>
            <PickerTrigger
                label={label}
                text={text}
                placeholder="--:-- – --:--"
                indicator={Clock}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => setOpen(true)}
                size={size}
                onClear={clearable ? () => setRange(null) : undefined}
                clearLabel={translations.timePicker.clearRange}
                className={className}
            />
            <Sheet
                open={open}
                onClose={close}
                title={`${label ? `${label}: ` : ''}${start ? t.end : t.start}`}
                description={start ? `${t.start}: ${format(start)}` : undefined}
                closeLabel={closeLabel ?? translations.common.close}
                listRole="radiogroup"
                onShow={() => {
                    if (Platform.OS === 'web') focusTarget.current?.focus();
                }}
            >
                {times.map((time, index) => {
                    const checked = time === chosen;
                    return (
                        <Pressable
                            key={time}
                            ref={index === focusIndex ? focusTarget : undefined}
                            role="radio"
                            aria-checked={checked}
                            className={select({ selected: checked }).option()}
                            onPress={() => {
                                if (!start) {
                                    setStart(time);
                                    announce(`${t.start}: ${format(time)}. ${t.end}?`);
                                    return;
                                }
                                setRange({ start, end: time });
                                announce(`${format(start)} – ${format(time)}`);
                                close();
                            }}
                        >
                            <Text className={styles.optionText()}>{format(time)}</Text>
                            {checked && <Icon icon={Check} className={styles.optionCheck()} />}
                        </Pressable>
                    );
                })}
            </Sheet>
            {region}
        </>
    );
}
