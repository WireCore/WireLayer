import { pressable, tv } from './tv.js';

// Lists, period and time pickers and form building blocks for React Native.

/** Always visible list (Listbox): options as radio buttons or checkboxes in a bordered box */
export const listbox = tv({
    slots: {
        base: 'w-full gap-1.5',
        label: 'font-sans-medium text-[13px] text-fg',
        list: 'max-h-72 overflow-hidden rounded-lg border border-line-strong bg-bg p-1',
    },
    variants: {
        invalid: {
            true: { list: 'border-danger' },
        },
        disabled: {
            true: { base: 'opacity-40' },
        },
    },
});

/** Months, quarters and years as a grid in a sheet (MonthPicker, QuarterPicker, YearPicker) */
export const periodGrid = tv({
    slots: {
        base: 'gap-3 px-3 pb-2',
        header: 'flex-row items-center justify-between',
        title: 'font-sans-semibold text-[15px] text-fg',
        nav: ['size-11 items-center justify-center rounded-full', pressable, 'active:bg-line'],
        navIcon: 'size-4 text-fg',
        grid: 'flex-row flex-wrap',
        /** Cell of the grid – the component sets the width per column count */
        cell: 'p-1',
        item: ['h-12 items-center justify-center rounded-lg', pressable, 'active:bg-line active:opacity-100'],
        itemText: 'font-sans text-sm text-fg',
        itemSubtext: 'font-sans text-[11px] text-muted',
        presets: 'flex-row flex-wrap gap-1.5 border-t border-line pt-3',
        clear: 'self-end',
    },
    variants: {
        selected: {
            true: {
                item: 'bg-primary active:bg-primary',
                itemText: 'font-sans-semibold text-on-primary',
                itemSubtext: 'text-on-primary',
            },
        },
        inRange: {
            true: { item: 'bg-primary/10' },
        },
        current: {
            true: { itemText: 'font-sans-semibold underline' },
        },
        unavailable: {
            true: { itemText: 'text-muted line-through' },
        },
    },
});

/** Bookable time slots (TimeGrid) */
export const timeGrid = tv({
    slots: {
        base: 'gap-2',
        label: 'font-sans-medium text-[13px] text-fg',
        grid: 'flex-row flex-wrap -m-1',
        cell: 'p-1',
        slot: ['items-center justify-center rounded-lg border border-line-2', pressable],
        slotText: 'font-sans-medium text-fg',
        status: 'font-sans text-sm text-muted',
        statusRow: 'flex-row items-center gap-2',
        spinner: 'text-muted',
    },
    variants: {
        size: {
            sm: { slot: 'h-10', slotText: 'text-[13px]' },
            md: { slot: 'h-11', slotText: 'text-sm' },
            lg: { slot: 'h-12', slotText: 'text-[15px]' },
        },
        checked: {
            true: { slot: 'border-primary bg-primary', slotText: 'text-on-primary' },
        },
        inRange: {
            true: { slot: 'border-primary bg-primary/10' },
        },
        taken: {
            true: { slot: 'border-line bg-bg-2', slotText: 'text-muted line-through' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Days in a row with arrows (MiniCalendar) */
export const miniCalendar = tv({
    slots: {
        base: 'flex-row items-center gap-1',
        nav: ['size-11 items-center justify-center rounded-full', pressable, 'active:bg-line'],
        navIcon: 'size-4 text-fg',
        days: 'flex-1 flex-row gap-1',
        day: ['min-h-14 flex-1 items-center justify-center gap-0.5 rounded-xl py-1.5', pressable],
        weekday: 'font-mono text-[10px] text-muted uppercase',
        number: 'font-sans-semibold text-base text-fg',
    },
    variants: {
        selected: {
            true: { day: 'bg-primary', weekday: 'text-on-primary', number: 'text-on-primary' },
        },
        today: {
            true: { number: 'underline' },
        },
        unavailable: {
            true: { number: 'text-muted line-through' },
        },
    },
});

/** DurationInput: one number field per unit */
export const durationInput = tv({
    slots: {
        base: 'w-full flex-row items-center gap-2 rounded-lg border border-line-strong bg-bg px-3',
        part: 'flex-row items-baseline gap-1',
        control: 'w-10 py-2 text-right font-mono text-[15px] text-fg web:outline-none',
        unit: 'font-sans text-xs text-muted',
        spacer: 'flex-1',
    },
    variants: {
        size: {
            sm: { base: 'h-8 rounded-md px-2.5' },
            md: { base: 'h-10' },
            lg: { base: 'h-12 rounded-[10px] px-4' },
        },
        focused: {
            true: { base: 'border-primary' },
        },
        invalid: {
            true: { base: 'border-danger' },
        },
        disabled: {
            true: { base: 'border-line bg-bg-2', control: 'text-muted' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** List of the form's errors after submitting (FormErrorSummary) */
export const formErrorSummary = tv({
    slots: {
        base: 'gap-2 rounded-xl border border-danger bg-danger/8 p-4',
        titleRow: 'flex-row items-center gap-2',
        icon: 'size-[18px] shrink-0 text-danger',
        title: 'shrink font-sans-semibold text-[15px] text-fg',
        list: 'gap-1 pl-[26px]',
        /** A message that leads to its field: 44 pt tall */
        link: ['min-h-11 justify-center', pressable],
        linkText: 'font-sans text-sm text-danger underline',
        message: 'font-sans text-sm text-danger',
    },
});

/** Repeated entries of a form (FormList, KeyValueEditor) */
export const formList = tv({
    slots: {
        base: 'w-full gap-2.5',
        legend: 'font-sans-medium text-[13px] text-fg',
        list: 'gap-2.5',
        item: 'gap-2 rounded-xl border border-line-2 bg-card p-3',
        itemHeader: 'flex-row items-center justify-between gap-2',
        index: 'font-mono text-[11px] text-muted',
        body: 'gap-2.5',
        actions: 'flex-row items-center',
        footer: 'flex-row flex-wrap items-center gap-3',
        hint: 'font-sans text-xs text-muted',
        error: 'font-sans text-xs text-danger',
    },
});

/** Nested and/or groups as cards (ConditionBuilder) */
export const conditionBuilder = tv({
    slots: {
        base: 'w-full gap-2',
        group: 'gap-3 rounded-xl border border-line-2 p-3',
        groupHeader: 'flex-row flex-wrap items-center justify-between gap-2',
        children: 'gap-2.5',
        rule: 'gap-2 rounded-lg border border-line bg-bg-2 p-3',
        ruleHeader: 'flex-row items-center justify-between gap-2',
        ruleTitle: 'font-mono text-[11px] text-muted uppercase',
        actions: 'flex-row flex-wrap gap-2',
        empty: 'font-sans text-sm text-muted',
        connector: 'self-start rounded-full bg-line px-2 py-0.5 font-mono text-[10px] text-muted uppercase',
    },
    variants: {
        depth: {
            even: { group: 'bg-card' },
            odd: { group: 'bg-bg' },
        },
    },
});

/** Wizard: the stepper plus the state of the check */
export const wizard = tv({
    slots: {
        status: 'font-sans text-sm text-danger',
        validating: 'flex-row items-center gap-2',
        validatingText: 'font-sans text-sm text-muted',
    },
});

/** Hidden text for screen readers (web only – on iOS/Android announcements go through AccessibilityInfo) */
export const visuallyHidden = tv({
    base: 'absolute h-px w-px overflow-hidden web:sr-only',
});
