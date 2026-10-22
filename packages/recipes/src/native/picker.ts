import { pressable, tv } from './tv.js';

// Select, radio group, menu, toast and tooltip for React Native. Lists open as a sheet from the bottom –
// the mobile pattern for pickers and action menus.

/** Bottom sheet shared by Select and Menu */
const sheet = {
    backdrop: 'flex-1 justify-end bg-black/60',
    dismissArea: 'absolute inset-0',
    sheet: 'max-h-[70%] rounded-t-2xl border-t border-line-2 bg-card pb-6',
    sheetHeader: 'flex-row items-center justify-between gap-3 border-b border-line py-3 pr-3 pl-5',
    sheetTitle: 'font-sans-semibold text-base text-fg',
    close: ['size-8 items-center justify-center rounded-full', pressable, 'active:bg-line active:opacity-100'],
    closeIcon: 'size-4 text-muted',
    list: 'px-2 pt-2',
    description: 'px-5 pt-3 font-sans text-sm leading-[22px] text-muted',
    footer: 'flex-row flex-wrap justify-end gap-2 border-t border-line px-4 pt-3',
};

/** Heights of a bottom sheet (Drawer `size`) */
export const sheetSize = tv({
    variants: {
        size: {
            sm: 'h-[30%]',
            md: 'h-[50%]',
            lg: 'h-[70%] max-h-[70%]',
            xl: 'h-[85%] max-h-[85%]',
            full: 'h-full max-h-full rounded-none border-t-0',
        },
    },
});

export const select = tv({
    slots: {
        trigger: [
            'h-10 w-full flex-row items-center justify-between gap-2.5 rounded-lg border border-line-strong bg-bg pr-2.5 pl-3',
            pressable,
            'active:opacity-100',
        ],
        value: 'min-w-0 flex-1 flex-row items-center gap-2',
        valueText: 'shrink font-sans text-[15px] text-fg',
        placeholder: 'font-sans text-[15px] text-muted',
        icon: 'size-4 shrink-0 text-muted',
        indicator: 'size-4 shrink-0 text-muted',
        ...sheet,
        option: ['h-12 flex-row items-center gap-3 rounded-lg px-3', pressable, 'active:bg-line active:opacity-100'],
        optionText: 'flex-1 font-sans text-[15px] text-fg',
        optionCheck: 'size-[18px] text-fg',
        /** Check box of an option (MultiSelect): centred in the row */
        optionBox: 'mt-0',
        /** Trigger plus clear button side by side (a button may not contain another) */
        field: 'relative w-full',
        /** Clear button over the end of the trigger, before the chevron (clearable) */
        clear: ['absolute top-0 right-8 bottom-0 w-11 items-center justify-center', pressable],
        clearIcon: 'size-4 text-muted',
        spinner: 'shrink-0 text-muted',
        /** Search field at the top of the sheet (filter) */
        search: 'mx-4 mt-3 w-auto',
        /** Heading of a group of options */
        groupLabel: 'px-3 pt-3 pb-1 font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        /** Rows at the end of the list: loading, empty, "Load more" */
        status: 'flex-row items-center gap-2 px-3 py-3',
        statusText: 'font-sans text-[15px] text-muted',
        /** "Select all" above the options and the limit hint (max) */
        selectAll: 'border-b border-line px-2 pt-2 pb-1',
        hint: 'px-5 pt-2 font-sans text-xs text-muted',
        /** Selected items as chips in the trigger (display "chips") */
        chips: 'min-w-0 flex-1 flex-row flex-wrap gap-1 py-1',
        chip: 'h-6 flex-row items-center rounded-full bg-line px-2',
        chipText: 'font-sans-medium text-xs text-fg',
        /** Option of an inline list (Autocomplete, Listbox) */
        inlineList: 'mt-1 overflow-hidden rounded-lg border border-line-2 bg-card p-1',
    },
    variants: {
        open: {
            true: { trigger: 'border-primary' },
        },
        size: {
            sm: { trigger: 'h-8 rounded-md pl-2.5', valueText: 'text-[13px]', placeholder: 'text-[13px]' },
            md: {},
            lg: { trigger: 'h-12 rounded-[10px] pl-4', valueText: 'text-base', placeholder: 'text-base' },
        },
        /** The chips make the trigger grow with them */
        hasChips: {
            true: { trigger: 'h-auto min-h-10 py-1' },
        },
        /** Room for the clear button */
        withClear: {
            true: { value: 'mr-10' },
        },
        invalid: {
            true: { trigger: 'border-danger' },
        },
        disabled: {
            true: { trigger: 'border-line bg-bg-2', valueText: 'text-muted' },
        },
        selected: {
            true: { option: 'bg-line' },
        },
        /** Highlighted option of an inline list (arrow keys on the web) */
        highlighted: {
            true: { option: 'bg-line/60' },
        },
    },
});

