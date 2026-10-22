import { listboxContent, listboxOption, listboxPanel, listboxParts, selectFieldParts } from './navigation.js';
import { inputStatusParts } from './field.js';
import { tv } from './tv.js';

// Form controls built on Ark: number, password, slider, multi select, combobox, date picker, file upload.
// Ark marks states on the control itself (data-invalid, data-disabled, data-focus …).

/** The bordered box around a text control – like Input */
const box = [
    'flex w-full items-stretch overflow-hidden rounded-lg border border-line-strong bg-bg text-fg',
    'transition-colors motion-reduce:transition-none focus-within:border-primary',
    'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2 data-disabled:text-muted',
];
const boxInput =
    'h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-inherit outline-none placeholder:text-muted disabled:cursor-not-allowed';
/** Square button inside the box (password toggle, calendar, clear) */
const boxButton = [
    'flex w-10 shrink-0 cursor-pointer items-center justify-center text-muted transition-colors hover:text-fg motion-reduce:transition-none',
    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-40',
];

/** Spinner, clear button and status icon in a bordered box (password, number) */
const boxStatusParts = {
    ...inputStatusParts,
    spinner: [inputStatusParts.spinner, 'me-3 size-4'],
    clear: [inputStatusParts.clear, 'me-1.5 size-6'],
    statusIcon: 'pointer-events-none me-3 size-4 shrink-0 self-center text-success',
};
/** Confirmed value (`success`): green border */
const boxSuccess = { true: { control: 'border-success focus-within:border-success' } };

export const numberInput = tv({
    slots: {
        base: 'flex w-full flex-col',
        control: [...box, 'h-10'],
        input: [boxInput, 'tabular-nums'],
        // Side by side, the full height: 24 × 24 px touch targets at least (WCAG 2.5.8)
        button: [
            'flex w-9 shrink-0 cursor-pointer items-center justify-center border-s border-line-strong text-muted transition-colors',
            'hover:bg-line hover:text-fg motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40',
        ],
        buttonIcon: 'size-3.5',
        /** Stacked buttons (stepperLayout="stacked") */
        stepper: 'flex shrink-0 flex-col border-s border-line-strong',
        /** Free text before/after the number, e.g. "pt" or "€ / month" */
        prefix: 'flex shrink-0 items-center border-e border-line-strong bg-bg-2 px-3 font-mono text-xs text-muted',
        suffix: 'flex shrink-0 items-center border-s border-line-strong bg-bg-2 px-3 font-mono text-xs text-muted',
        ...boxStatusParts,
    },
    variants: {
        size: {
            sm: { control: 'h-8 rounded-md', input: 'px-2.5 text-[13px]', button: 'w-8' },
            md: {},
            lg: { control: 'h-12 rounded-[10px]', input: 'px-4 text-base', button: 'w-11' },
        },
        // Up above down at the end; the field is 48px high so both keep a 24px target (WCAG 2.5.8)
        stacked: {
            true: { control: 'h-12', button: 'min-h-6 flex-1 border-s-0 first:border-b first:border-line-strong' },
        },
        success: boxSuccess,
    },
    defaultVariants: {
        size: 'md',
    },
});

export const passwordInput = tv({
    slots: {
        base: 'flex w-full flex-col',
        control: [...box, 'h-10'],
        input: boxInput,
        toggle: boxButton,
        toggleIcon: 'size-4',
        // Strength meter below the field (strength prop): four bars, coloured by the level
        strength: 'mt-1.5 flex items-center gap-2.5',
        meter: 'flex flex-1 gap-1',
        bar: [
            'h-1 flex-1 rounded-full bg-line',
            'data-[level=1]:data-filled:bg-danger data-[level=2]:data-filled:bg-warn',
            'data-[level=3]:data-filled:bg-info data-[level=4]:data-filled:bg-success',
            'forced-colors:data-filled:bg-[CanvasText]',
        ],
        strengthText: 'min-w-20 text-end text-xs text-muted',
        // Requirements below the field: each with its state (icon and text, never colour alone)
        requirements: 'mt-2 flex flex-col gap-1 text-xs',
        requirement: 'flex items-center gap-1.5 text-muted data-met:text-success',
        requirementIcon: 'size-3.5 shrink-0',
        requirementState: 'sr-only',
        ...boxStatusParts,
    },
    variants: {
        size: {
            sm: { control: 'h-8 rounded-md', input: 'px-2.5 text-[13px]', toggle: 'w-8' },
            md: {},
            lg: { control: 'h-12 rounded-[10px]', input: 'px-4 text-base', toggle: 'w-12' },
        },
        success: boxSuccess,
    },
    defaultVariants: {
        size: 'md',
    },
});

