import { pressable, tv } from './tv.js';

// Display components for React Native (RN part 2): lists of facts, numbers, formatted values, text helpers,
// timeline, charts of a value, media, QR code, watermark and Markdown

export const dataList = tv({
    slots: {
        base: 'w-full',
        item: 'gap-0.5 py-2.5',
        label: 'font-mono text-[11px] tracking-[0.6px] text-muted uppercase',
        value: 'font-sans text-[15px] leading-[22px] text-fg',
    },
    variants: {
        orientation: {
            vertical: {},
            horizontal: { item: 'flex-row items-baseline gap-4', label: 'w-2/5 shrink-0', value: 'min-w-0 flex-1' },
        },
        divided: {
            true: { item: 'border-b border-line' },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

export const descriptions = tv({
    slots: {
        base: 'w-full gap-3',
        header: 'flex-row items-center justify-between gap-3',
        title: 'min-w-0 flex-1 font-sans-semibold text-base text-fg',
        actions: 'flex-row items-center gap-2',
        grid: 'flex-row flex-wrap',
        item: 'gap-1 py-2 pr-4',
        label: 'font-sans text-[13px] text-muted',
        value: 'font-sans-medium text-[15px] text-fg',
    },
    variants: {
        orientation: {
            vertical: {},
            horizontal: { item: 'flex-row items-baseline gap-3', label: 'w-2/5 shrink-0', value: 'min-w-0 flex-1' },
        },
        bordered: {
            true: {
                grid: 'overflow-hidden rounded-card border border-line',
                item: 'border-b border-line px-4 py-3',
                label: 'font-sans-medium',
            },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

export const statistic = tv({
    slots: {
        base: 'gap-1',
        header: 'flex-row items-center gap-1.5',
        icon: 'size-4 text-muted',
        label: 'font-sans text-[13px] text-muted',
        valueRow: 'flex-row flex-wrap items-baseline gap-1',
        affix: 'font-sans text-base text-muted',
        value: 'font-sans-semibold text-[28px] tracking-[-0.6px] text-fg',
        trendRow: 'flex-row flex-wrap items-center gap-1.5',
        trend: 'flex-row items-center gap-0.5 rounded-full px-1.5 py-0.5',
        trendIcon: 'size-3.5',
        trendValue: 'font-mono text-xs',
        trendLabel: 'font-sans text-xs text-muted',
        description: 'font-sans text-[13px] leading-5 text-muted',
        placeholder: 'h-8 w-28 rounded-md bg-line',
        chart: 'pt-2',
    },
    variants: {
        tone: {
            positive: { trend: 'bg-success/14', trendIcon: 'text-success', trendValue: 'text-success' },
            negative: { trend: 'bg-danger/14', trendIcon: 'text-danger', trendValue: 'text-danger' },
            neutral: { trend: 'bg-line', trendIcon: 'text-muted', trendValue: 'text-fg' },
        },
        size: {
            sm: { value: 'text-xl tracking-[-0.4px]' },
            md: {},
            lg: { value: 'text-4xl tracking-[-0.8px]' },
        },
        bordered: {
            true: { base: 'rounded-card border border-line bg-card p-5' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const countdown = tv({
    slots: {
        base: 'flex-row flex-wrap gap-2',
        unit: 'items-center gap-1',
        value: 'font-mono text-2xl text-fg',
        label: 'font-sans text-[11px] text-muted',
    },
    variants: {
        variant: {
            boxed: { unit: 'min-w-16 rounded-xl border border-line bg-card px-3 py-2.5' },
            plain: { base: 'gap-4' },
        },
        size: {
            sm: { value: 'text-lg', unit: 'min-w-12' },
            md: {},
            lg: { value: 'text-4xl' },
        },
    },
    defaultVariants: {
        variant: 'boxed',
        size: 'md',
    },
});

/** Formatted numbers, dates, sizes and lists (NumberFormatter, Format…) */
export const formatValue = tv({
    base: 'font-sans text-fg',
});

export const truncate = tv({
    slots: {
        base: 'items-start gap-1',
        text: 'font-sans text-[15px] leading-[22px] text-fg',
        /** Invisible copy of the whole text, measured to know whether the shown one is cut */
        measure: 'absolute right-0 left-0 opacity-0',
        toggle: ['min-h-11 justify-center', pressable],
        toggleLabel: 'font-sans-medium text-sm text-primary',
    },
});

export const overflowList = tv({
    slots: {
        root: 'relative w-full',
        base: 'w-full flex-row flex-wrap items-center gap-1.5',
        /** Invisible row of all items, measured to know how many fit */
        measure: 'absolute top-0 left-0 flex-row gap-1.5 opacity-0',
        more: ['h-8 min-w-11 items-center justify-center rounded-full bg-line px-2.5', pressable],
        moreLabel: 'font-sans-medium text-xs text-fg',
        sheetList: 'gap-2 px-3 pb-2',
    },
});

export const persona = tv({
    slots: {
        base: 'flex-row items-center gap-3 self-start',
        avatar: 'relative',
        presence: 'absolute -right-0.5 -bottom-0.5 rounded-full border-2 border-card',
        text: 'min-w-0 shrink gap-0.5',
        name: 'font-sans-semibold text-fg',
        description: 'font-sans text-muted',
        status: 'flex-row items-center gap-1',
        dot: 'size-2 rounded-full',
        statusLabel: 'font-sans text-xs text-muted',
    },
    variants: {
        size: {
            sm: { name: 'text-[13px]', description: 'text-xs', presence: 'size-2.5' },
            md: { name: 'text-[15px]', description: 'text-[13px]', presence: 'size-3' },
            lg: { name: 'text-base', description: 'text-sm', presence: 'size-3.5' },
        },
        presence: {
            online: { presence: 'bg-success', dot: 'bg-success' },
            away: { presence: 'bg-warn', dot: 'bg-warn' },
            busy: { presence: 'bg-danger', dot: 'bg-danger' },
            offline: { presence: 'bg-muted', dot: 'bg-muted' },
        },
        interactive: {
            true: { base: ['min-h-11 rounded-lg', pressable] },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const aiLabel = tv({
    slots: {
        base: 'flex-row items-center gap-1 self-start',
        chip: 'h-6 flex-row items-center gap-1 rounded-full bg-primary/10 px-2',
        icon: 'size-3.5 text-primary',
        label: 'font-sans-medium text-xs text-primary',
    },
    variants: {
        size: {
            sm: { chip: 'h-5 px-1.5', icon: 'size-3', label: 'text-[11px]' },
            md: {},
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const highlight = tv({
    base: 'rounded-sm text-fg',
    variants: {
        color: {
            warn: 'bg-warn/25',
            info: 'bg-info/20',
            success: 'bg-success/20',
            danger: 'bg-danger/20',
            primary: 'bg-primary/20',
        },
    },
    defaultVariants: {
        color: 'warn',
    },
});

export const spoiler = tv({
    slots: {
        base: 'w-full items-start gap-1',
        content: 'w-full overflow-hidden',
        toggle: ['min-h-11 justify-center', pressable],
        toggleLabel: 'font-sans-medium text-sm text-primary',
    },
});

export const kbd = tv({
    slots: {
        group: 'flex-row flex-wrap items-center gap-1',
        key: 'h-6 min-w-6 items-center justify-center rounded-md border border-b-2 border-line-2 bg-bg-2 px-1.5',
        keyLabel: 'font-mono text-[11px] text-fg',
        then: 'font-sans text-xs text-muted',
    },
});

export const timeline = tv({
    slots: {
        base: 'w-full',
        item: 'flex-row gap-3',
        side: 'min-w-0 flex-1',
        opposite: 'min-w-0 flex-1 items-end pt-1',
        oppositeText: 'text-right font-mono text-[11px] text-muted',
        rail: 'w-7 items-center',
        marker: 'size-7 items-center justify-center rounded-full border-2 border-line-2 bg-card',
        markerIcon: 'size-3.5',
        line: 'w-0.5 flex-1 bg-line',
        content: 'min-w-0 flex-1 gap-0.5 pb-6',
        time: 'font-mono text-[11px] text-muted',
        title: 'font-sans-semibold text-[15px] text-fg',
        description: 'font-sans text-sm leading-[22px] text-muted',
        more: 'pt-2',
    },
    variants: {
        status: {
            neutral: { markerIcon: 'text-fg' },
            success: { marker: 'border-success', markerIcon: 'text-success' },
            info: { marker: 'border-info', markerIcon: 'text-info' },
            warn: { marker: 'border-warn', markerIcon: 'text-warn' },
            danger: { marker: 'border-danger', markerIcon: 'text-danger' },
        },
        active: {
            true: { marker: 'border-primary bg-primary', markerIcon: 'text-on-primary' },
        },
        /** `end`: the content on the left of the rail (alternate: every second item) */
        reversed: {
            true: {
                item: 'flex-row-reverse',
                content: 'items-end',
                title: 'text-right',
                description: 'text-right',
                opposite: 'items-start',
                oppositeText: 'text-left',
            },
        },
    },
    defaultVariants: {
        status: 'neutral',
    },
});

/** Progress segments, stripes and steps (Progress); the bar itself is `progress` */
export const progressParts = tv({
    slots: {
        segment: 'h-full',
        steps: 'h-1.5 flex-row gap-1',
        step: 'h-full flex-1 rounded-[3px] bg-line-2',
        stripes: 'absolute inset-0',
        legend: 'flex-row flex-wrap gap-x-4 gap-y-1 pt-1',
        legendItem: 'flex-row items-center gap-1.5',
        swatch: 'size-2.5 rounded-sm',
        legendLabel: 'font-sans text-xs text-muted',
        verticalTrack: 'h-32 w-1.5 justify-end overflow-hidden rounded-[3px] bg-line-2',
        verticalRange: 'w-full rounded-[3px] bg-primary',
        /** The track as a row (segments side by side) */
        track: 'h-1.5 flex-row overflow-hidden rounded-[3px] bg-line-2',
    },
    variants: {
        filled: {
            true: { step: 'bg-primary' },
        },
    },
});

/** Colours of meters and segments (`MeterColor`) */
export const meterColor = tv({
    variants: {
        color: {
            primary: 'bg-primary',
            info: 'bg-info',
            success: 'bg-success',
            warn: 'bg-warn',
            danger: 'bg-danger',
            muted: 'bg-muted',
        },
    },
});

/** Stroke colours for the SVG rings and arcs (resolved to a colour value) */
export const strokeColor = tv({
    variants: {
        color: {
            primary: 'text-primary',
            info: 'text-info',
            success: 'text-success',
            warn: 'text-warn',
            danger: 'text-danger',
            muted: 'text-muted',
            neutral: 'text-fg',
            track: 'text-line-2',
        },
    },
});

export const ringChart = tv({
    slots: {
        base: 'items-center gap-2 self-start',
        ring: 'relative items-center justify-center',
        center: 'absolute inset-0 items-center justify-center',
        value: 'font-sans-semibold text-fg',
        label: 'text-center font-sans text-[13px] text-muted',
        legend: 'gap-1 pt-1',
        legendItem: 'flex-row items-center gap-1.5',
        swatch: 'size-2.5 rounded-sm',
        legendLabel: 'font-sans text-xs text-muted',
        legendValue: 'font-mono text-xs text-fg',
    },
    variants: {
        size: {
            sm: { ring: 'size-16', value: 'text-sm' },
            md: { ring: 'size-24', value: 'text-lg' },
            lg: { ring: 'size-32', value: 'text-2xl' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

export const meterGroup = tv({
    slots: {
        base: 'w-full gap-2',
        label: 'font-sans-medium text-[13px] text-fg',
        stackLayout: 'gap-2',
        sideLayout: 'flex-row items-center gap-4',
        /** The bar beside the legend shares the row */
        barBeside: 'w-auto min-w-0 flex-1',
        bar: 'h-2 w-full flex-row gap-0.5 overflow-hidden rounded-full bg-line-2',
        segment: 'h-full',
        legend: 'flex-row flex-wrap gap-x-4 gap-y-1',
        legendItem: 'flex-row items-center gap-1.5',
        swatch: 'size-2.5 rounded-sm',
        legendLabel: 'font-sans text-xs text-muted',
        legendValue: 'font-mono text-xs text-fg',
    },
    variants: {
        orientation: {
            horizontal: {},
            vertical: { bar: 'h-40 w-3 flex-col-reverse justify-start' },
        },
        legendLayout: {
            inline: {},
            stacked: { legend: 'flex-col' },
        },
    },
    defaultVariants: {
        orientation: 'horizontal',
        legendLayout: 'inline',
    },
});

export const gauge = tv({
    slots: {
        base: 'items-center gap-1 self-start',
        arc: 'relative',
        value: 'absolute right-0 bottom-1 left-0 text-center font-sans-semibold text-fg',
        scale: 'w-full flex-row justify-between px-1',
        scaleLabel: 'font-mono text-[10.5px] text-muted',
        label: 'text-center font-sans text-[13px] text-muted',
    },
    variants: {
        size: {
            sm: { value: 'text-base' },
            md: { value: 'text-2xl' },
            lg: { value: 'text-3xl' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Pixel sizes of the gauge (SVG viewBox 120 × 74) */
export const gaugeSize = { sm: 120, md: 180, lg: 240 } as const;

export const image = tv({
    slots: {
        base: 'overflow-hidden rounded-xl bg-bg-2',
        image: 'size-full',
        trigger: [pressable],
        preview: 'flex-1 bg-black',
        stage: 'flex-1 items-center justify-center overflow-hidden',
        toolbar: 'absolute top-0 right-0 left-0 flex-row items-center justify-end gap-1 px-2 pt-2 ios:pt-14',
        tool: ['size-11 items-center justify-center rounded-full bg-black/50', pressable],
        toolIcon: 'size-5 text-white',
        status: 'absolute right-0 bottom-6 left-0 items-center',
        statusText: 'rounded-full bg-black/60 px-3 py-1 font-mono text-xs text-white',
    },
});

export const gallery = tv({
    slots: {
        base: 'w-full gap-2',
        stage: 'w-full overflow-hidden rounded-xl bg-bg-2',
        slide: 'items-center justify-center',
        image: 'size-full',
        caption: 'font-sans text-[13px] text-muted',
        thumbs: 'grow-0',
        thumbList: 'flex-row gap-2',
        thumb: ['size-14 overflow-hidden rounded-lg border-2 border-transparent', pressable],
        thumbImage: 'size-full',
        bar: 'flex-row items-center justify-between gap-2',
        counter: 'font-mono text-[11px] text-muted',
        fullscreen: [
            'size-11 items-center justify-center rounded-full',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        fullscreenIcon: 'size-[18px] text-fg',
    },
    variants: {
        current: {
            true: { thumb: 'border-primary' },
        },
    },
});

export const carousel = tv({
    slots: {
        base: 'w-full gap-3',
        viewport: 'w-full overflow-hidden',
        controls: 'flex-row items-center justify-between gap-2',
        arrows: 'flex-row items-center gap-1',
        arrow: [
            'size-11 items-center justify-center rounded-full border border-line-2',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        arrowIcon: 'size-4 text-fg',
        dots: 'flex-row flex-wrap items-center justify-center',
        dot: ['size-6 items-center justify-center', pressable],
        dotMark: 'size-2 rounded-full bg-line-strong',
        play: ['size-11 items-center justify-center rounded-full', pressable, 'active:bg-line active:opacity-100'],
        playIcon: 'size-4 text-fg',
    },
    variants: {
        current: {
            true: { dotMark: 'w-5 bg-primary' },
        },
        disabled: {
            true: { arrow: 'opacity-40' },
        },
    },
});

export const qrCode = tv({
    slots: {
        base: 'items-center gap-2 self-start',
        frame: 'overflow-hidden rounded-lg bg-white p-2',
        /** Modules are always black on white – scanners need the contrast */
        dark: 'text-black',
        logo: 'absolute rounded-md bg-white p-1',
        value: 'max-w-60 text-center font-mono text-xs text-muted',
    },
});

export const watermark = tv({
    slots: {
        base: 'relative overflow-hidden',
        layer: 'absolute inset-0 overflow-hidden',
        tile: 'absolute items-center justify-center',
    },
});

/** Markdown in React Native: block elements as Views, inline as nested Text */
export const prose = tv({
    slots: {
        base: 'w-full gap-3',
        p: 'font-sans text-[15px] leading-6 text-fg',
        h1: 'font-sans-semibold text-[26px] leading-8 tracking-[-0.6px] text-fg',
        h2: 'font-sans-semibold text-[22px] leading-7 tracking-[-0.4px] text-fg',
        h3: 'font-sans-semibold text-lg leading-6 text-fg',
        h4: 'font-sans-semibold text-base leading-6 text-fg',
        h5: 'font-sans-semibold text-[15px] leading-6 text-fg',
        h6: 'font-sans-semibold text-sm leading-5 text-muted',
        strong: 'font-sans-semibold',
        em: 'italic',
        del: 'line-through',
        code: 'rounded bg-bg-2 font-mono text-[13px]',
        link: 'text-primary underline',
        pre: 'rounded-lg border border-line bg-bg-2 p-3',
        preText: 'font-mono text-[13px] leading-5 text-fg',
        blockquote: 'gap-2 border-l-2 border-line-strong pl-3',
        list: 'gap-1',
        listItem: 'flex-row gap-2',
        bullet: 'w-5 font-sans text-[15px] leading-6 text-muted',
        listContent: 'min-w-0 flex-1 gap-1',
        check: 'mt-1 size-4 items-center justify-center rounded border border-line-strong',
        checkIcon: 'size-3 text-fg',
        hr: 'h-px w-full bg-line',
        table: 'overflow-hidden rounded-lg border border-line',
        row: 'flex-row border-b border-line',
        cell: 'min-w-24 flex-1 px-3 py-2 font-sans text-sm text-fg',
        headerCell: 'min-w-24 flex-1 bg-bg-2 px-3 py-2 font-sans-semibold text-sm text-fg',
    },
});
