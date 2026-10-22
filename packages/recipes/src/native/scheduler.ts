import { pressable, tv } from './tv.js';

// Scheduler and Gantt for React Native (RN part 3): agenda, time grid (day, 3-day week), compact month and the task
// list of the Gantt chart with bars in percent of the whole period

export const scheduler = tv({
    slots: {
        base: 'w-full overflow-hidden rounded-card border border-line bg-card',
        toolbar: 'gap-2 border-b border-line px-3 py-2.5',
        toolbarRow: 'flex-row flex-wrap items-center gap-2',
        title: 'min-w-0 flex-1 font-sans-semibold text-base text-fg',
        nav: 'flex-row items-center gap-1',
        filter: 'min-w-40 flex-1',
        loadingBar: 'h-0.5 bg-primary',
        alert: 'flex-row flex-wrap items-center gap-2 border-b border-line bg-danger/10 px-3 py-2',
        alertText: 'min-w-0 flex-1 font-sans text-sm text-danger',
        empty: 'px-3 py-10 text-center font-sans text-sm text-muted',
        // Agenda: a heading per day, the events below
        agendaHeading: 'border-b border-line bg-bg-2 px-3 py-1.5 font-sans-semibold text-xs text-fg',
        agendaItem: 'border-b border-line',
        agendaEvent: ['min-h-11 flex-row items-center gap-3 border-l-[3px] px-3 py-2', pressable],
        agendaTime: 'w-24 shrink-0 font-mono text-xs text-muted',
        agendaBody: 'min-w-0 flex-1 gap-0.5',
        eventTitle: 'font-sans-semibold text-sm text-fg',
        eventMeta: 'flex-row flex-wrap items-center gap-1',
        eventMetaText: 'font-sans text-xs text-muted',
        seriesIcon: 'size-3.5 text-muted',
        // Time grid: hours on the left, a column per day (the week scrolls sideways). The time column (60 px, GUTTER in
        // SchedulerTimeGrid) fits "All day" in one line
        header: 'bg-card',
        headRow: 'flex-row border-b border-line',
        headScroll: 'flex-1',
        corner: 'w-15 shrink-0',
        dayHead: ['min-h-11 items-center justify-center gap-0.5 border-l border-line py-1.5', pressable],
        weekday: 'font-mono text-[10px] tracking-[0.6px] text-muted uppercase',
        dayNumber: 'size-7 items-center justify-center rounded-full',
        dayNumberText: 'font-sans-semibold text-sm text-fg',
        allDayRow: 'flex-row border-b border-line',
        allDayLabel: 'w-15 shrink-0 justify-center pr-1.5',
        allDayLabelText: 'text-right font-mono text-[10px] text-muted',
        allDayCell: 'min-h-9 gap-0.5 border-l border-line p-0.5',
        allDayEvent: ['min-h-7 justify-center rounded-md border-l-[3px] px-1.5', pressable],
        backgroundLabel: 'rounded-sm bg-bg-2 px-1.5 py-0.5',
        backgroundText: 'font-sans-medium text-[11px] text-muted',
        gridRow: 'flex-row',
        columns: 'flex-row',
        gutter: 'relative w-15 shrink-0',
        hourLabel: 'absolute right-1.5 font-mono text-[10px] text-muted',
        column: 'relative border-l border-line',
        hourLine: 'absolute right-0 left-0 h-px bg-line',
        slot: [
            'absolute inset-0',
            'web:focus-visible:outline-2 web:focus-visible:-outline-offset-2 web:focus-visible:outline-fg',
        ],
        closed: 'absolute right-0 left-0 bg-bg-2',
        backgroundEvent: 'absolute right-0 left-0 overflow-hidden bg-bg-2 px-1.5 py-1',
        event: ['absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-1', pressable],
        eventGridTitle: 'font-sans-semibold text-xs text-fg',
        eventGridTime: 'font-mono text-[10px] text-muted',
        now: 'absolute right-0 left-0 h-0.5 bg-danger',
        // Compact month: days with dots, the events of the chosen day below
        weekdays: 'flex-row border-b border-line px-1 py-1.5',
        weekdayName: 'flex-1 text-center font-mono text-[10px] text-muted uppercase',
        monthGrid: 'p-1',
        monthRow: 'flex-row',
        monthDay: ['min-h-11 flex-1 items-center justify-center gap-0.5 rounded-lg py-1', pressable],
        monthDayNumber: 'font-sans text-sm text-fg',
        monthMarks: 'h-2 flex-row items-center justify-center gap-0.5',
        monthDot: 'size-1.5 rounded-full bg-primary',
        monthCount: 'font-mono text-[9px] leading-[10px] text-muted',
        dayList: 'border-t border-line',
        dayListHeading: 'px-3 pt-3 pb-1.5 font-sans-semibold text-sm text-fg',
        newEvent: 'px-3 py-2',
        // Detail and series sheet
        sheetBody: 'gap-3 px-4 pb-4',
        detailText: 'font-sans text-[15px] text-fg',
        detailMeta: 'font-sans text-sm text-muted',
        actions: 'flex-row flex-wrap gap-2',
    },
    variants: {
        tone: {
            primary: {
                event: 'border-primary bg-primary/10',
                allDayEvent: 'border-primary bg-primary/10',
                agendaEvent: 'border-primary',
            },
            info: {
                event: 'border-info bg-info/10',
                allDayEvent: 'border-info bg-info/10',
                agendaEvent: 'border-info',
            },
            success: {
                event: 'border-success bg-success/10',
                allDayEvent: 'border-success bg-success/10',
                agendaEvent: 'border-success',
            },
            warn: {
                event: 'border-warn bg-warn/10',
                allDayEvent: 'border-warn bg-warn/10',
                agendaEvent: 'border-warn',
            },
            danger: {
                event: 'border-danger bg-danger/10',
                allDayEvent: 'border-danger bg-danger/10',
                agendaEvent: 'border-danger',
            },
        },
        today: {
            true: { dayNumber: 'bg-primary', dayNumberText: 'text-on-primary', monthDay: 'border border-primary' },
        },
        /** A day of the next or previous month in the compact month (before `selected`, which wins) */
        outside: {
            true: { monthDayNumber: 'text-muted' },
        },
        selected: {
            true: {
                monthDay: 'border-0 bg-primary',
                monthDayNumber: 'font-sans-semibold text-on-primary',
                monthDot: 'bg-on-primary',
                monthCount: 'text-on-primary',
            },
        },
        dragging: {
            true: { event: 'z-10 opacity-90 shadow-lg' },
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});

export const gantt = tv({
    slots: {
        base: 'w-full gap-2',
        heading: 'font-sans-semibold text-base text-fg',
        list: 'overflow-hidden rounded-card border border-line bg-card',
        row: 'gap-1.5 border-b border-line py-2.5 pr-3',
        rowHeader: 'flex-row items-start gap-1',
        toggle: ['size-8 items-center justify-center rounded-md', pressable],
        toggleIcon: 'size-4 text-muted',
        toggleSpace: 'w-8',
        info: 'min-w-0 flex-1 gap-0.5',
        infoButton: ['min-w-0 flex-1 gap-0.5 rounded-md', pressable],
        name: 'font-sans-semibold text-[15px] text-fg',
        meta: 'font-sans text-xs text-muted',
        critical: 'font-sans-medium text-xs text-danger',
        progressRow: 'flex-row items-center gap-1',
        track: 'h-3 w-full rounded-sm bg-bg-2',
        slider: 'min-h-11 min-w-0 flex-1 justify-center web:focus-visible:outline-2 web:focus-visible:outline-fg',
        bar: 'absolute top-0 bottom-0 overflow-hidden rounded-sm border',
        barProgress: 'absolute top-0 bottom-0 left-0',
        milestone: 'absolute top-0.5 -ml-1 size-2 rotate-45 border',
        empty: 'px-3 py-8 text-center font-sans text-sm text-muted',
    },
    variants: {
        tone: {
            primary: {
                bar: 'border-primary bg-primary/10',
                barProgress: 'bg-primary/40',
                milestone: 'border-primary bg-primary/40',
            },
            info: {
                bar: 'border-info bg-info/10',
                barProgress: 'bg-info/40',
                milestone: 'border-info bg-info/40',
            },
            success: {
                bar: 'border-success bg-success/10',
                barProgress: 'bg-success/40',
                milestone: 'border-success bg-success/40',
            },
            warn: {
                bar: 'border-warn bg-warn/10',
                barProgress: 'bg-warn/40',
                milestone: 'border-warn bg-warn/40',
            },
            danger: {
                bar: 'border-danger bg-danger/10',
                barProgress: 'bg-danger/40',
                milestone: 'border-danger bg-danger/40',
            },
        },
        group: {
            true: { name: 'font-sans-bold', bar: 'border-fg bg-fg/20', barProgress: 'bg-fg/50' },
        },
        expanded: {
            true: { toggleIcon: 'rotate-90' },
        },
        /** On the critical path: a thicker red outline (the text says it as well) */
        critical: {
            true: { bar: 'border-2 border-danger', milestone: 'border-2 border-danger' },
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});
