import { pressable, tv } from './tv.js';

// Layout, selection, value and date controls for React Native – same variant names as the web recipes.

export const divider = tv({
    slots: {
        base: 'flex-row items-center gap-3',
        line: 'h-px flex-1 bg-line',
        label: 'font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        /** The short line before/after a label at the start or end (`labelPosition`) */
        edgeLine: 'max-w-4',
    },
    variants: {
        orientation: {
            horizontal: { base: 'w-full' },
            vertical: { base: 'w-px self-stretch bg-line', line: 'hidden' },
        },
        lineStyle: {
            solid: {},
            dashed: { line: 'h-0 border-t border-dashed border-line-strong bg-transparent' },
            dotted: { line: 'h-0 border-t border-dotted border-line-strong bg-transparent' },
        },
    },
    compoundVariants: [
        {
            orientation: 'vertical',
            lineStyle: 'dashed',
            class: { base: 'w-0 border-l border-dashed border-line-strong bg-transparent' },
        },
        {
            orientation: 'vertical',
            lineStyle: 'dotted',
            class: { base: 'w-0 border-l border-dotted border-line-strong bg-transparent' },
        },
    ],
    defaultVariants: {
        orientation: 'horizontal',
        lineStyle: 'solid',
    },
});

export const skeletonLines = tv({
    slots: {
        base: 'w-full gap-2',
        /** The last line of a paragraph is shorter */
        last: 'w-3/5',
        /** Avatar and lines side by side */
        row: 'w-full flex-row items-center gap-3',
        rowText: 'min-w-0 flex-1 gap-2',
    },
});

export const skeleton = tv({
    base: 'bg-line',
    variants: {
        shape: {
            line: 'h-3.5 w-full rounded',
            rect: 'h-24 w-full rounded-xl',
            circle: 'size-10 rounded-full',
        },
    },
    defaultVariants: {
        shape: 'line',
    },
});

export const accordion = tv({
    slots: {
        base: 'w-full border-b border-line',
        item: 'border-t border-line',
        trigger: ['min-h-12 flex-row items-center justify-between gap-3 py-3', pressable],
        /** Heading row with own actions beside the trigger */
        header: 'flex-row items-center gap-2',
        heading: 'min-w-0 flex-1',
        icon: 'size-[18px] shrink-0 text-muted',
        actions: 'flex-row items-center gap-1',
        title: 'min-w-0 flex-1 font-sans-medium text-[15px] text-fg',
        indicator: 'size-4 shrink-0 text-muted',
        content: 'pb-4',
        body: 'font-sans text-sm leading-5 text-muted',
    },
    variants: {
        open: {
            true: { indicator: 'rotate-180' },
        },
    },
});

export const segmentedControl = tv({
    slots: {
        base: 'flex-row items-center gap-0.5 self-start rounded-full border border-line-2 p-[3px]',
        item: ['h-8 flex-row items-center justify-center gap-1.5 rounded-full px-3', pressable],
        label: 'font-sans-semibold text-[13px] text-muted',
        icon: 'size-[15px] shrink-0 text-muted',
    },
    variants: {
        checked: {
            true: { item: 'bg-primary', label: 'text-on-primary', icon: 'text-on-primary' },
        },
        size: {
            sm: { item: 'h-7 px-2.5', label: 'text-xs' },
            md: {},
        },
        /** Full width: the segments share it */
        block: {
            true: { base: 'w-full self-stretch', item: 'flex-1' },
        },
    },
});

export const chipGroup = tv({
    slots: {
        base: 'flex-row flex-wrap gap-1.5',
        chip: ['h-8 shrink-0 flex-row items-center gap-1.5 rounded-full border border-line-2 px-3', pressable],
        label: 'font-sans-medium text-[13px] text-fg',
        icon: 'size-3.5 shrink-0 text-fg',
    },
    variants: {
        checked: {
            true: { chip: 'border-primary bg-primary', label: 'text-on-primary', icon: 'text-on-primary' },
        },
    },
});

export const slider = tv({
    slots: {
        base: 'w-full gap-1',
        header: 'flex-row items-baseline justify-between gap-3',
        label: 'font-sans-medium text-[13px] text-fg',
        value: 'font-mono text-xs text-muted',
        // 44 px tall touch area around the 6 px track
        control: 'h-11 justify-center',
        track: 'h-1.5 w-full overflow-hidden rounded-full bg-line-2',
        range: 'absolute h-1.5 rounded-full bg-primary',
        thumb: [
            'absolute size-6 rounded-full border-2 border-primary bg-bg',
            'web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-fg',
        ],
        /** Track and marks: below each other, side by side when vertical */
        body: 'w-full',
        /** Marks along the track (marks) */
        marks: 'relative h-5',
        mark: 'absolute top-0 w-12 items-center',
        markTick: 'h-1.5 w-px bg-line-strong',
        markLabel: 'mt-0.5 font-mono text-[10px] text-muted',
    },
    variants: {
        disabled: {
            true: { label: 'text-muted', range: 'bg-line-strong', thumb: 'border-line-strong' },
        },
        /** Vertical: the track runs bottom to top; the component sets the height */
        orientation: {
            horizontal: {},
            vertical: {
                base: 'w-auto items-start',
                body: 'w-auto flex-1 flex-row',
                control: 'h-full w-11 items-center justify-start',
                track: 'h-full w-1.5',
                range: 'w-1.5',
                marks: 'h-full w-12',
                mark: 'left-0 h-3 w-auto flex-row items-center gap-1',
                markTick: 'h-px w-1.5',
                markLabel: 'mt-0',
            },
        },
        /** Without the visible label (`hideLabel`): the value stays at the end */
        hideLabel: {
            true: { header: 'justify-end' },
        },
    },
    defaultVariants: {
        orientation: 'horizontal',
    },
});

