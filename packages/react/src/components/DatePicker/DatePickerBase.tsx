import { DateInput as ArkDateInput } from '@ark-ui/react/date-input';
import {
    DatePicker as ArkDatePicker,
    useDatePickerContext,
    type DateValue,
    type UseDatePickerContext,
} from '@ark-ui/react/date-picker';
import { useFieldContext } from '@ark-ui/react/field';
import { Portal } from '@ark-ui/react/portal';
import { DateFormatter } from '@internationalized/date';
import {
    datePicker as datePickerRecipe,
    isoWeekday,
    localeWeekInfo,
    parsePastedDate,
    parsePastedRange,
    pluralText,
    rowWeekNumber,
    timeZoneLabel,
    timeZoneLongLabel,
    todayIso,
    zonedToInstant,
    type CalendarDayState,
    type RecipeClasses,
    type Translations,
} from '@wirecore/wirelayer-recipes';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
    Fragment,
    useEffect,
    useId,
    useState,
    type ClipboardEvent,
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type ReactNode,
} from 'react';
import { fromIso, withTimeOf } from './dates.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

// Shared by DatePicker, DateRangePicker and TimePicker – not exported from the package

/** Own content of a day in the calendar (React counterpart of the Vue `day` slot) */
export type RenderDay = (date: string, state: CalendarDayState) => ReactNode;

/** Calendar options shared by DatePicker, DateRangePicker and Calendar */
export interface CalendarViewOptions {
    showWeekNumbers?: boolean;
    numberOfMonths?: number;
    showButtonBar?: boolean;
    /** highlightToday false: today without its own style */
    plainToday?: boolean;
    hideOutsideDays?: boolean;
    weekendDays?: readonly number[];
    allowDeselect?: boolean;
    /** "Today" in this zone */
    timeZone?: string;
    renderDay?: RenderDay;
}

export interface DatePickerBaseProps extends CalendarViewOptions {
    mode: 'single' | 'range' | 'multiple';
    dates: DateValue[];
    onChange: (dates: DateValue[]) => void;
    withTime: boolean;
    min?: DateValue;
    max?: DateValue;
    isDateUnavailable?: (date: DateValue) => boolean;
    locale: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    label?: string;
    className?: string;
    style?: CSSProperties;
    classes?: RecipeClasses<typeof datePickerRecipe>;
    /** Month and year only (MonthPicker) or the year only (YearPicker) */
    period?: 'month' | 'year';
    /** Range presets below the calendar */
    presets?: readonly CalendarPreset[];
    size?: 'sm' | 'md' | 'lg';
    /** clearable false: no clear button */
    hideClear?: boolean;
    /** 0 = Sunday … 6; default from the locale */
    firstDayOfWeek?: number;
    showTimeZone?: boolean;
    responsive?: boolean;
}

/**
 * Date field: type the digits one after another ("20102026") – each part jumps to the next and the separators
 * come from the locale – or pick from the calendar (arrow keys, Page Up/Down, Home/End).
 * A range has two dates (start – end), with time each date gets hour and minute.
 */