export const slider = tv({
    slots: {
        base: 'flex w-full flex-col gap-2.5 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto',
        header: 'flex items-baseline justify-between gap-3',
        label: 'text-[13px] font-medium text-fg data-disabled:text-muted',
        value: 'font-mono text-xs text-muted tabular-nums',
        control: [
            'relative flex h-5 items-center',
            'data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-5 data-[orientation=vertical]:flex-col',
        ],
        track: [
            'h-1.5 flex-1 overflow-hidden rounded-full bg-line-2 forced-colors:border forced-colors:border-[CanvasText]',
            'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
        ],
        range: [
            'h-full bg-primary forced-colors:forced-color-adjust-none forced-colors:bg-[Highlight]',
            'data-[orientation=vertical]:h-auto data-[orientation=vertical]:w-full',
        ],
        thumb: [
            'size-5 cursor-grab rounded-full border-2 border-primary bg-bg shadow-[0_1px_4px_rgba(0,0,0,.3)]',
            'data-dragging:cursor-grabbing data-disabled:cursor-not-allowed data-disabled:border-line-strong',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        thumbLabel: 'sr-only',
        /** Marks along the track (below it, beside it when vertical) – decoration, the value is announced anyway */
        markerGroup: [
            'absolute inset-x-0 top-full mt-1 h-5',
            'data-[orientation=vertical]:inset-x-auto data-[orientation=vertical]:inset-y-0 data-[orientation=vertical]:start-full data-[orientation=vertical]:ms-2 data-[orientation=vertical]:mt-0 data-[orientation=vertical]:h-auto',
        ],
        marker: [
            'flex flex-col items-center gap-0.5 font-mono text-[11px] whitespace-nowrap text-muted tabular-nums',
            'data-[orientation=vertical]:flex-row',
        ],
        markerTick: 'h-1.5 w-px bg-line-strong data-[orientation=vertical]:h-px data-[orientation=vertical]:w-1.5',
    },
    variants: {
        /** Room for the marks below the track (beside it when vertical) */
        withMarks: {
            true: {
                control: 'mb-6 data-[orientation=vertical]:mb-0 data-[orientation=vertical]:me-14',
            },
        },
    },
});

export const multiSelect = tv({
    slots: {
        base: 'flex w-full flex-col',
        trigger: [
            'flex h-10 w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-line-strong bg-bg pe-2.5 ps-3 text-start text-[15px] text-fg',
            'outline-none transition-colors motion-reduce:transition-none focus-visible:border-primary data-[state=open]:border-primary',
            'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2 data-disabled:text-muted',
        ],
        value: 'min-w-0 truncate data-[placeholder-shown]:text-muted',
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-180',
        indicatorIcon: 'size-full',
        content: listboxContent,
        item: listboxOption,
        check: [
            'flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-line-strong text-on-primary',
            'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
            'data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary',
            'forced-colors:data-[state=checked]:forced-color-adjust-none forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText]',
            'forced-colors:data-[state=indeterminate]:forced-color-adjust-none forced-colors:data-[state=indeterminate]:bg-[Highlight] forced-colors:data-[state=indeterminate]:text-[HighlightText]',
        ],
        checkIcon: 'size-3 stroke-3',
        icon: 'size-4 shrink-0 text-muted',
        itemText: 'flex-1 truncate',
        /** Check mark after the label (checkboxes: false) */
        itemIndicator: 'size-[15px] shrink-0',
        /** Wraps trigger and clear button (clearable); with chips the bordered box around chips and trigger */
        control: 'relative flex',
        chipsControl: [
            'relative flex min-h-10 w-full flex-wrap items-center gap-1 rounded-lg border border-line-strong bg-bg py-[5px] pe-2.5 ps-1.5 text-fg',
            'transition-colors motion-reduce:transition-none focus-within:border-primary data-[state=open]:border-primary',
            'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2 data-disabled:text-muted',
        ],
        /** The trigger next to the chips: fills the rest of the row, no border of its own */
        chipsTrigger: [
            'flex h-7 min-w-16 flex-1 cursor-pointer items-center justify-between gap-2.5 ps-1.5 text-start text-[15px] text-fg outline-none',
            'data-disabled:cursor-not-allowed data-disabled:text-muted',
        ],
        chip: 'inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-md bg-line pe-0.5 ps-2 text-sm text-fg',
        chipText: 'truncate',
        // Pointer only (tabindex=-1): Backspace on the field removes the last chip
        chipRemove: [
            'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-current opacity-70 hover:opacity-100',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        chipRemoveIcon: 'size-3.5',
        /** Clear button at the end of the chips box (in the flow, not over the trigger) */
        chipsClear: [
            'flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted',
            'hover:bg-line hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        /** Selected labels for screen readers inside the trigger (the chips show them) */
        hiddenValue: 'sr-only',
        /** "Select all" above the options */
        selectAll: [
            'flex h-9 w-full shrink-0 cursor-pointer items-center gap-2 rounded-md px-2.5 text-start text-sm text-fg hover:bg-line',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        /** Announces removed chips and the reached maximum */
        status: 'sr-only',
        ...selectFieldParts,
        ...listboxParts,
        ...listboxPanel,
    },
    variants: {
        size: {
            sm: {
                trigger: 'h-8 rounded-md ps-2.5 pe-2 text-[13px]',
                chipsControl: 'min-h-8 rounded-md py-0.5',
                chipsTrigger: 'text-[13px]',
            },
            md: {},
            lg: {
                trigger: 'h-12 rounded-[10px] ps-4 pe-3 text-base',
                chipsControl: 'min-h-12 rounded-[10px] py-[9px]',
                chipsTrigger: 'text-base',
            },
        },
        // Room for the clear button between value and arrow
        clearable: {
            true: { indicator: 'ms-7' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const combobox = tv({
    slots: {
        base: 'flex w-full flex-col',
        control: [...box, 'h-10'],
        input: boxInput,
        clear: [...boxButton, 'w-8'],
        clearIcon: 'size-3.5',
        trigger: [...boxButton, 'w-9'],
        triggerIcon: 'size-4 transition-transform motion-reduce:transition-none in-data-[state=open]:rotate-180',
        content: listboxContent,
        item: listboxOption,
        itemText: 'flex-1 truncate',
        itemIndicator: 'size-[15px] shrink-0',
        /** Instead of the arrow while loading */
        spinner: 'size-4 motion-safe:animate-spin',
        /** Box for the spinner in a field without arrow button (Autocomplete) */
        status: 'flex w-9 shrink-0 items-center justify-center text-muted',
        /** Announces loaded suggestions (data source) */
        announcer: 'sr-only',
        ...listboxParts,
    },
    variants: {
        size: {
            sm: { control: 'h-8 rounded-md', input: 'px-2.5 text-[13px]', trigger: 'w-8', clear: 'w-7' },
            md: {},
            lg: { control: 'h-12 rounded-[10px]', input: 'px-4 text-base', trigger: 'w-11' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const datePicker = tv({
    slots: {
        base: 'flex w-full flex-col',
        control: [...box, 'h-10'],
        // Segmented date field (DateInput): one spin button per part, separators come from the locale
        dateInput: 'flex min-w-0 flex-1 items-center px-3',
        // Holds one date, or start – end of a range, in a row
        dateControl: 'flex min-w-0 items-center',
        segments: 'flex items-center text-[15px]',
        segment: [
            'rounded-sm px-px text-fg tabular-nums outline-none data-placeholder-shown:text-muted',
            // Tabular figures would make the separators as wide as a digit
            'focus:bg-primary focus:text-on-primary data-[type=literal]:px-0 data-[type=literal]:text-muted data-[type=literal]:normal-nums',
            // Keeps the space in ", " between date and time
            'data-[type=literal]:whitespace-pre',
            'forced-colors:focus:forced-color-adjust-none forced-colors:focus:bg-[Highlight] forced-colors:focus:text-[HighlightText]',
        ],
        // "–" between start and end of a range
        rangeSeparator: 'px-1.5 text-muted',
        /** Names "Start"/"End" of the two dates, for screen readers */
        rangeLabel: 'sr-only',
        /** TimePicker: Ark's select root around the list button */
        timeSelect: 'flex',
        /** TimePicker: name of the list button (Ark would take the Field label) */
        timeListLabel: 'sr-only',
        // Range presets ("Last 7 days") below the calendar
        presets: 'flex flex-wrap gap-1.5 border-t border-line pt-2.5',
        preset: [
            'h-7 cursor-pointer rounded-full border border-line-2 px-2.5 text-xs text-fg hover:border-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        // Calendar shown inline (not as a popup)
        inline: 'inline-flex w-[304px] flex-col gap-2 rounded-xl border border-line bg-card p-3 text-fg',
        /** TimePicker: added to the select content – a short list of times */
        timeList: 'max-h-64 w-32 overflow-y-auto',
        clear: [...boxButton, 'w-8'],
        clearIcon: 'size-3.5',
        trigger: boxButton,
        triggerIcon: 'size-4',
        content: [
            'z-50 flex w-[304px] flex-col gap-2 rounded-xl border border-line-2 bg-card p-3 text-fg outline-none',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            'motion-safe:data-[state=open]:animate-pop-in motion-safe:data-[state=closed]:animate-pop-out',
            'data-[side=bottom]:[--wc-pop-y:-4px] data-[side=top]:[--wc-pop-y:4px]',
        ],
        header: 'flex items-center justify-between gap-1',
        nav: [
            'flex size-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-40',
        ],
        navIcon: 'size-4 rtl:-scale-x-100',
        viewTrigger: [
            'h-8 cursor-pointer rounded-md px-2.5 text-sm font-semibold hover:bg-line',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        table: 'w-full border-collapse',
        columnHeader: 'h-8 p-0 text-center font-mono text-[11px] font-normal text-muted uppercase',
        cell: 'p-0 text-center',
        day: [
            'mx-auto flex size-9 cursor-pointer items-center justify-center rounded-full text-sm tabular-nums',
            'hover:bg-line data-today:font-semibold data-today:underline data-today:underline-offset-4',
            'data-outside-range:text-muted data-selected:bg-primary data-selected:text-on-primary',
            // Range: the days between start and end (and while choosing the end, up to the pointer)
            'data-in-range:not-data-selected:bg-line data-in-hover-range:not-data-selected:bg-line',
            'data-disabled:cursor-not-allowed data-disabled:opacity-40 data-unavailable:line-through',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'forced-colors:data-selected:forced-color-adjust-none forced-colors:data-selected:bg-[Highlight] forced-colors:data-selected:text-[HighlightText]',
        ],
        // Month and year grid
        period: [
            'flex h-10 w-full cursor-pointer items-center justify-center rounded-lg text-sm hover:bg-line',
            'data-selected:bg-primary data-selected:text-on-primary data-disabled:cursor-not-allowed data-disabled:opacity-40',
            // Range of months, quarters or years: the periods between start and end
            'data-in-range:not-data-selected:bg-line data-in-hover-range:not-data-selected:bg-line',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'forced-colors:data-selected:forced-color-adjust-none forced-colors:data-selected:bg-[Highlight] forced-colors:data-selected:text-[HighlightText]',
        ],
        /** Several months side by side (numberOfMonths), one below the other on narrow screens */
        months: 'flex flex-col gap-4 sm:flex-row sm:items-start',
        /** One month of several: its title and table */
        month: 'flex min-w-[278px] flex-col gap-1',
        monthTitle: 'flex h-8 items-center justify-center text-sm font-semibold',
        /** Column of calendar weeks (showWeekNumbers): "Wk" header and the week numbers */
        weekNumberHeader: 'h-8 w-8 p-0 text-center font-mono text-[11px] font-normal text-muted uppercase',
        weekNumber: 'w-8 p-0 text-center font-mono text-[11px] font-normal text-muted tabular-nums',
        /** Own content of a day (day slot / renderDay), e.g. a dot below the number */
        dayContent: 'pointer-events-none relative flex size-full flex-col items-center justify-center leading-none',
        /** "Today" and "Clear" below the calendar (showButtonBar) */
        buttonBar: 'flex items-center justify-between gap-2 border-t border-line pt-2.5',
        buttonBarButton: [
            'h-8 cursor-pointer rounded-md px-2.5 text-sm font-medium hover:bg-line disabled:cursor-not-allowed disabled:opacity-40',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        /** Chosen dates as text in the field (selectionMode multiple), muted while empty */
        multiValue: 'min-w-0 flex-1 truncate px-3 text-[15px] data-placeholder:text-muted',
        /** Short zone name after the time (showTimeZone) */
        timeZone: 'shrink-0 self-center pe-1 text-xs text-muted',
        /** Narrow screens (responsive): the calendar as a sheet at the bottom over a backdrop */
        sheet: 'fixed inset-x-0 bottom-0 z-50 flex justify-center',
        backdrop: 'fixed inset-0 z-40 bg-black/40 motion-safe:animate-fade-in',
        /** QuarterPicker: typed quarter ("Q4 2026"), the year above the quarters, the quarters */
        textInput:
            'h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-inherit outline-none placeholder:text-muted disabled:cursor-not-allowed',
        yearLabel: 'text-sm font-semibold tabular-nums',
        quarterGrid: 'grid grid-cols-2 gap-1',
        /** DurationInput: unit after a part ("hr") */
        unit: 'px-1 text-[15px] text-muted',
    },
    variants: {
        size: {
            sm: {
                control: 'h-8 rounded-md',
                dateInput: 'px-2.5',
                segments: 'text-[13px]',
                multiValue: 'px-2.5 text-[13px]',
                textInput: 'px-2.5 text-[13px]',
                unit: 'text-[13px]',
                trigger: 'w-8',
                clear: 'w-7',
            },
            md: {},
            lg: {
                control: 'h-12 rounded-[10px]',
                dateInput: 'px-4',
                segments: 'text-base',
                multiValue: 'px-4 text-base',
                textInput: 'px-4 text-base',
                unit: 'text-base',
                trigger: 'w-11',
            },
        },
        /** highlightToday false: today looks like any other day (aria-current stays) */
        plainToday: {
            true: { day: 'data-today:font-normal data-today:no-underline' },
        },
        /** Days of the previous and next month stay empty */
        hideOutsideDays: {
            true: { day: 'data-outside-range:invisible' },
        },
        /** numberOfMonths > 1: the popup and the inline calendar grow with the months */
        multiMonth: {
            true: { content: 'w-auto', inline: 'w-auto' },
        },
        /** Calendar shown as bottom sheet (responsive, narrow screen) */
        bottomSheet: {
            true: { content: 'max-h-[85dvh] w-full overflow-y-auto rounded-b-none' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** TimeGrid: free time slots for a booking as buttons (one or a range) */
export const timeGrid = tv({
    slots: {
        base: 'flex flex-col gap-2',
        grid: 'grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2',
        slot: [
            'flex h-10 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-bg px-3 text-sm text-fg tabular-nums',
            'transition-colors hover:border-fg motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'aria-checked:border-primary aria-checked:bg-primary aria-checked:text-on-primary',
            'aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-on-primary',
            // Range: the slots between start and end
            'data-in-range:not-aria-pressed:border-primary data-in-range:not-aria-pressed:bg-line',
            'aria-disabled:cursor-not-allowed aria-disabled:border-line aria-disabled:text-muted aria-disabled:line-through aria-disabled:hover:border-line',
            'forced-colors:aria-checked:forced-color-adjust-none forced-colors:aria-checked:bg-[Highlight] forced-colors:aria-checked:text-[HighlightText]',
            'forced-colors:aria-pressed:forced-color-adjust-none forced-colors:aria-pressed:bg-[Highlight] forced-colors:aria-pressed:text-[HighlightText]',
        ],
        /** No free slots, or loading */
        status: 'flex min-h-10 items-center gap-2 text-sm text-muted',
        spinner: 'size-4 motion-safe:animate-spin',
    },
    variants: {
        size: {
            sm: {
                grid: 'grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-1.5',
                slot: 'h-8 rounded-md px-2 text-xs',
            },
            md: {},
            lg: {
                grid: 'grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2.5',
                slot: 'h-12 rounded-[10px] text-base',
            },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** MiniCalendar: a strip of days with arrows to the previous and next days */
export const miniCalendar = tv({
    slots: {
        base: 'flex w-full items-center gap-1',
        nav: [
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg disabled:cursor-not-allowed disabled:opacity-40',
        ],
        navIcon: 'size-4 rtl:-scale-x-100',
        days: 'flex min-w-0 flex-1 gap-1',
        day: [
            'flex min-w-10 flex-1 cursor-pointer flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-fg hover:bg-line',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'data-today:underline data-today:underline-offset-4',
            'aria-checked:bg-primary aria-checked:text-on-primary aria-checked:hover:bg-primary',
            'aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent',
            'forced-colors:aria-checked:forced-color-adjust-none forced-colors:aria-checked:bg-[Highlight] forced-colors:aria-checked:text-[HighlightText]',
        ],
        // 80 %: on the selected day (primary) still 4.5:1 in every theme
        weekday: 'text-[11px] uppercase opacity-80',
        dayNumber: 'text-sm font-semibold tabular-nums',
    },
});

export const fileUpload = tv({
    slots: {
        base: 'flex w-full flex-col gap-3',
        label: 'text-[13px] font-medium text-fg',
        dropzone: [
            'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-bg-2 px-6 py-7 text-center',
            'transition-colors motion-reduce:transition-none data-dragging:border-primary data-dragging:bg-line',
            'data-disabled:cursor-not-allowed data-disabled:opacity-40',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        dropzoneIcon: 'size-6 text-muted',
        dropzoneText: 'text-sm text-fg',
        hint: 'text-xs text-muted',
        list: 'flex flex-col gap-2',
        item: 'flex items-center gap-3 rounded-lg border border-line px-3 py-2',
        itemIcon: 'size-[18px] shrink-0 text-muted',
        itemText: 'flex min-w-0 flex-1 flex-col',
        itemName: 'truncate text-sm text-fg',
        itemSize: 'font-mono text-[11px] text-muted',
        itemDelete: [
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-line hover:text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        itemDeleteIcon: 'size-3.5',
        errors: 'flex flex-col gap-1 text-xs text-danger',
        /** While files are dragged over: whether they would be accepted (text, not only colour) */
        dragText: 'text-sm font-medium text-fg',
        /** Image preview instead of the file icon */
        thumbnail: 'size-10 shrink-0 rounded-md bg-bg-2 object-cover',
        itemProgress: 'mt-1 h-1 w-full overflow-hidden rounded-full bg-line-2',
        itemProgressRange:
            'h-full bg-primary transition-[width] motion-reduce:transition-none forced-colors:bg-[Highlight]',
        itemStatus: 'text-[11px] text-muted',
        itemActions: 'flex shrink-0 items-center gap-1',
        /** Drop anywhere in the window (`fullscreenDrop`) */
        overlay: [
            'pointer-events-none fixed inset-4 z-50 flex flex-col items-center justify-center gap-2 rounded-2xl',
            'border-2 border-dashed border-primary bg-bg/90 text-lg font-medium text-fg backdrop-blur-sm',
            'data-[drag=reject]:border-danger',
        ],
        overlayIcon: 'size-8 text-muted',
    },
    variants: {
        /** State of a file's upload */
        uploadStatus: {
            idle: {},
            done: { itemStatus: 'text-success' },
            failed: { itemStatus: 'text-danger', item: 'border-danger' },
        },
        /** Files dragged over the zone: accepted or rejected */
        drag: {
            none: {},
            accept: { dropzone: 'border-success bg-success/5' },
            reject: { dropzone: 'border-danger bg-danger/5', dragText: 'text-danger' },
        },
    },
    defaultVariants: {
        uploadStatus: 'idle',
        drag: 'none',
    },
});

export const pinInput = tv({
    slots: {
        base: 'flex flex-col',
        control: 'flex gap-2',
        input: [
            'size-11 rounded-lg border border-line-strong bg-bg text-center font-mono text-lg text-fg outline-none',
            'transition-colors motion-reduce:transition-none focus:border-primary placeholder:text-muted',
            'data-invalid:border-danger data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2 data-disabled:text-muted',
        ],
    },
});

export const rating = tv({
    slots: {
        base: 'flex flex-col gap-1.5',
        label: 'text-[13px] font-medium text-fg',
        control: 'flex items-center gap-0.5',
        // 24 × 24 px: target size (WCAG 2.5.8)
        item: [
            'relative flex size-6 cursor-pointer items-center justify-center rounded-sm text-line-strong',
            'data-highlighted:text-warn data-readonly:cursor-default data-disabled:cursor-not-allowed data-disabled:opacity-40',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'forced-colors:data-highlighted:text-[Highlight]',
        ],
        icon: 'size-5',
        // Half star: the filled star clipped to its left half over the outline
        half: 'absolute inset-0 flex items-center justify-center text-warn [clip-path:inset(0_50%_0_0)] forced-colors:text-[Highlight]',
    },
    variants: {
        size: {
            sm: { item: 'size-6', icon: 'size-4', half: '' },
            md: {},
            lg: { item: 'size-8', icon: 'size-7' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const knob = tv({
    slots: {
        base: 'inline-flex flex-col items-center gap-2',
        label: 'text-[13px] font-medium text-fg',
        // The dial itself is the slider (role="slider") – focus ring around it
        control: [
            'relative size-28 cursor-grab touch-none rounded-full outline-none select-none',
            'data-dragging:cursor-grabbing data-disabled:cursor-not-allowed data-disabled:opacity-40',
            'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg',
        ],
        svg: 'size-full',
        track: 'fill-none stroke-line-2',
        range: 'fill-none stroke-primary forced-colors:stroke-[Highlight]',
        value: 'pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-lg text-fg tabular-nums',
    },
    variants: {
        size: {
            sm: { control: 'size-20', value: 'text-sm' },
            md: {},
            lg: { control: 'size-36', value: 'text-2xl' },
        },
        /** Colour of the filled arc */
        color: {
            primary: {},
            info: { range: 'stroke-info' },
            success: { range: 'stroke-success' },
            warn: { range: 'stroke-warn' },
            danger: { range: 'stroke-danger' },
            contrast: { range: 'stroke-fg' },
        },
    },
    defaultVariants: {
        size: 'md',
        color: 'primary',
    },
});

export const colorPicker = tv({
    slots: {
        base: 'flex w-full flex-col',
        control: [...box, 'h-10'],
        trigger: [
            'flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 px-3 text-start text-[15px] text-fg outline-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        swatch: 'size-5 shrink-0 rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)]',
        valueText: 'min-w-0 truncate font-mono text-sm uppercase',
        /** Name of the trigger without a Field (read before the value) */
        hiddenName: 'sr-only',
        content: [
            'z-50 flex w-[264px] flex-col gap-3 rounded-xl border border-line-2 bg-card p-3 text-fg outline-none',
            'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]',
            'motion-safe:data-[state=open]:animate-pop-in motion-safe:data-[state=closed]:animate-pop-out',
        ],
        area: 'h-36 overflow-hidden rounded-lg',
        areaBackground: 'size-full',
        areaThumb: [
            'size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.4)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        channel: 'h-3 rounded-full',
        channelTrack: 'h-full rounded-full',
        channelThumb: [
            'size-4 -translate-y-0.5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,.4)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        row: 'flex items-center gap-2',
        input: [
            'h-8 min-w-0 flex-1 rounded-md border border-line-strong bg-bg px-2 font-mono text-[13px] text-fg uppercase outline-none',
            'focus:border-primary',
        ],
        swatches: 'flex flex-wrap gap-1.5',
        swatchFill: 'size-full rounded-md',
        swatchTrigger: [
            'size-6 cursor-pointer rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'data-[state=checked]:outline-2 data-[state=checked]:outline-offset-2 data-[state=checked]:outline-primary',
        ],
        /** Eye dropper next to the hex field (where the browser supports it) */
        eyeDropper: [
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line-strong text-muted',
            'hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        eyeDropperIcon: 'size-4',
        /** Channel fields (RGB, HSL, HSB or OKLCH) with buttons for the format */
        formats: 'flex gap-1',
        formatButton: [
            'h-7 flex-1 cursor-pointer rounded-md border border-line-strong px-1.5 font-mono text-[11px] text-muted',
            'hover:text-fg aria-pressed:border-primary aria-pressed:text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'forced-colors:aria-pressed:border-[Highlight]',
        ],
        channels: 'grid grid-cols-3 gap-2',
        channelField: 'flex min-w-0 flex-col gap-0.5',
        channelLabel: 'font-mono text-[10px] text-muted uppercase',
        channelInput: [
            'h-8 w-full min-w-0 rounded-md border border-line-strong bg-bg px-1.5 text-center font-mono text-[13px] text-fg tabular-nums outline-none',
            'focus:border-primary',
        ],
        /** ColorInput: the swatch button before the text field */
        inputTrigger: [
            'flex w-10 shrink-0 cursor-pointer items-center justify-center border-e border-line-strong outline-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
            'data-disabled:cursor-not-allowed',
        ],
        /** ColorInput: the colour as text */
        textInput: [
            'h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-fg outline-none placeholder:text-muted',
            'disabled:cursor-not-allowed',
        ],
    },
    variants: {
        /** The value is shown as CSS text (rgb(), oklch() …), not in upper case like hex */
        cssText: {
            true: { valueText: 'normal-case' },
        },
    },
});
