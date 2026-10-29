import { pressable, tv } from './tv.js';

/** Text with the WireLayer fonts – plain RN `<Text>` would fall back to the system font. */
export const text = tv({
    base: 'font-sans text-fg',
    variants: {
        variant: {
            body: 'text-[15px] leading-6',
            muted: 'text-sm leading-5 text-muted',
            title: 'font-sans-semibold text-lg leading-6 tracking-[-0.4px]',
            label: 'font-mono text-[11px] tracking-[0.9px] text-muted uppercase',
        },
    },
    defaultVariants: {
        variant: 'body',
    },
});

export const badge = tv({
    slots: {
        base: 'h-[22px] shrink-0 flex-row items-center gap-1 rounded-full px-2',
        label: 'font-mono text-[10.5px]',
        icon: 'size-3',
    },
    variants: {
        variant: {
            solid: { base: 'bg-fg', label: 'text-bg', icon: 'text-bg' },
            soft: { base: 'bg-line', label: 'text-fg', icon: 'text-fg' },
            outline: { base: 'border border-line-2', label: 'text-muted', icon: 'text-muted' },
            success: { base: 'bg-success/14', label: 'text-success', icon: 'text-success' },
            info: { base: 'bg-info/14', label: 'text-info', icon: 'text-info' },
            warn: { base: 'bg-warn/14', label: 'text-warn', icon: 'text-warn' },
            danger: { base: 'bg-danger/14', label: 'text-danger', icon: 'text-danger' },
        },
        /** Round shape for a count or a single character (grows into a pill for longer content) */
        circle: {
            true: { base: 'min-w-[22px] justify-center px-1.5' },
        },
    },
    defaultVariants: {
        variant: 'soft',
    },
});

export const card = tv({
    base: 'gap-2.5 rounded-card border border-line bg-card p-6',
    variants: {
        interactive: {
            true: [pressable, 'active:border-line-2 active:opacity-100'],
        },
    },
});