export function DatePickerBase({
    mode,
    dates,
    onChange,
    withTime,
    min,
    max,
    isDateUnavailable,
    locale,
    disabled,
    readOnly,
    invalid,
    required,
    name,
    label,
    className,
    style,
    period,
    classes,
    presets,
    size,
    hideClear,
    firstDayOfWeek,
    timeZone,
    showTimeZone,
    responsive,
    ...calendar
}: DatePickerBaseProps) {
    const datePicker = useRecipe('datePicker', datePickerRecipe, classes);
    const styles = datePicker({ size });
    const translations = useTranslations();
    const id = useId();
    // Ark connects the other inputs to a surrounding Field itself, these not: label, state, description
    const field = useFieldContext();
    const state = {
        disabled: disabled ?? field?.disabled,
        readOnly: readOnly ?? field?.readOnly,
        invalid: invalid ?? field?.invalid,
        required: required ?? field?.required,
    };
    const range = mode === 'range';
    const multiple = mode === 'multiple';
    const groups = range ? [0, 1] : [0];
    const rangeNames = [translations.dateRange.start, translations.dateRange.end];
    // The field label names the date; in a range followed by "Start"/"End"
    const ids = field
        ? { label: (index: number) => (range ? `${field.ids.label} ${id}r${index}` : field.ids.label) }
        : undefined;
    const groupLabel = (index: number) =>
        field ? undefined : range ? [label, rangeNames[index]].filter(Boolean).join(', ') : label;
    const calendarTranslations = range
        ? { ...translations.datePicker, clearTrigger: translations.dateRange.clearTrigger }
        : translations.datePicker;
    // MonthPicker and YearPicker: the field has month and year (or the year) only, the calendar starts (and stops)
    // at the months (years)
    const periodFormatter = period
        ? new DateFormatter(locale, period === 'month' ? { month: '2-digit', year: 'numeric' } : { year: 'numeric' })
        : undefined;
    const startOfWeek = firstDayOfWeek ?? localeWeekInfo(locale).firstDay;
    // Zone label after the time: short name visible, long name for screen readers
    let zone: { short: string; long: string } | undefined;
    if (showTimeZone && timeZone) {
        const date = dates[0];
        const instant = date ? zonedToInstant(date.toString().slice(0, 16), timeZone) : new Date();
        zone = {
            short: timeZoneLabel(timeZone, locale, instant),
            long: translations.calendar.timeZone(timeZoneLongLabel(timeZone, locale, instant)),
        };
    }
    const describedby = [field?.ariaDescribedby, zone ? `${id}tz` : undefined].filter(Boolean).join(' ') || undefined;
    // A day picked in the calendar keeps the time already typed
    const fromCalendar = (next: DateValue[]) =>
        onChange(withTime ? next.map((day, index) => withTimeOf(day, dates[index])) : next);
    // Pasting "20.10.2026", "2026-10-20" or "20.10.2026 – 24.10.2026" fills the field (Ark itself reads ISO only)
    const pasteText = (text: string, index: number) => {
        if (period) return false;
        if (range) {
            const both = parsePastedRange(text, locale, withTime);
            if (both) {
                onChange([fromIso(both.start, withTime), fromIso(both.end, withTime)]);
                return true;
            }
        }
        const iso = parsePastedDate(text, locale, withTime);
        if (!iso) return false;
        const next = [...dates];
        next[index] = fromIso(iso, withTime);
        onChange(next.filter(Boolean));
        return true;
    };
    // Several dates (selectionMode multiple): the field shows them as text
    const multipleText = !dates.length
        ? translations.calendar.noDates
        : dates.length > 3
          ? pluralText(translations.calendar.datesSelected, dates.length, locale)
          : dates
                .map((date) =>
                    new DateFormatter(locale, {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        timeZone: 'UTC',
                    }).format(date.toDate('UTC'))
                )
                .join(', ');

    return (
        <ArkDatePicker.Root
            className={styles.base({ class: className })}
            style={style}
            value={dates}
            onValueChange={(details) => fromCalendar(details.value)}
            selectionMode={mode}
            min={min}
            max={max}
            isDateUnavailable={isDateUnavailable}
            locale={locale}
            startOfWeek={startOfWeek}
            minView={period}
            defaultView={period}
            numOfMonths={calendar.numberOfMonths}
            timeZone={timeZone}
            {...state}
            positioning={{ placement: 'bottom-start', gutter: 4 }}
            translations={calendarTranslations}
            lazyMount
            unmountOnExit
        >
            <ArkDatePicker.Control className={styles.control()}>
                {multiple ? (
                    <>
                        <span
                            id={`${id}v`}
                            className={styles.multiValue()}
                            data-placeholder={dates.length ? undefined : ''}
                        >
                            {multipleText}
                        </span>
                        {name &&
                            dates.map((date, index) => (
                                <input
                                    key={date.toString()}
                                    type="hidden"
                                    name={`${name}[${index}]`}
                                    value={date.toString()}
                                />
                            ))}
                    </>
                ) : (
                    <ArkDateInput.Root
                        className={styles.dateInput()}
                        ids={ids}
                        value={dates}
                        onValueChange={(details) => onChange(details.value)}
                        selectionMode={range ? 'range' : 'single'}
                        granularity={withTime ? 'minute' : 'day'}
                        formatter={periodFormatter}
                        min={min}
                        max={max}
                        isDateUnavailable={isDateUnavailable}
                        locale={locale}
                        shouldForceLeadingZeros
                        name={name}
                        {...state}
                        translations={translations.dateInput}
                    >
                        <ArkDateInput.Control className={styles.dateControl()}>
                            {groups.map((index) => (
                                <Fragment key={index}>
                                    {index === 1 && (
                                        <span className={styles.rangeSeparator()} aria-hidden="true">
                                            –
                                        </span>
                                    )}
                                    {range && field && (
                                        <span id={`${id}r${index}`} className={styles.rangeLabel()}>
                                            {rangeNames[index]}
                                        </span>
                                    )}
                                    <DateSegments
                                        index={index}
                                        label={groupLabel(index)}
                                        describedby={describedby}
                                        paste={period ? undefined : pasteText}
                                        size={size}
                                    />
                                </Fragment>
                            ))}
                        </ArkDateInput.Control>
                        {groups.map((index) => (
                            <ArkDateInput.HiddenInput key={index} index={index} />
                        ))}
                    </ArkDateInput.Root>
                )}
                {zone && (
                    <>
                        <span className={styles.timeZone()} aria-hidden="true">
                            {zone.short}
                        </span>
                        <span id={`${id}tz`} hidden>
                            {zone.long}
                        </span>
                    </>
                )}
                {!hideClear && (
                    <ArkDatePicker.ClearTrigger className={styles.clear()}>
                        <X className={styles.clearIcon()} aria-hidden="true" />
                    </ArkDatePicker.ClearTrigger>
                )}
                <ArkDatePicker.Trigger
                    className={styles.trigger()}
                    {...(multiple ? { 'aria-describedby': `${id}v` } : {})}
                >
                    <CalendarDays className={styles.triggerIcon()} aria-hidden="true" />
                </ArkDatePicker.Trigger>
            </ArkDatePicker.Control>
            <Calendar presets={presets} responsive={responsive} timeZone={timeZone} {...calendar} />
        </ArkDatePicker.Root>
    );
}

