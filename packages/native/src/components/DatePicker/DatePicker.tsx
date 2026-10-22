import {
    calendar,
    fromWallIso,
    todayIso,
    toWallIso,
    type DateLike,
    type DateValueType,
} from '@wirecore/wirelayer-recipes/native';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { useLocale } from '../../locale.js';
import { datePattern, parseDate, toJsDate } from '../../utils/dates.js';
import { PickerTrigger } from '../../utils/PickerTrigger.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { CalendarView, type CalendarDisplayProps } from '../Calendar/Calendar.js';
import { useFieldControl } from '../Field/Field.js';

export interface DatePickerProps<T extends DateLike = string> extends CalendarDisplayProps {
    /** ISO date, e.g. "2026-10-20" (a Date is accepted too) */
    value?: T | null;
    defaultValue?: T | null;
    onValueChange?: (value: T | null) => void;
    /** What onValueChange gets: ISO strings (default) or Date objects */
    valueType?: DateValueType;
    /** Choosing the selected day again clears the field */
    allowDeselect?: boolean;
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

/** The trigger shows the date in the locale's format and opens the calendar in a sheet; a tap on a day picks it */
export function DatePicker<T extends DateLike = string>({
    value,
    defaultValue = null,
    onValueChange,
    valueType = 'string',
    allowDeselect = false,
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
}: DatePickerProps<T>) {
    const { locale, translations } = useLocale();
    const t = translations.datePicker;
    const control = useFieldControl({ invalid, disabled });
    const [selected, setSelected] = useControllable<T | null>(value, defaultValue, onValueChange);
    const [open, setOpen] = useState(false);
    const iso = toWallIso(selected, false, timeZone);
    const date = parseDate(iso);
    const emit = (next: string | null) => setSelected(fromWallIso(next, { valueType }) as T | null);
    const text = date
        ? new Intl.DateTimeFormat(locale, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              timeZone: 'UTC',
          }).format(toJsDate(date))
        : undefined;
    const label = control.label ?? ariaLabel;
    const pick = (next: string | null) => {
        emit(next);
        setOpen(false);
    };

    return (
        <>
            <PickerTrigger
                label={label}
                text={text}
                placeholder={datePattern(locale, t.placeholder())}
                indicator={CalendarDays}
                open={open}
                invalid={control.invalid}
                disabled={control.disabled}
                controlProps={control.props}
                controlId={control.controlId}
                onPress={() => setOpen(true)}
                size={size}
                onClear={clearable ? () => emit(null) : undefined}
                clearLabel={t.clearTrigger}
                className={className}
            />
            <Sheet
                open={open}
                onClose={() => setOpen(false)}
                title={label ?? t.content}
                closeLabel={closeLabel ?? translations.common.close}
                focusClose
                footer={
                    selected && !showButtonBar ? (
                        <Button variant="outline" size="sm" onPress={() => pick(null)}>
                            {t.clearTrigger}
                        </Button>
                    ) : undefined
                }
            >
                <CalendarView
                    className={calendar().sheetBody()}
                    initialMonth={date ?? parseDate(todayIso(timeZone))!}
                    isSelected={(day) => day === iso}
                    onPick={(day) => pick(allowDeselect && day === iso ? null : day)}
                    onToday={pick}
                    onClear={() => pick(null)}
                    showButtonBar={showButtonBar}
                    timeZone={timeZone}
                    {...display}
                />
            </Sheet>
        </>
    );
}
