import { pressable, tv } from './tv.js';

export const field = tv({
    slots: {
        base: 'gap-1.5',
        label: 'font-sans-medium text-[13px] text-fg',
        requiredIndicator: 'text-danger',
        helperText: 'font-sans text-xs text-muted',
        errorText: 'font-sans text-xs text-danger',
        /** Label row with the (i) button of labelHelp */
        labelRow: 'flex-row items-center gap-1',
        /** "(optional)" after the label */
        optionalText: 'font-sans text-[13px] text-muted',
        /** The (i) button: 44 pt touch area around the small icon */
        help: ['size-11 -my-3 items-center justify-center rounded-full', pressable],
        helpIcon: 'size-3.5 text-muted',
        helpText: 'rounded-md bg-fg px-2.5 py-1.5 font-sans text-xs leading-[18px] text-bg',
        /** Confirmation below the control (success) */
        successRow: 'flex-row items-center gap-1',
        successIcon: 'size-3.5 text-success',
        successText: 'shrink font-sans text-xs text-success',
    },
    variants: {
        disabled: {
            true: { label: 'text-muted' },
        },
    },
});

export const input = tv({
    slots: {
        base: 'w-full flex-row items-stretch overflow-hidden border border-line-strong bg-bg',
        control: 'min-w-0 flex-1 font-sans text-fg web:outline-none',
        icon: 'shrink-0 self-center text-muted',
        prefix: 'items-center justify-center border-r border-line-strong bg-bg-2 px-3',
        suffix: 'items-center justify-center border-l border-line-strong bg-bg-2 px-3',
        affixLabel: 'font-mono text-xs text-muted',
        /** Check icon of a confirmed value (success) */
        status: 'mr-3 size-4 shrink-0 self-center text-success',
        spinner: 'mr-3 shrink-0 self-center text-muted',
        /** Clear button: 44 pt wide touch area at the end of the field */
        clear: ['w-10 shrink-0 items-center justify-center', pressable],
        clearIcon: 'size-4 text-muted',
        /** Button at the end of the field, e.g. show/hide password */
        action: ['w-10 shrink-0 items-center justify-center', pressable],
        actionIcon: 'size-4 text-fg',
    },
    variants: {
        size: {
            sm: { base: 'h-8 rounded-md', control: 'px-2.5 text-[13px]', icon: 'ml-2.5 size-3.5' },
            md: { base: 'h-10 rounded-lg', control: 'px-3 text-[15px]', icon: 'ml-3 size-4' },
            lg: { base: 'h-12 rounded-[10px]', control: 'px-4 text-base', icon: 'ml-4 size-[18px]' },
        },
        focused: {
            true: { base: 'border-primary' },
        },
        invalid: {
            true: { base: 'border-danger' },
        },
        /** Confirmed value: green border (Input `success`) */
        success: {
            true: { base: 'border-success' },
        },
        disabled: {
            true: { base: 'border-line bg-bg-2', control: 'text-muted' },
        },
        hasIcon: {
            true: { control: 'pl-2' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const textarea = tv({
    base: 'min-h-24 w-full rounded-lg border border-line-strong bg-bg px-3 py-[9px] font-sans text-[15px] leading-6 text-fg web:outline-none',
    variants: {
        focused: {
            true: 'border-primary',
        },
        invalid: {
            true: 'border-danger',
        },
        success: {
            true: 'border-success',
        },
        disabled: {
            true: 'border-line bg-bg-2 text-muted',
        },
        size: {
            sm: 'rounded-md px-2.5 py-1.5 text-[13px] leading-5',
            md: {},
            lg: 'rounded-[10px] px-4 py-3 text-base',
        },
    },
});

/** Counter, clear button and spinner around a Textarea */
export const textareaParts = tv({
    slots: {
        base: 'w-full gap-1',
        box: 'relative w-full',
        /** Space for the clear button / spinner in the corner */
        withCorner: 'pr-11',
        corner: 'absolute top-1 right-1 flex-row items-center',
        clear: ['size-10 items-center justify-center rounded-full', pressable],
        clearIcon: 'size-4 text-muted',
        spinner: 'm-3 text-muted',
        counter: 'self-end font-mono text-[11px] text-muted',
    },
    variants: {
        over: {
            true: { counter: 'text-danger' },
        },
    },
});

// Selection controls: unselected boundaries use `line-strong` (3:1, WCAG 1.4.11)

export const checkbox = tv({
    slots: {
        base: ['flex-row items-start gap-2.5', pressable],
        control: 'mt-px size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-line-strong',
        icon: 'size-[13px] text-on-primary',
        label: 'min-w-0 shrink font-sans text-sm leading-5 text-muted',
    },
    variants: {
        checked: {
            true: { control: 'border-primary bg-primary' },
        },
        invalid: {
            true: { control: 'border-danger' },
        },
    },
});

/** CheckboxGroup and SwitchGroup: a named group of checkboxes or switches */
export const checkboxGroup = tv({
    slots: {
        base: 'gap-2.5',
        label: 'font-sans-medium text-[13px] text-fg',
        requiredIndicator: 'text-danger',
        items: 'gap-2.5',
        helperText: 'font-sans text-xs text-muted',
        errorText: 'font-sans text-xs text-danger',
    },
    variants: {
        orientation: {
            vertical: {},
            horizontal: { items: 'flex-row flex-wrap gap-x-[18px]' },
        },
        /** Cards in a grid (CheckboxCard): the columns get their width from the component */
        grid: {
            true: { items: 'flex-row flex-wrap gap-0 -m-1' },
        },
        disabled: {
            true: { label: 'text-muted' },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

/** CheckboxCard and RadioCard: a large card that is one checkbox or radio button */
export const selectionCard = tv({
    slots: {
        /** Cell of the grid (columns): the padding makes the gaps */
        cell: 'p-1',
        base: [
            'min-h-11 flex-row items-start gap-3 rounded-xl border border-line-2 bg-card p-4',
            pressable,
            'active:opacity-100',
        ],
        icon: 'size-5 shrink-0 text-muted',
        content: 'min-w-0 flex-1 gap-0.5',
        title: 'font-sans-semibold text-sm text-fg',
        description: 'font-sans text-[13px] leading-5 text-muted',
        /** Checkbox square or radio circle at the end */
        control: 'mt-px size-[18px] shrink-0 items-center justify-center border border-line-strong',
        check: 'size-[13px] text-on-primary',
        dot: 'size-2 rounded-full bg-primary',
    },
    variants: {
        type: {
            checkbox: { control: 'rounded-[5px]' },
            radio: { control: 'rounded-full' },
        },
        checked: {
            true: { base: 'border-primary', icon: 'text-primary' },
        },
        invalid: {
            true: { base: 'border-danger' },
        },
    },
    compoundVariants: [
        { type: 'checkbox', checked: true, class: { control: 'border-primary bg-primary' } },
        { type: 'radio', checked: true, class: { control: 'border-primary' } },
    ],
    defaultVariants: {
        type: 'checkbox',
    },
});

export const switchControl = tv({
    slots: {
        base: ['w-full flex-row items-center justify-between gap-3.5 py-2', pressable],
        content: 'min-w-0 flex-1 flex-row items-center gap-2.5',
        icon: 'size-[18px] shrink-0 text-muted',
        text: 'min-w-0 flex-1 gap-px',
        label: 'font-sans-medium text-sm text-fg',
        description: 'font-sans text-xs text-muted',
        control: 'h-[22px] w-10 shrink-0 flex-row items-center rounded-full border border-line-strong px-[3px]',
        thumb: 'size-3.5 rounded-full bg-muted',
    },
    variants: {
        checked: {
            // The thumb slides with an animation (Switch component)
            true: { control: 'border-primary bg-primary', thumb: 'bg-on-primary' },
        },
        invalid: {
            true: { control: 'border-danger' },
        },
    },
});