/** One date of the field as spin buttons per part; Ark names the parts in English ("day") */
export function DateSegments({
    index,
    label,
    describedby,
    paste,
    size,
}: {
    index: number;
    label?: string;
    describedby?: string;
    /** Own reading of pasted text – true when it was a date (Ark then does nothing) */
    paste?: (text: string, index: number) => boolean;
    size?: 'sm' | 'md' | 'lg';
}) {
    const datePicker = useRecipe('datePicker', datePickerRecipe);
    const styles = datePicker({ size });
    const translations = useTranslations();
    const onPaste = (event: ClipboardEvent) => {
        if (!paste?.(event.clipboardData.getData('text/plain'), index)) return;
        event.preventDefault();
        event.stopPropagation();
    };
    return (
        <ArkDateInput.SegmentGroup
            index={index}
            className={styles.segments()}
            aria-label={label}
            aria-describedby={describedby}
            {...(paste ? { onPasteCapture: onPaste } : {})}
        >
            <ArkDateInput.Context>
                {(api) =>
                    api
                        .getSegments({ index })
                        .map((segment, position) => (
                            <ArkDateInput.Segment
                                key={position}
                                segment={segment}
                                className={styles.segment()}
                                aria-label={translations.dateSegments[segment.type]}
                            />
                        ))
                }
            </ArkDateInput.Context>
        </ArkDateInput.SegmentGroup>
    );
}