export const radioGroup = tv({
    slots: {
        base: 'gap-2.5',
        label: 'font-sans-medium text-[13px] text-fg',
        requiredIndicator: 'text-danger',
        items: 'gap-x-[18px] gap-y-2.5',
        /** Cards in a grid (columns) – each cell gets its width from the component */
        grid: 'flex-row flex-wrap -m-1',
        item: ['flex-row items-center gap-2', pressable],
        control: 'size-[18px] shrink-0 items-center justify-center rounded-full border border-line-strong',
        dot: 'size-2 rounded-full bg-primary',
        itemLabel: 'font-sans-medium text-sm text-fg',
    },
    variants: {
        orientation: {
            horizontal: { items: 'flex-row flex-wrap' },
            vertical: { items: 'flex-col' },
        },
        checked: {
            true: { control: 'border-primary' },
        },
        invalid: {
            true: { control: 'border-danger' },
        },
    },
    defaultVariants: {
        orientation: 'horizontal',
    },
});

export const menu = tv({
    slots: {
        ...sheet,
        item: ['h-12 flex-row items-center gap-3 rounded-lg px-3', pressable, 'active:bg-line active:opacity-100'],
        icon: 'size-[18px] shrink-0 text-fg',
        label: 'flex-1 font-sans text-[15px] text-fg',
        /** Check of a checkbox item, dot of a radio item */
        indicator: 'size-[18px] shrink-0 items-center justify-center',
        indicatorIcon: 'size-[18px] text-primary',
        /** Chevron of an item with a submenu */
        chevron: 'size-4 shrink-0 text-muted',
        /** Heading of a group or radio group */
        groupLabel: 'px-3 pt-3 pb-1 font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        separator: 'mx-3 my-1 h-px bg-line',
        /** "Back" at the top of a submenu */
        back: ['h-12 flex-row items-center gap-2 rounded-lg px-3', pressable, 'active:bg-line active:opacity-100'],
        backLabel: 'font-sans-medium text-[15px] text-muted',
    },
    variants: {
        danger: {
            true: { icon: 'text-danger', label: 'text-danger' },
        },
        disabled: {
            true: { item: 'opacity-40' },
        },
    },
});

export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';

export const toast = tv({
    slots: {
        region: 'absolute right-4 left-4 items-center gap-2',
        root: 'w-full max-w-[400px] flex-row items-center gap-3 overflow-hidden rounded-xl bg-fg py-2.5 pr-2.5 pl-3.5',
        icon: 'size-[18px] shrink-0 text-bg',
        text: 'min-w-0 flex-1 gap-px',
        title: 'font-sans-semibold text-sm text-bg',
        description: 'font-sans text-xs text-bg/65',
        action: ['h-[30px] shrink-0 items-center justify-center rounded-full bg-bg px-3', pressable],
        actionLabel: 'font-sans-semibold text-xs text-fg',
        close: [
            'size-7 shrink-0 items-center justify-center rounded-full',
            pressable,
            'active:bg-bg/10 active:opacity-100',
        ],
        closeIcon: 'size-3.5 text-bg/65',
        /** Remaining time (showProgress) – decorative, along the bottom edge */
        progress: 'absolute right-3 bottom-1 left-3 h-0.5 overflow-hidden rounded-full bg-bg/20',
        progressRange: 'h-full rounded-full bg-bg/70',
    },
    variants: {
        placement: {
            top: { region: 'top-12' },
            bottom: { region: 'bottom-6' },
        },
    },
    defaultVariants: {
        placement: 'bottom',
    },
});

export const tooltip = tv({
    slots: {
        base: 'relative self-start',
        // Wider than the trigger and centred over it – percentage translates are not portable in RN
        anchor: 'absolute right-[-120px] bottom-full left-[-120px] mb-2 items-center',
        bubble: 'max-w-60 rounded-md bg-fg px-2.5 py-1.5',
        text: 'font-sans-medium text-xs text-bg',
    },
    variants: {
        placement: {
            top: {},
            bottom: { anchor: 'top-full bottom-auto mt-2 mb-0' },
        },
    },
    defaultVariants: {
        placement: 'top',
    },
});
