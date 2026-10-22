import { focusRing, pressable, tv } from './tv.js';

// Display and accessibility building blocks: statistic, truncated text, overflow list, toggletip, selectable cards,
// checkbox and switch groups, visually hidden text, skip links, hotkeys, persona, inline editing, search field and
// the AI label

/** Key figure: label, value with prefix/suffix, trend (arrow and text, never colour alone) and an optional chart */
export const statistic = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-1.5',
        header: 'flex items-center justify-between gap-2',
        label: 'font-mono text-[11px] tracking-label text-muted uppercase',
        icon: 'size-4 shrink-0 text-muted',
        value: 'flex flex-wrap items-baseline gap-x-1 font-semibold tracking-[-0.02em] text-fg tabular-nums',
        affix: 'font-medium text-muted',
        /** Placeholder for the value while loading */
        placeholder: 'inline-block h-[1em] w-24 rounded bg-line motion-safe:animate-pulse forced-colors:border',
        footer: 'flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted',
        trend: 'inline-flex items-center gap-1 font-medium tabular-nums',
        trendIcon: 'size-3.5 shrink-0',
        /** Space for a sparkline or another small chart */
        chart: 'mt-1 h-10 w-full',
        description: 'text-xs text-muted',
    },
    variants: {
        size: {
            sm: { value: 'text-xl' },
            md: { value: 'text-[28px] leading-9' },
            lg: { value: 'text-4xl' },
        },
        /** Colour of the trend – always together with the arrow and the text */
        tone: {
            positive: { trend: 'text-success' },
            negative: { trend: 'text-danger' },
            neutral: { trend: 'text-muted' },
        },
        /** In a card with border and padding */
        bordered: {
            true: { base: 'rounded-card border border-line bg-card p-5' },
        },
    },
    defaultVariants: {
        size: 'md',
        tone: 'neutral',
    },
});

