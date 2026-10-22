import {
    addDays,
    parseLocal,
    pluralText,
    scheduler as schedulerRecipe,
    toIsoDate,
    visibleDays,
    type PluralForms,
} from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

export interface SchedulerYearProps {
    year: number;
    /** Current date of the Scheduler (ISO) – the day in the tab order when it lies in the year */
    date: string;
    /** Number of events per day */
    counts: Map<string, number>;
    /** Today (ISO), null on the server */
    today: string | null;
    weekStartsOn: number;
    locale: string;
    rtl: boolean;
    headingLevel: number;
    eventCount: PluralForms;
    styles: ReturnType<typeof schedulerRecipe>;
    onOpen: (day: Date) => void;
    onMonth: (day: Date) => void;
}

/**
 * Year view of the Scheduler: twelve small months, days with events marked (dot, bold and in the name); one day is in
 * the tab order, the arrow keys move between days (Page Up/Down: months), Enter opens the day
 */
export function SchedulerYear({
    year,
    date,
    counts,
    today,
    weekStartsOn,
    locale,
    rtl,
    headingLevel,
    eventCount,
    styles,
    onOpen,
    onMonth,
}: SchedulerYearProps) {
    const format = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, options);
    const months = Array.from({ length: 12 }, (_, month) => {
        const first = new Date(year, month, 1);
        const days = visibleDays('month', first, weekStartsOn);
        return {
            first,
            name: format({ month: 'long' }).format(first),
            weeks: Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
        };
    });
    const weekdays = visibleDays('week', new Date(year, 0, 4), weekStartsOn).map((day) =>
        format({ weekday: 'narrow' }).format(day)
    );
    const inYear = (iso: string) => iso.startsWith(`${year}-`);
    const start = inYear(date) ? date : `${year}-01-01`;
    const [active, setActive] = useState(start);
    // A new year or date of the Scheduler puts its day into the tab order
    const [shown, setShown] = useState(start);
    if (shown !== start) {
        setShown(start);
        setActive(start);
    }
    const label = (day: Date) => {
        const count = counts.get(toIsoDate(day)) ?? 0;
        const text = format({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(day);
        return count ? `${text}, ${pluralText(eventCount, count, locale)}` : text;
    };

    const root = useRef<HTMLDivElement>(null);
    // The day to focus after a key (an object, so the same day again focuses again)
    const [focusNext, setFocusNext] = useState<{ iso: string } | null>(null);
    useEffect(() => {
        if (focusNext) root.current?.querySelector<HTMLElement>(`[data-date="${focusNext.iso}"]`)?.focus();
    }, [focusNext]);
    const onKey = (day: Date, key: KeyboardEvent) => {
        const step = rtl ? -1 : 1;
        const moves: Record<string, () => Date> = {
            ArrowLeft: () => addDays(day, -step),
            ArrowRight: () => addDays(day, step),
            ArrowUp: () => addDays(day, -7),
            ArrowDown: () => addDays(day, 7),
            PageUp: () => new Date(day.getFullYear(), day.getMonth() - 1, Math.min(day.getDate(), 28)),
            PageDown: () => new Date(day.getFullYear(), day.getMonth() + 1, Math.min(day.getDate(), 28)),
            Home: () => new Date(day.getFullYear(), day.getMonth(), 1),
            End: () => new Date(day.getFullYear(), day.getMonth() + 1, 0),
        };
        const move = moves[key.key];
        if (!move) return;
        key.preventDefault();
        const next = toIsoDate(move());
        if (!inYear(next)) return;
        setActive(next);
        setFocusNext({ iso: next });
    };
    const Heading = `h${headingLevel}` as 'h3';

    return (
        <div ref={root} className={styles.year()}>
            {months.map((month) => (
                <section key={month.first.getMonth()} className={styles.yearMonth()}>
                    <Heading>
                        <button type="button" className={styles.yearMonthTitle()} onClick={() => onMonth(month.first)}>
                            {month.name}
                        </button>
                    </Heading>
                    <table
                        className={styles.yearTable()}
                        aria-label={format({ month: 'long', year: 'numeric' }).format(month.first)}
                    >
                        <thead>
                            <tr>
                                {weekdays.map((weekday, index) => (
                                    <th key={index} scope="col" className={styles.yearHead()}>
                                        {weekday}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {month.weeks.map((week) => (
                                <tr key={week[0]!.getTime()}>
                                    {week.map((day) => {
                                        const iso = toIsoDate(day);
                                        return (
                                            <td key={day.getTime()} className={styles.yearCell()}>
                                                {day.getMonth() === month.first.getMonth() && (
                                                    <button
                                                        type="button"
                                                        className={styles.yearDay()}
                                                        data-date={iso}
                                                        data-marked={counts.has(iso) || undefined}
                                                        tabIndex={iso === active ? 0 : -1}
                                                        aria-label={label(day)}
                                                        aria-current={iso === today ? 'date' : undefined}
                                                        onClick={() => onOpen(parseLocal(iso))}
                                                        onFocus={() => setActive(iso)}
                                                        onKeyDown={(key) => onKey(day, key)}
                                                    >
                                                        {day.getDate()}
                                                        {counts.has(iso) && (
                                                            <span className={styles.yearMark()} aria-hidden="true" />
                                                        )}
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            ))}
        </div>
    );
}
