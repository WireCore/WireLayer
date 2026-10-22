import { pressable, tv } from './tv.js';

// Charts and visualisations for React Native, drawn with react-native-svg and views – no Chart.js. Same variant names
// as the web recipes (tone, size); text on tinted areas only in the token pairs the web uses.

/** Colours for react-native-svg (it takes colour values, not classes): text colour classes, resolved to a colour */
export const chartColor = tv({
    variants: {
        color: {
            primary: 'text-primary',
            info: 'text-info',
            success: 'text-success',
            warn: 'text-warn',
            danger: 'text-danger',
            muted: 'text-muted',
            /** Grid lines */
            grid: 'text-line',
            /** The zero line and the axis */
            axis: 'text-line-strong',
            /** Track behind rings and bars */
            track: 'text-line-2',
        },
    },
});

/** Swatches (legend) of the chart tones */
export const chartSwatch = tv({
    base: 'size-2.5 rounded-full',
    variants: {
        tone: {
            primary: 'bg-primary',
            info: 'bg-info',
            success: 'bg-success',
            warn: 'bg-warn',
            danger: 'bg-danger',
            muted: 'bg-muted',
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});

/**
 * BarChart, LineChart and PieChart: title, plot with axis labels, the tapped category, legend, and the data as a list
 * behind a toggle (the text alternative)
 */
export const chart = tv({
    slots: {
        base: 'w-full min-w-0 gap-3',
        title: 'font-sans-semibold text-sm text-fg',
        plot: 'relative w-full',
        axisLabel: 'absolute font-mono text-[10px] text-muted',
        selection: 'min-h-7 flex-row flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md bg-bg-2 px-2 py-1',
        selectionLabel: 'font-sans-semibold text-xs text-fg',
        selectionValue: 'font-sans text-xs text-fg',
        references: 'font-sans text-xs text-muted',
        legend: 'flex-row flex-wrap gap-x-4 gap-y-1.5',
        legendItem: 'flex-row items-center gap-1.5',
        legendLabel: 'font-sans text-[13px] text-fg',
        legendValue: 'font-mono text-xs text-muted',
        pieLayout: 'flex-row flex-wrap items-center gap-6',
        pieLegend: 'min-w-40 flex-1 gap-1.5',
        pieLegendLabel: 'min-w-0 flex-1 font-sans text-[13px] text-fg',
        toggle: ['min-h-11 flex-row items-center gap-1.5 self-start', pressable],
        toggleLabel: 'font-sans-medium text-[13px] text-muted',
        toggleIcon: 'size-4 text-muted',
        dataList: 'w-full border-t border-line',
        dataRow: 'flex-row items-start justify-between gap-4 border-b border-line py-2',
        dataLabel: 'min-w-0 flex-1 font-sans-medium text-sm text-fg',
        dataValues: 'max-w-[65%] shrink items-end gap-0.5',
        dataValue: 'text-right font-sans text-sm text-fg',
    },
});

/** Sparkline: a small line without axes */
export const sparkline = tv({
    base: 'self-start',
});

/** A list of labels with a bar behind each one, proportional to its value; the value at the end */
export const barsList = tv({
    slots: {
        base: 'w-full min-w-0 gap-2',
        title: 'font-sans-semibold text-sm text-fg',
        header: 'flex-row justify-between gap-4 px-2',
        headerLabel: 'font-mono text-[10px] tracking-[0.9px] text-muted uppercase',
        list: 'gap-1.5',
        item: 'relative min-h-8 flex-row items-center gap-4 overflow-hidden rounded-md px-2',
        /** A row that opens something: the whole row is the target (44 pt) */
        link: ['relative min-h-11 flex-row items-center gap-4 overflow-hidden rounded-md px-2', pressable],
        bar: 'absolute top-0 bottom-0 left-0 rounded-md',
        label: 'min-w-0 flex-1 font-sans text-sm text-fg',
        linkLabel: 'min-w-0 flex-1 font-sans-medium text-sm text-fg underline',
        value: 'font-mono text-[13px] text-fg',
    },
    variants: {
        tone: {
            primary: { bar: 'bg-primary/25' },
            info: { bar: 'bg-info/25' },
            success: { bar: 'bg-success/25' },
            warn: { bar: 'bg-warn/25' },
            danger: { bar: 'bg-danger/25' },
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});

/** Funnel: stages as centred bars that narrow with the value, the conversion between them */
export const funnel = tv({
    slots: {
        base: 'w-full min-w-0 gap-3',
        title: 'font-sans-semibold text-sm text-fg',
        stages: 'gap-1',
        stage: 'flex-row items-center gap-3',
        label: 'w-24 font-sans text-[13px] text-fg',
        track: 'flex-1 items-center',
        bar: 'h-9 rounded-md',
        value: 'w-16 text-right font-mono text-[13px] text-fg',
        conversionRow: 'flex-row gap-3',
        conversionStart: 'w-24',
        conversion: 'flex-1 text-center font-sans text-xs text-muted',
        conversionEnd: 'w-16',
    },
    variants: {
        tone: {
            primary: { bar: 'bg-primary' },
            info: { bar: 'bg-info' },
            success: { bar: 'bg-success' },
            warn: { bar: 'bg-warn' },
            danger: { bar: 'bg-danger' },
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});

/** Bullet chart: the value as a bar over qualitative bands, the target as a marker (role meter) */
export const bulletChart = tv({
    slots: {
        base: 'w-full min-w-0 gap-1.5',
        header: 'gap-0.5',
        label: 'font-sans-medium text-sm text-fg',
        description: 'font-sans text-xs text-muted',
        meter: 'relative h-6 w-full overflow-hidden rounded-md bg-bg-2',
        band: 'absolute top-0 bottom-0 left-0',
        bar: 'absolute top-1.5 bottom-1.5 left-0 rounded-sm',
        target: 'absolute top-[3px] bottom-[3px] -ml-px w-0.5 bg-fg',
        values: 'flex-row justify-between gap-2',
        current: 'font-mono text-xs text-fg',
        scale: 'font-mono text-xs text-muted',
    },
    variants: {
        /** Band 0 is the widest (lightest), 2 the narrowest */
        band: {
            '0': { band: 'bg-line' },
            '1': { band: 'bg-line-2' },
            '2': { band: 'bg-line-strong/40' },
        },
        tone: {
            primary: { bar: 'bg-primary' },
            info: { bar: 'bg-info' },
            success: { bar: 'bg-success' },
            warn: { bar: 'bg-warn' },
            danger: { bar: 'bg-danger' },
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});

/** Radial bars: one ring per item, inside each other; the legend with the values is the text */
export const radialBar = tv({
    slots: {
        base: 'flex-row flex-wrap items-center gap-6 self-start',
        title: 'w-full font-sans-semibold text-sm text-fg',
        legend: 'gap-1.5',
        legendItem: 'flex-row items-center gap-2',
        legendLabel: 'font-sans text-sm text-fg',
        legendValue: 'pl-3 font-mono text-[13px] text-muted',
    },
});

/** Heatmap: a grid of values; the cell colour grows with the value (5 levels), the value stays as text */
export const heatmap = tv({
    slots: {
        base: 'w-full min-w-0 gap-2',
        caption: 'font-sans-semibold text-sm text-fg',
        table: 'gap-1',
        row: 'flex-row gap-1',
        corner: 'w-14',
        columnHeader: 'w-11 items-center justify-end pb-0.5',
        columnHeaderText: 'font-mono text-[10px] text-muted uppercase',
        rowHeader: 'w-14 justify-center pr-1',
        rowHeaderText: 'text-right font-sans text-xs text-muted',
        cell: 'h-9 w-11 items-center justify-center rounded-md',
        // Up to level 3 the text stays in the text colour (contrast in every theme), level 4 is the full primary
        cellText: 'font-mono text-xs text-fg',
        empty: 'font-mono text-xs text-muted',
        legend: 'flex-row items-center gap-1.5',
        legendText: 'font-sans text-xs text-muted',
        legendCell: 'size-3.5 rounded-sm',
    },
    variants: {
        level: {
            none: { cell: 'border border-line' },
            '0': { cell: 'bg-bg-2', legendCell: 'bg-bg-2' },
            '1': { cell: 'bg-primary/12', legendCell: 'bg-primary/12' },
            '2': { cell: 'bg-primary/28', legendCell: 'bg-primary/28' },
            '3': { cell: 'bg-primary/40', legendCell: 'bg-primary/40' },
            '4': { cell: 'bg-primary', cellText: 'text-on-primary', legendCell: 'bg-primary' },
        },
    },
});

/** Treemap: areas proportional to the values; a list, laid out as tiles */
export const treemap = tv({
    slots: {
        base: 'w-full min-w-0 gap-2',
        title: 'font-sans-semibold text-sm text-fg',
        list: 'relative w-full overflow-hidden rounded-xl',
        tile: 'absolute justify-end gap-0.5 overflow-hidden rounded-lg border-2 border-card p-2',
        tileLabel: 'font-sans-semibold text-xs text-fg',
        tileValue: 'font-mono text-[11px] text-fg',
    },
    variants: {
        tone: {
            primary: { tile: 'bg-primary/15' },
            info: { tile: 'bg-info/18' },
            success: { tile: 'bg-success/18' },
            warn: { tile: 'bg-warn/18' },
            danger: { tile: 'bg-danger/18' },
        },
    },
});

/** Sankey: flows as bands between nodes in columns; the flows as a list are the text */
export const sankey = tv({
    slots: {
        base: 'w-full min-w-0 gap-3',
        title: 'font-sans-semibold text-sm text-fg',
        plot: 'relative w-full',
        // On a backing of the card colour: the text stays readable over the tinted bands
        nodeLabel: 'absolute rounded-sm bg-card/85 px-1 font-sans-medium text-[11px] text-fg',
        nodeValue: 'font-mono text-[10px] text-muted',
    },
});