export const numberInput = tv({
    slots: {
        button: ['w-10 items-center justify-center border-l border-line-strong', pressable, 'active:bg-line'],
        icon: 'size-4 text-fg',
        /** Free text before/after the number (prefix, suffix) – inside the field, not a box like Input's */
        prefix: 'ml-3 shrink-0 self-center font-sans text-[15px] text-muted',
        suffix: 'mr-3 shrink-0 self-center font-sans text-[15px] text-muted',
    },
});

export const stepper = tv({
    slots: {
        base: 'w-full gap-5',
        list: 'flex-row items-center gap-2',
        step: 'flex-row items-center gap-2',
        indicator: 'size-7 items-center justify-center rounded-full border border-line-strong',
        number: 'font-mono text-xs text-muted',
        icon: 'size-3.5 text-on-primary',
        separator: 'h-px min-w-4 flex-1 bg-line-strong',
        title: 'font-sans-semibold text-base text-fg',
        description: 'font-sans text-sm text-muted',
        footer: 'flex-row justify-between gap-3',
        /** Vertical list: number and label per row */
        stepLabel: 'min-w-0 flex-1 font-sans-medium text-sm text-muted',
        connector: 'ml-[13px] h-3 w-px bg-line-strong',
    },
    variants: {
        state: {
            done: {
                indicator: 'border-primary bg-primary',
                separator: 'bg-primary',
                connector: 'bg-primary',
                stepLabel: 'text-fg',
            },
            active: { indicator: 'border-primary', number: 'text-fg', stepLabel: 'font-sans-semibold text-fg' },
            todo: {},
        },
        orientation: {
            horizontal: {},
            vertical: { list: 'flex-col items-stretch gap-0', step: 'min-h-11 gap-3' },
        },
    },
    defaultVariants: {
        orientation: 'horizontal',
    },
});

export const calendar = tv({
    slots: {
        base: 'w-full gap-2',
        header: 'flex-row items-center justify-between',
        title: 'font-sans-semibold text-[15px] text-fg',
        nav: ['size-10 items-center justify-center rounded-full', pressable, 'active:bg-line'],
        navIcon: 'size-4 text-fg',
        weekdays: 'flex-row',
        weekday: 'flex-1 items-center py-1',
        weekdayText: 'font-mono text-[11px] text-muted uppercase',
        week: 'flex-row',
        day: ['h-11 flex-1 items-center justify-center', pressable],
        // A circle in the middle of the (wider) cell
        dayMark: 'size-10 items-center justify-center rounded-full',
        dayText: 'font-sans text-sm text-fg',
        /** Calendar week column (showWeekNumbers) */
        weekNumber: 'h-11 w-8 items-center justify-center',
        weekNumberHead: 'w-8 items-center py-1',
        weekNumberText: 'font-mono text-[10px] text-muted',
        /** "Today" and "Clear" below the calendar (showButtonBar) */
        buttonBar: 'flex-row justify-between gap-2 border-t border-line pt-2',
        /** The calendar inside a sheet (DatePicker, DateRangePicker) */
        sheetBody: 'px-3 pb-2',
        /** Preset ranges below the calendar (DateRangePicker) */
        presets: 'flex-row flex-wrap gap-1.5 border-t border-line px-4 pt-3 pb-2',
        /** Days between start and end of a range */
        rangeFill: 'absolute inset-y-0.5 right-0 left-0 bg-primary/10',
    },
    variants: {
        selected: {
            true: { dayMark: 'bg-primary', dayText: 'font-sans-semibold text-on-primary' },
        },
        inRange: {
            true: { dayText: 'text-fg' },
        },
        rangeStart: {
            true: { rangeFill: 'left-1/2' },
        },
        rangeEnd: {
            true: { rangeFill: 'right-1/2' },
        },
        today: {
            true: { dayText: 'font-sans-semibold underline' },
        },
        outside: {
            true: { dayText: 'text-muted' },
        },
        unavailable: {
            true: { dayText: 'text-muted line-through' },
        },
    },
});
