import {
    addIsoDays,
    dayStrip,
    fromWallIso,
    localeWeekInfo,
    miniCalendar as miniCalendarRecipe,
    startOfIsoWeekRow,
    todayIso,
    toWallIso,
    type DateLike,
    type DateValueType,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface MiniCalendarProps<T extends string | Date | null = string | null> {
    /** Chosen day (ISO "2026-10-20" or Date) */
    value?: T;
    defaultValue?: T;
    onValueChange?: (value: T) => void;
    /** What onValueChange gets: an ISO string (default) or a Date */
    valueType?: DateValueType;
    /** First day shown at the start (default: the start of the week of the value or today) */
    startDate?: DateLike;
    /** Number of days in the strip */
    days?: number;
    /** Earliest day that can be chosen */
    min?: DateLike;
    /** Latest day that can be chosen */
    max?: DateLike;
    /** Days that cannot be chosen – receives the ISO date */
    isDateUnavailable?: (date: string) => boolean;
    /** First day of the week for the start: 0 = Sunday … 6; default from the locale */
    firstDayOfWeek?: number;
    /** Day names and the spoken dates follow the locale */
    locale?: string;
    /** Name of the strip (default "Days") */
    label?: string;
    disabled?: boolean;
    /** Accessible name instead of `label` */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { day: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof miniCalendarRecipe>;
}

const asDate = (iso: string) => new Date(`${iso}T00:00Z`);

/** Days in a row with arrows to earlier and later days; arrow keys choose a day and move the row on */
export function MiniCalendar<T extends string | Date | null = string | null>({
    value,
    defaultValue,
    onValueChange,
    valueType = 'string',
    startDate,
    days = 7,
    min: minProp,
    max: maxProp,
    isDateUnavailable,
    firstDayOfWeek,
    locale: localeProp,
    label,
    disabled,
    'aria-label': ariaLabel,
    className,
    style,
    classes,
}: MiniCalendarProps<T>) {
    const miniCalendar = useRecipe('miniCalendar', miniCalendarRecipe, classes);
    const styles = miniCalendar();
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const [internal, setInternal] = useState<DateLike | null>(defaultValue ?? null);
    const current = toWallIso(value === undefined ? internal : value, false);
    const today = todayIso();
    const firstDay = firstDayOfWeek ?? localeWeekInfo(locale).firstDay;
    const [start, setStart] = useState(
        () =>
            toWallIso(startDate, false) ??
            (days === 7 ? startOfIsoWeekRow(current ?? today, firstDay) : (current ?? today))
    );
    const min = toWallIso(minProp, false);
    const max = toWallIso(maxProp, false);
    const strip = dayStrip(start, days);
    const unavailable = (iso: string) =>
        !!disabled || (!!min && iso < min) || (!!max && iso > max) || !!isDateUnavailable?.(iso);
    const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    const nameFormat = new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
    const choose = (iso: string) => {
        if (unavailable(iso) || iso === current) return;
        const next = fromWallIso(iso, { valueType });
        setInternal(next);
        onValueChange?.(next as T);
    };
    // One day in the tab order: the chosen one, else today, else the first that can be chosen
    const tabDay =
        [current, today].filter((day): day is string => !!day && strip.includes(day) && !unavailable(day))[0] ??
        strip.find((day) => !unavailable(day));
    const buttons = useRef<Map<string, HTMLButtonElement>>(new Map());
    const focusAfterRender = useRef<string | null>(null);
    useEffect(() => {
        if (!focusAfterRender.current) return;
        buttons.current.get(focusAfterRender.current)?.focus();
        focusAfterRender.current = null;
    });
    // Arrow keys choose the next or previous day (like radio buttons) and move the strip at its ends
    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, iso: string) => {
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        const steps: Record<string, number> = {
            ArrowRight: rtl ? -1 : 1,
            ArrowLeft: rtl ? 1 : -1,
            ArrowDown: 1,
            ArrowUp: -1,
        };
        let target: string | undefined;
        const step = steps[event.key];
        if (step !== undefined) {
            target = iso;
            do target = addIsoDays(target, step);
            while (unavailable(target) && Math.abs(Date.parse(target) - Date.parse(iso)) < 366 * 86_400_000);
            if (unavailable(target)) return;
        } else if (event.key === 'Home') target = strip.find((day) => !unavailable(day));
        else if (event.key === 'End') target = [...strip].reverse().find((day) => !unavailable(day));
        if (!target) return;
        event.preventDefault();
        if (target < start) setStart(target);
        else if (!strip.includes(target)) setStart(addIsoDays(target, 1 - days));
        choose(target);
        focusAfterRender.current = target;
        buttons.current.get(target)?.focus();
    };

    return (
        <div className={styles.base({ class: className })} style={style}>
            <button
                type="button"
                className={styles.nav()}
                aria-label={translations.miniCalendar.previous}
                disabled={disabled || (!!min && addIsoDays(start, -1) < min)}
                onClick={() => setStart(addIsoDays(start, -days))}
            >
                <ChevronLeft className={styles.navIcon()} aria-hidden="true" />
            </button>
            <div
                role="radiogroup"
                className={styles.days()}
                aria-label={label ?? ariaLabel ?? translations.miniCalendar.label}
            >
                {strip.map((day) => (
                    <button
                        key={day}
                        ref={(element) => {
                            if (element) buttons.current.set(day, element);
                            else buttons.current.delete(day);
                        }}
                        type="button"
                        role="radio"
                        className={styles.day()}
                        data-value={day}
                        tabIndex={day === tabDay ? 0 : -1}
                        aria-checked={day === current}
                        aria-label={nameFormat.format(asDate(day))}
                        aria-current={day === today ? 'date' : undefined}
                        aria-disabled={unavailable(day) || undefined}
                        data-today={day === today || undefined}
                        onClick={() => choose(day)}
                        onKeyDown={(event) => onKeyDown(event, day)}
                    >
                        <span className={styles.weekday()} aria-hidden="true">
                            {weekdayFormat.format(asDate(day))}
                        </span>
                        <span className={styles.dayNumber()} aria-hidden="true">
                            {Number(day.slice(8))}
                        </span>
                    </button>
                ))}
            </div>
            <button
                type="button"
                className={styles.nav()}
                aria-label={translations.miniCalendar.next}
                disabled={disabled || (!!max && addIsoDays(start, days) > max)}
                onClick={() => setStart(addIsoDays(start, days))}
            >
                <ChevronRight className={styles.navIcon()} aria-hidden="true" />
            </button>
        </div>
    );
}