/** Text cut to one or more lines; the full text in a tooltip or behind a "Show more" button */
export const truncate = tv({
    slots: {
        base: 'min-w-0',
        text: 'block min-w-0 rounded-sm',
        toggle: [
            'mt-1 inline-flex min-h-6 cursor-pointer items-center text-sm font-medium text-fg underline underline-offset-2 hover:no-underline',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
    },
    variants: {
        /** one: single line with an ellipsis; many: `lines` lines (--wc-lines); all: expanded */
        clamp: {
            one: { text: 'truncate' },
            many: { text: 'line-clamp-(--wc-lines)' },
            all: { text: 'whitespace-normal' },
        },
        /** The cut text is focusable, so keyboard users reach the tooltip with the full text */
        focusable: {
            true: { text: 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg' },
        },
    },
    defaultVariants: {
        clamp: 'one',
    },
});

/** Items in a row; what does not fit goes behind a "+N" button */
export const overflowList = tv({
    slots: {
        base: 'relative m-0 flex min-w-0 list-none flex-wrap items-center gap-1.5 p-0',
        item: 'flex min-w-0 shrink-0',
        more: [
            'inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full border border-line-2 px-2.5 text-[13px] font-medium whitespace-nowrap text-fg',
            ...pressable,
            'hover:border-fg',
        ],
        /** The items behind the button, in the popover */
        rest: 'm-0 flex max-h-72 list-none flex-wrap gap-1.5 overflow-y-auto p-0',
        restItem: 'flex min-w-0',
    },
    variants: {
        /** Measured as not fitting: out of the flow and invisible, still measurable */
        overflowed: {
            true: { item: 'pointer-events-none invisible absolute' },
        },
        /** One row without wrapping (default) or up to `maxRows` rows */
        wrap: {
            single: { base: 'flex-nowrap overflow-hidden' },
            rows: { base: 'overflow-hidden' },
        },
    },
    defaultVariants: {
        wrap: 'single',
    },
});

/** (i) button next to a label; a click shows the explanation in a bubble that is announced (role="status") */
export const toggletip = tv({
    slots: {
        base: 'relative inline-flex align-middle',
        trigger: [
            'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition-colors',
            'hover:bg-line hover:text-fg aria-expanded:text-fg motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        icon: 'size-4',
        bubble: [
            'absolute start-0 top-full z-50 mt-1.5 w-max max-w-[min(18rem,calc(100vw-2rem))] rounded-md bg-fg px-3 py-2',
            'text-start text-xs leading-normal font-medium text-bg shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)] forced-colors:border',
            'motion-safe:animate-pop-in [--wc-pop-y:-4px]',
        ],
    },
});

/** A large selectable card – checkbox or radio with title, description, icon and price */
export const selectionCard = tv({
    slots: {
        base: [
            'relative flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-card p-4 text-fg',
            'transition-colors hover:border-fg motion-reduce:transition-none',
            'data-[state=checked]:border-primary data-[state=checked]:shadow-[inset_0_0_0_1px_var(--color-primary)]',
            'data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:hover:border-line-strong data-invalid:border-danger',
            focusRing,
            'forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[state=checked]:outline-2 forced-colors:data-[state=checked]:outline-[Highlight]',
            // HTML without JavaScript: the same states from a native input inside the label
            'has-[input:checked]:border-primary has-[input:checked]:shadow-[inset_0_0_0_1px_var(--color-primary)]',
            'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-40',
            'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-fg',
        ],
        icon: 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-bg-2 text-fg',
        iconSvg: 'size-[18px]',
        body: 'flex min-w-0 flex-1 flex-col gap-0.5',
        /** Title and price in one line – the price moves below the title when the card is narrow */
        heading: 'flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5',
        title: 'min-w-0 text-sm font-semibold text-fg',
        description: 'text-[13px] leading-snug text-muted',
        price: 'text-sm font-semibold text-fg tabular-nums',
        /** The check mark / radio dot in the corner */
        control: [
            'flex size-[18px] shrink-0 items-center justify-center border border-line-strong text-on-primary',
            'transition-colors motion-reduce:transition-none',
            'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
            'forced-colors:data-[state=checked]:forced-color-adjust-none forced-colors:data-[state=checked]:border-[Highlight] forced-colors:data-[state=checked]:bg-[Highlight] forced-colors:data-[state=checked]:text-[HighlightText]',
        ],
        controlIcon: 'size-[13px] stroke-3',
        /** HTML without JavaScript: the native checkbox or radio as the control */
        input: 'm-0 size-[18px] shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed',
    },
    variants: {
        type: {
            checkbox: { control: 'rounded-[5px]' },
            radio: {
                control:
                    'rounded-full data-[state=checked]:bg-transparent after:size-2 after:rounded-full data-[state=checked]:after:bg-primary forced-colors:data-[state=checked]:after:bg-[Highlight]',
            },
        },
    },
    defaultVariants: {
        type: 'checkbox',
    },
});

/** A group of checkboxes or switches with label, helper and error text */
export const checkboxGroup = tv({
    slots: {
        base: 'm-0 flex min-w-0 flex-col gap-2.5 border-0 p-0',
        label: 'text-[13px] font-medium text-fg',
        requiredIndicator: 'ms-0.5 text-danger',
        items: 'flex gap-x-[18px] gap-y-2.5',
        helperText: 'text-xs text-muted',
        errorText: 'text-xs text-danger',
    },
    variants: {
        orientation: {
            vertical: { items: 'flex-col' },
            horizontal: { items: 'flex-row flex-wrap' },
        },
        /** Cards in a grid of `--wc-columns` columns (one column on small screens) */
        grid: {
            true: { items: 'grid grid-cols-1 gap-3 sm:grid-cols-[repeat(var(--wc-columns),minmax(0,1fr))]' },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

/** Text only for screen readers (optionally shown while focused, e.g. a link) */
export const visuallyHidden = tv({
    base: 'sr-only',
    variants: {
        focusable: {
            true: 'focus:not-sr-only focus-within:not-sr-only',
        },
    },
});

/** Live regions for announcements – one per politeness, invisible */
export const liveAnnouncer = tv({
    base: 'sr-only',
});

/** Several skip links: each appears at the top left while focused */
export const skipLinks = tv({
    slots: {
        base: 'static',
        list: 'm-0 list-none p-0',
        link: [
            'sr-only focus:not-sr-only focus:fixed focus:top-3 focus:inset-s-3 focus:z-[60] focus:rounded-lg focus:bg-primary',
            'focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
    },
});

/** Several keys of a shortcut side by side (Kbd `hotkey`) */
export const kbdGroup = tv({
    base: 'inline-flex items-center gap-1 align-middle',
});

/** Overview of the registered shortcuts, grouped */
export const hotkeysDialog = tv({
    slots: {
        base: 'flex flex-col gap-5',
        group: 'flex flex-col gap-1',
        groupTitle: 'm-0 font-mono text-[11px] tracking-label text-muted uppercase',
        list: 'm-0 flex flex-col',
        row: 'flex items-center justify-between gap-4 border-b border-line py-2 last:border-b-0',
        description: 'm-0 text-sm text-fg',
        keys: 'm-0 flex shrink-0 flex-wrap items-center gap-1',
        empty: 'text-sm text-muted',
    },
});

/** Person: avatar, name, role or description and presence */
export const persona = tv({
    slots: {
        base: 'inline-flex max-w-full min-w-0 items-center text-start',
        /** Wrapper of the avatar – hidden from screen readers, the name follows as text */
        avatar: 'flex shrink-0',
        body: 'flex min-w-0 flex-col',
        name: 'truncate font-semibold text-fg',
        description: 'truncate text-muted',
        presence: 'mt-1 self-start',
    },
    variants: {
        size: {
            sm: { base: 'gap-2', name: 'text-[13px]', description: 'text-xs' },
            md: { base: 'gap-3', name: 'text-sm', description: 'text-[13px]' },
            lg: { base: 'gap-3.5', name: 'text-base', description: 'text-sm' },
        },
        /** A link or button: hover background and focus ring */
        interactive: {
            true: {
                base: [
                    '-m-1.5 cursor-pointer rounded-lg p-1.5 no-underline transition-colors hover:bg-line motion-reduce:transition-none',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
                ],
            },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Value shown as text; editing swaps in (or opens) an editor with save and cancel */
export const inlineEdit = tv({
    slots: {
        base: 'inline-flex max-w-full min-w-0 flex-col gap-1',
        display: [
            '-mx-1.5 -my-1 inline-flex min-h-7 max-w-full cursor-text items-center gap-1.5 rounded-md px-1.5 py-1 text-start text-fg hover:bg-line',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        value: 'min-w-0 truncate',
        placeholder: 'text-muted italic',
        editIcon: 'size-3.5 shrink-0 text-muted',
        hint: 'sr-only',
        form: 'flex flex-col gap-1.5',
        row: 'flex items-start gap-1.5',
        editor: 'min-w-0 flex-1',
        actions: 'flex shrink-0 items-center gap-1',
        error: 'text-xs text-danger',
    },
});

/** Search form: optional scope, field with magnifier, clear button and spinner */
export const searchField = tv({
    slots: {
        base: 'flex w-full min-w-0 items-stretch gap-2',
        scope: 'w-auto shrink-0',
        field: 'min-w-0 flex-1',
        /** The text field: no second, native clear button of type="search" */
        control: '[&::-webkit-search-cancel-button]:appearance-none',
    },
});

/** "AI-generated" with an explanation behind a toggletip */
export const aiLabel = tv({
    slots: {
        base: 'inline-flex items-center gap-0.5 align-middle',
        badge: [
            'inline-flex h-6 items-center gap-1 rounded-full border border-line-2 px-2 font-mono text-[10.5px] font-medium tracking-label whitespace-nowrap text-fg uppercase',
            'forced-colors:border-[CanvasText]',
        ],
        icon: 'size-3 shrink-0 text-primary',
    },
    variants: {
        size: {
            sm: { badge: 'h-5 px-1.5 text-[9.5px]' },
            md: { badge: 'h-6' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Wrapper of ConfigProvider when it sets theme, mode or direction for a part of the page */
export const configProvider = tv({
    base: 'text-fg',
});

/** Formatted values (FormatDate, FormatRelativeTime, FormatBytes, FormatList): digits of the same width */
export const formatValue = tv({
    base: 'tabular-nums',
});