/** responsive: true while the screen is narrow (decided in the browser only) */
function useNarrow(enabled: boolean | undefined) {
    const [narrow, setNarrow] = useState(false);
    useEffect(() => {
        if (!enabled || typeof window.matchMedia !== 'function') return;
        const query = window.matchMedia('(max-width: 639.98px)');
        const update = () => setNarrow(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, [enabled]);
    return narrow;
}

/** Calendar popup; with `responsive` a sheet at the bottom on narrow screens */
function Calendar({
    presets,
    responsive,
    ...options
}: { presets?: readonly CalendarPreset[]; responsive?: boolean } & CalendarViewOptions) {
    const datePicker = useRecipe('datePicker', datePickerRecipe);
    const styles = datePicker();
    const narrow = useNarrow(responsive);
    const multiMonth = (options.numberOfMonths ?? 1) > 1;
    if (narrow) {
        return (
            <Portal>
                <ArkDatePicker.Context>
                    {(api) => (api.open ? <div className={styles.backdrop()} aria-hidden="true" /> : null)}
                </ArkDatePicker.Context>
                <div className={styles.sheet()}>
                    <ArkDatePicker.Content className={datePicker({ multiMonth, bottomSheet: true }).content()}>
                        <CalendarViews presets={presets} {...options} />
                    </ArkDatePicker.Content>
                </div>
            </Portal>
        );
    }
    return (
        <Portal>
            <ArkDatePicker.Positioner>
                <ArkDatePicker.Content className={multiMonth ? datePicker({ multiMonth }).content() : styles.content()}>
                    <CalendarViews presets={presets} {...options} />
                </ArkDatePicker.Content>
            </ArkDatePicker.Positioner>
        </Portal>
    );
}

/** A named range ("Last 7 days"): one of Ark's presets or own dates */
export type CalendarPreset = string | { label: string; value: DateValue[] };
const presetLabel = (preset: CalendarPreset, t: Translations) =>
    typeof preset === 'string' ? (t.rangePresets[preset] ?? preset) : preset.label;

type Api = UseDatePickerContext;

/** Day, month and year views (arrow keys, Page Up/Down, Home/End), optional range presets below */
export function CalendarViews({
    presets,
    showWeekNumbers,
    numberOfMonths,
    showButtonBar,
    plainToday,
    hideOutsideDays,
    weekendDays,
    allowDeselect,
    timeZone,
    renderDay,
}: { presets?: readonly CalendarPreset[] } & CalendarViewOptions) {
    const datePicker = useRecipe('datePicker', datePickerRecipe);
    const styles = datePicker();
    const translations = useTranslations();
    const months = Math.max(1, Math.floor(numberOfMonths ?? 1));
    const tableOptions = {
        showWeekNumbers,
        plainToday,
        // Several months: the days of the neighbour months would show twice
        hideOutsideDays: hideOutsideDays || months > 1,
        weekendDays,
        allowDeselect,
        renderDay,
    };
    // Several months side by side: each table gets its own month as visible range
    const monthTables = (api: Api) =>
        Array.from({ length: months }, (_, index) => {
            const offset = api.getOffset({ months: index });
            const start = api.visibleRange.start.add({ months: index });
            return {
                title: offset.visibleRangeText.start,
                weeks: offset.weeks,
                visibleRange: { start, end: start.add({ months: 1 }).subtract({ days: 1 }) },
            };
        });
    // "Today": picks today (one date) or shows it (range, several dates)
    const today = (api: Api) => {
        if (api.selectionMode === 'single') return api.selectToday();
        const [year = 0, month = 1, day = 1] = todayIso(timeZone).split('-').map(Number);
        api.setFocusedValue(api.focusedValue.set({ year, month, day }));
    };
    return (
        <>
            <ArkDatePicker.View view="day">
                <ArkDatePicker.Context>
                    {(api) => (
                        <>
                            <Header />
                            {months > 1 ? (
                                <div className={styles.months()}>
                                    {monthTables(api).map((month) => (
                                        <div key={month.title} className={styles.month()}>
                                            <div className={styles.monthTitle()}>{month.title}</div>
                                            <DayTable
                                                weeks={month.weeks}
                                                visibleRange={month.visibleRange}
                                                {...tableOptions}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <DayTable weeks={api.weeks} {...tableOptions} />
                            )}
                        </>
                    )}
                </ArkDatePicker.Context>
            </ArkDatePicker.View>
            <ArkDatePicker.View view="month">
                <ArkDatePicker.Context>
                    {(api) => (
                        <>
                            <Header />
                            <ArkDatePicker.Table className={styles.table()}>
                                <ArkDatePicker.TableBody>
                                    {api.getMonthsGrid({ columns: 4, format: 'short' }).map((months) => (
                                        <ArkDatePicker.TableRow key={months[0]?.value}>
                                            {months.map((month) => (
                                                <ArkDatePicker.TableCell
                                                    key={month.value}
                                                    value={month.value}
                                                    className={styles.cell()}
                                                >
                                                    <ArkDatePicker.TableCellTrigger className={styles.period()}>
                                                        {month.label}
                                                    </ArkDatePicker.TableCellTrigger>
                                                </ArkDatePicker.TableCell>
                                            ))}
                                        </ArkDatePicker.TableRow>
                                    ))}
                                </ArkDatePicker.TableBody>
                            </ArkDatePicker.Table>
                        </>
                    )}
                </ArkDatePicker.Context>
            </ArkDatePicker.View>
            <ArkDatePicker.View view="year">
                <ArkDatePicker.Context>
                    {(api) => (
                        <>
                            <Header />
                            <ArkDatePicker.Table className={styles.table()}>
                                <ArkDatePicker.TableBody>
                                    {api.getYearsGrid({ columns: 4 }).map((years) => (
                                        <ArkDatePicker.TableRow key={years[0]?.value}>
                                            {years.map((year) => (
                                                <ArkDatePicker.TableCell
                                                    key={year.value}
                                                    value={year.value}
                                                    className={styles.cell()}
                                                >
                                                    <ArkDatePicker.TableCellTrigger className={styles.period()}>
                                                        {year.label}
                                                    </ArkDatePicker.TableCellTrigger>
                                                </ArkDatePicker.TableCell>
                                            ))}
                                        </ArkDatePicker.TableRow>
                                    ))}
                                </ArkDatePicker.TableBody>
                            </ArkDatePicker.Table>
                        </>
                    )}
                </ArkDatePicker.Context>
            </ArkDatePicker.View>

            {presets?.length ? (
                <div className={styles.presets()}>
                    {presets.map((preset) => (
                        <ArkDatePicker.PresetTrigger
                            key={presetLabel(preset, translations)}
                            value={typeof preset === 'string' ? (preset as never) : preset.value}
                            className={styles.preset()}
                            aria-label={presetLabel(preset, translations)}
                        >
                            {presetLabel(preset, translations)}
                        </ArkDatePicker.PresetTrigger>
                    ))}
                </div>
            ) : null}
            {showButtonBar && (
                <ArkDatePicker.Context>
                    {(api) => (
                        <div className={styles.buttonBar()}>
                            <button type="button" className={styles.buttonBarButton()} onClick={() => today(api)}>
                                {translations.calendar.today}
                            </button>
                            <button
                                type="button"
                                className={styles.buttonBarButton()}
                                disabled={!api.value.length}
                                onClick={() => api.clearValue({ focus: false })}
                            >
                                {translations.calendar.clear}
                            </button>
                        </div>
                    )}
                </ArkDatePicker.Context>
            )}
        </>
    );
}

const isoOf = (day: DateValue) => day.toString().slice(0, 10);

/** The days of one month as grid: optional week numbers, own day content, deselecting the chosen day */
function DayTable({
    weeks,
    visibleRange,
    showWeekNumbers,
    plainToday,
    hideOutsideDays,
    weekendDays,
    allowDeselect,
    renderDay,
}: {
    weeks: DateValue[][];
    /** The month of this table when several are shown – days outside it are outside days */
    visibleRange?: { start: DateValue; end: DateValue };
    showWeekNumbers?: boolean;
    plainToday?: boolean;
    hideOutsideDays?: boolean;
    weekendDays?: readonly number[];
    allowDeselect?: boolean;
    renderDay?: RenderDay;
}) {
    const datePicker = useRecipe('datePicker', datePickerRecipe);
    const styles = datePicker({ plainToday, hideOutsideDays });
    const translations = useTranslations();
    const api = useDatePickerContext();
    const weekNumber = (week: DateValue[]) => rowWeekNumber(week.map(isoOf));
    const outsideMonth = (day: DateValue) =>
        !!visibleRange && (day.month !== visibleRange.start.month || day.year !== visibleRange.start.year);
    const stateOf = (day: DateValue): CalendarDayState => {
        const state = api.getDayTableCellState({ value: day, visibleRange });
        return {
            day: day.day,
            today: state.today,
            selected: state.selected,
            outside: state.outsideRange,
            unavailable: state.unavailable || !!state.disabled,
            weekend: weekendDays ? weekendDays.includes(isoWeekday(isoOf(day))) : state.weekend,
        };
    };
    // allowDeselect: the chosen day again (click, Enter, Space) clears a single date
    const deselect = (event: MouseEvent | KeyboardEvent, day: DateValue) => {
        if ('key' in event && event.key !== 'Enter' && event.key !== ' ') return;
        if (api.selectionMode !== 'single' || !api.getDayTableCellState({ value: day, visibleRange }).selected) return;
        event.preventDefault();
        api.clearValue({ focus: false });
    };
    // On the cell, before Ark's own handlers (capture): own weekend days and deselecting. Nothing extra on the
    // default calendar – same DOM and handlers as before
    const cellProps = (day: DateValue) => ({
        ...(weekendDays?.includes(isoWeekday(isoOf(day))) ? { 'data-weekend': '' } : {}),
        ...(allowDeselect
            ? {
                  onClickCapture: (event: MouseEvent) => deselect(event, day),
                  onKeyDownCapture: (event: KeyboardEvent) => deselect(event, day),
              }
            : {}),
    });
    return (
        <ArkDatePicker.Table className={styles.table()}>
            <ArkDatePicker.TableHead>
                <ArkDatePicker.TableRow>
                    {showWeekNumbers && (
                        <th scope="col" className={styles.weekNumberHeader()}>
                            <abbr title={translations.datePicker.weekColumnHeader}>
                                {translations.datePicker.weekColumnShort}
                            </abbr>
                        </th>
                    )}
                    {api.weekDays.map((day) => (
                        <ArkDatePicker.TableHeader key={day.long} className={styles.columnHeader()}>
                            <abbr title={day.long}>{day.short}</abbr>
                        </ArkDatePicker.TableHeader>
                    ))}
                </ArkDatePicker.TableRow>
            </ArkDatePicker.TableHead>
            <ArkDatePicker.TableBody>
                {weeks.map((week) => (
                    <ArkDatePicker.TableRow key={week[0]?.toString()}>
                        {showWeekNumbers && (
                            <th
                                scope="row"
                                className={styles.weekNumber()}
                                aria-label={translations.datePicker.weekNumberCell(weekNumber(week))}
                            >
                                {weekNumber(week)}
                            </th>
                        )}
                        {week.map((day) =>
                            // Several months: a day of the neighbour month is shown in that month only (unique ids)
                            outsideMonth(day) ? (
                                <td key={day.toString()} className={styles.cell()} />
                            ) : (
                                <ArkDatePicker.TableCell
                                    key={day.toString()}
                                    value={day}
                                    visibleRange={visibleRange}
                                    className={styles.cell()}
                                    {...cellProps(day)}
                                >
                                    <ArkDatePicker.TableCellTrigger className={styles.day()}>
                                        {renderDay ? (
                                            <span className={styles.dayContent()}>
                                                {renderDay(isoOf(day), stateOf(day))}
                                            </span>
                                        ) : (
                                            day.day
                                        )}
                                    </ArkDatePicker.TableCellTrigger>
                                </ArkDatePicker.TableCell>
                            )
                        )}
                    </ArkDatePicker.TableRow>
                ))}
            </ArkDatePicker.TableBody>
        </ArkDatePicker.Table>
    );
}

// The button shows "October 2026" – its name has to contain that text too (WCAG 2.5.3)
const nextView = { day: 'month', month: 'year', year: undefined } as const;
const viewName = (text: string, view: 'day' | 'month' | 'year', t: Translations) =>
    `${text}, ${t.datePicker.viewTrigger(view, nextView[view])}`;

/** Previous / view switch ("October 2026") / next */
function Header() {
    const datePicker = useRecipe('datePicker', datePickerRecipe);
    const styles = datePicker();
    const translations = useTranslations();
    return (
        <ArkDatePicker.ViewControl className={styles.header()}>
            <ArkDatePicker.PrevTrigger className={styles.nav()}>
                <ChevronLeft className={styles.navIcon()} aria-hidden="true" />
            </ArkDatePicker.PrevTrigger>
            <ArkDatePicker.Context>
                {(api) => (
                    <ArkDatePicker.ViewTrigger
                        className={styles.viewTrigger()}
                        aria-label={viewName(
                            api.numOfMonths > 1 && api.view === 'day'
                                ? api.visibleRangeText.formatted
                                : api.visibleRangeText.start,
                            api.view,
                            translations
                        )}
                    >
                        <ArkDatePicker.RangeText />
                    </ArkDatePicker.ViewTrigger>
                )}
            </ArkDatePicker.Context>
            <ArkDatePicker.NextTrigger className={styles.nav()}>
                <ChevronRight className={styles.navIcon()} aria-hidden="true" />
            </ArkDatePicker.NextTrigger>
        </ArkDatePicker.ViewControl>
    );
}