/** Parts of a Card with title, subtitle, media and footer (the card itself is `card`) */
export const cardParts = tv({
    slots: {
        /** The card when it has media: the media reaches the edges, the content keeps the padding */
        frame: 'overflow-hidden p-0',
        media: 'w-full overflow-hidden',
        body: 'gap-2.5 p-6',
        /** Content of a card without media (the card keeps its padding) */
        content: 'gap-2.5',
        header: 'flex-row items-start justify-between gap-3',
        headings: 'min-w-0 flex-1 gap-0.5',
        title: 'font-sans-semibold text-base tracking-[-0.2px] text-fg',
        subtitle: 'font-sans text-sm text-muted',
        footer: 'flex-row flex-wrap items-center justify-end gap-2 border-t border-line pt-4',
    },
    variants: {
        orientation: {
            vertical: {},
            horizontal: { frame: 'flex-row', media: 'w-1/3 self-stretch', body: 'min-w-0 flex-1' },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

export const alert = tv({
    slots: {
        base: 'flex-row items-start gap-3 rounded-xl border border-line-2 bg-card py-3 pr-3 pl-3.5',
        iconBox: 'size-7 items-center justify-center rounded-lg',
        icon: 'size-4',
        content: 'min-w-0 flex-1 gap-0.5 pt-[3px]',
        title: 'font-sans-semibold text-sm text-fg',
        description: 'font-sans text-[13px] leading-5 text-muted',
        /** Buttons in the message (`actions`), below the text */
        actions: 'mt-2 flex-row flex-wrap items-center gap-2',
        dismiss: ['size-7 items-center justify-center rounded-full', pressable, 'active:bg-line active:opacity-100'],
        dismissIcon: 'size-3.5 text-muted',
    },
    variants: {
        status: {
            neutral: { iconBox: 'bg-line', icon: 'text-fg' },
            success: { iconBox: 'bg-success/14', icon: 'text-success' },
            info: { iconBox: 'bg-info/14', icon: 'text-info' },
            warn: { iconBox: 'bg-warn/14', icon: 'text-warn' },
            danger: { iconBox: 'bg-danger/14', icon: 'text-danger' },
        },
        /** `box` (default) or `simple`: only icon and text in the status colour, e.g. for a field error */
        variant: {
            box: {},
            simple: {
                base: 'items-center gap-1.5 border-0 bg-transparent p-0',
                iconBox: 'size-auto bg-transparent',
                content: 'pt-0',
            },
        },
        size: {
            sm: {
                base: 'gap-2.5 py-2 pr-2 pl-2.5',
                iconBox: 'size-6 rounded-md',
                icon: 'size-3.5',
                content: 'pt-0.5',
                title: 'text-[13px]',
                description: 'text-xs leading-[18px]',
            },
            md: {},
        },
    },
    compoundVariants: [
        { variant: 'simple', size: 'sm', class: { base: 'p-0', iconBox: 'size-auto' } },
        { variant: 'simple', status: 'neutral', class: { title: 'text-fg', description: 'text-fg' } },
        { variant: 'simple', status: 'success', class: { title: 'text-success', description: 'text-success' } },
        { variant: 'simple', status: 'info', class: { title: 'text-info', description: 'text-info' } },
        { variant: 'simple', status: 'warn', class: { title: 'text-warn', description: 'text-warn' } },
        { variant: 'simple', status: 'danger', class: { title: 'text-danger', description: 'text-danger' } },
    ],
    defaultVariants: {
        status: 'info',
        variant: 'box',
        size: 'md',
    },
});

export const avatar = tv({
    slots: {
        base: 'shrink-0 items-center justify-center overflow-hidden',
        image: 'size-full',
        label: 'font-sans-semibold',
        icon: '',
    },
    variants: {
        variant: {
            solid: { base: 'bg-fg', label: 'text-bg', icon: 'text-bg' },
            outline: { base: 'border border-line-2', label: 'text-fg', icon: 'text-fg' },
            soft: { base: 'bg-line', label: 'text-fg', icon: 'text-fg' },
        },
        size: {
            sm: { base: 'size-8', label: 'text-xs', icon: 'size-4' },
            md: { base: 'size-10', label: 'text-sm', icon: 'size-[18px]' },
            lg: { base: 'size-12', label: 'text-base', icon: 'size-5' },
            xl: { base: 'size-16', label: 'text-xl', icon: 'size-7' },
            '2xl': { base: 'size-20', label: 'text-2xl', icon: 'size-9' },
        },
        shape: {
            circle: { base: 'rounded-full' },
            square: {},
        },
        /** Tinted background in a token colour (Avatar `color`, `auto` picks one from the name) */
        color: {
            primary: { base: 'border-0 bg-primary/14', label: 'text-primary', icon: 'text-primary' },
            success: { base: 'border-0 bg-success/14', label: 'text-success', icon: 'text-success' },
            info: { base: 'border-0 bg-info/14', label: 'text-info', icon: 'text-info' },
            warn: { base: 'border-0 bg-warn/14', label: 'text-warn', icon: 'text-warn' },
            danger: { base: 'border-0 bg-danger/14', label: 'text-danger', icon: 'text-danger' },
        },
    },
    compoundVariants: [
        { shape: 'square', size: 'sm', class: { base: 'rounded-lg' } },
        { shape: 'square', size: 'md', class: { base: 'rounded-[10px]' } },
        { shape: 'square', size: 'lg', class: { base: 'rounded-xl' } },
        { shape: 'square', size: 'xl', class: { base: 'rounded-2xl' } },
        { shape: 'square', size: '2xl', class: { base: 'rounded-[20px]' } },
    ],
    defaultVariants: {
        variant: 'soft',
        size: 'md',
        shape: 'circle',
    },
});

export const spinner = tv({
    slots: {
        base: 'shrink-0',
        icon: 'text-fg',
    },
    variants: {
        size: {
            sm: { icon: 'size-3.5' },
            md: { icon: 'size-4' },
            lg: { icon: 'size-6' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const statusDot = tv({
    slots: {
        base: 'h-6 shrink-0 flex-row items-center gap-1.5 rounded-full border border-line-2 px-2.5',
        dot: 'size-1.5 shrink-0 rounded-full',
        /** Status icon instead of the dot – shape as a second cue next to colour and text */
        icon: 'size-3 shrink-0',
        label: 'font-mono text-[10.5px] text-fg',
    },
    variants: {
        status: {
            neutral: { dot: 'bg-muted', icon: 'text-muted' },
            success: { dot: 'bg-success', icon: 'text-success' },
            info: { dot: 'bg-info', icon: 'text-info' },
            warn: { dot: 'bg-warn', icon: 'text-warn' },
            danger: { dot: 'bg-danger', icon: 'text-danger' },
        },
    },
    defaultVariants: {
        status: 'neutral',
    },
});

export const progress = tv({
    slots: {
        base: 'w-full gap-1.5',
        header: 'flex-row justify-between gap-3',
        label: 'min-w-0 flex-1 font-mono text-[11px] text-muted',
        value: 'shrink-0 font-mono text-[11px] text-muted',
        track: 'h-1.5 overflow-hidden rounded-[3px] bg-line-2',
        range: 'h-full overflow-hidden rounded-[3px] bg-primary',
        /** Text in the bar (`barText`) over the empty part */
        barText: 'absolute inset-0 items-center justify-center px-1.5',
        barTextLabel: 'font-mono text-[10.5px] text-fg',
        /** The same text inside the filled part (as wide as the track), in the colour for the fill */
        barTextFill: 'absolute top-0 bottom-0 left-0 items-center justify-center px-1.5',
        barTextFillLabel: 'font-mono text-[10.5px] text-on-primary',
    },
    variants: {
        /** `xs`: small text, e.g. in a list */
        size: {
            xs: { base: 'gap-1', label: 'text-[10px]', value: 'text-[10px]' },
            md: {},
        },
        /** Colour of the filled part by its state */
        status: {
            info: { range: 'bg-info', barTextFillLabel: 'text-on-info' },
            success: { range: 'bg-success', barTextFillLabel: 'text-on-success' },
            warn: { range: 'bg-warn', barTextFillLabel: 'text-on-warn' },
            danger: { range: 'bg-danger', barTextFillLabel: 'text-on-danger' },
        },
        /** The label only names the bar; the value stays at the end */
        hideLabel: {
            true: { header: 'justify-end' },
        },
    },
    compoundVariants: [{ size: 'xs', class: { barTextLabel: 'text-[10px]', barTextFillLabel: 'text-[10px]' } }],
});
