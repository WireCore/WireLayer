import { tv } from './tv.js';

// Gauge, heatmap, treemap and sankey: plain HTML/SVG from the design tokens – no chart library, rendered on the
// server as well. Each has a text form: meter values, a real table, a list, a table of the flows.

const tones = ['primary', 'info', 'success', 'warn', 'danger'] as const;
export type VisualTone = (typeof tones)[number];
/** Colour of the n-th item when it has none */
export const toneAt = (index: number): VisualTone => tones[index % tones.length]!;

/** Half-circle meter: value arc over a track, value in the middle, min and max at the ends */
export const gauge = tv({
    slots: {
        base: 'inline-flex flex-col items-center gap-1',
        svg: 'overflow-visible',
        track: 'fill-none stroke-line-2',
        range: 'fill-none motion-safe:transition-[stroke-dasharray] forced-colors:stroke-[Highlight]',
        value: 'fill-fg font-mono text-[18px] tabular-nums',
        bounds: 'fill-muted font-mono text-[8px]',
        label: 'text-xs text-muted',
    },
    variants: {
        status: {
            neutral: { range: 'stroke-primary' },
            success: { range: 'stroke-success' },
            warn: { range: 'stroke-warn' },
            danger: { range: 'stroke-danger' },
        },
        size: {
            sm: { svg: 'w-28' },
            md: { svg: 'w-40' },
            lg: { svg: 'w-56' },
        },
    },
    defaultVariants: {
        status: 'neutral',
        size: 'md',
    },
});

/** Length of the gauge arc (radius 50) – the range is drawn with a dash of this length times the share */
export const GAUGE_ARC = Math.PI * 50;

/** Matrix of values as a table; the cell colour grows with the value (5 levels), the value stays as text */
export const heatmap = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-2',
        scroll: 'overflow-x-auto',
        table: 'border-separate border-spacing-1 text-start',
        caption: 'pb-1 text-start text-sm font-semibold text-fg',
        columnHeader:
            'px-1 pb-1 text-center font-mono text-[10px] font-normal tracking-label whitespace-nowrap text-muted uppercase',
        rowHeader: 'pe-2 text-end text-xs font-normal whitespace-nowrap text-muted',
        cell: [
            'h-9 min-w-11 rounded-md px-1.5 text-center text-xs text-fg tabular-nums',
            'data-[level=0]:bg-bg-2 data-[level=1]:bg-primary/12 data-[level=2]:bg-primary/28',
            // Up to level 3 the text stays in the text colour (contrast in every theme), level 4 is the full primary
            'data-[level=3]:bg-primary/40 data-[level=4]:bg-primary data-[level=4]:text-on-primary',
            'forced-colors:border forced-colors:border-[CanvasText]',
        ],
        empty: 'text-muted',
        srOnly: 'sr-only',
        legend: 'flex items-center gap-1.5 text-xs text-muted',
        legendCell: [
            'size-3.5 rounded-sm',
            'data-[level=0]:bg-bg-2 data-[level=1]:bg-primary/12 data-[level=2]:bg-primary/28 data-[level=3]:bg-primary/40 data-[level=4]:bg-primary',
        ],
    },
});

/** Level 0–4 of a value between min and max (null: no value) */
export function heatLevel(value: number | null | undefined, min: number, max: number): number | null {
    if (value === null || value === undefined || Number.isNaN(value)) return null;
    if (max <= min) return value > 0 ? 4 : 0;
    return Math.min(4, Math.max(0, Math.round(((value - min) / (max - min)) * 4)));
}

/** Areas proportional to the values; a list, laid out as tiles */
export const treemap = tv({
    slots: {
        base: 'flex w-full min-w-0 flex-col gap-2',
        title: 'text-sm font-semibold text-fg',
        list: 'relative m-0 w-full list-none overflow-hidden rounded-xl p-0',
        tile: [
            'absolute flex min-h-0 min-w-0 flex-col justify-end gap-0.5 overflow-hidden border-2 border-card p-2',
            'rounded-lg text-fg forced-colors:border-[CanvasText]',
        ],
        tileLabel: 'truncate text-xs font-semibold',
        // Muted grey is too light on the tinted tiles
        tileValue: 'truncate font-mono text-[11px] text-fg/80 tabular-nums',
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

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Squarified treemap (Bruls, Huizing, van Wijk): tiles as square as possible, in the order of the values
 * (largest first). Returns one rectangle per value in the same order as the input.
 */
export function squarify(values: number[], width: number, height: number): Rect[] {
    const order = values
        .map((value, index) => ({ value: Math.max(0, value), index }))
        .sort((a, b) => b.value - a.value);
    const total = order.reduce((sum, item) => sum + item.value, 0);
    const result: Rect[] = values.map(() => ({ x: 0, y: 0, width: 0, height: 0 }));
    if (total === 0) return result;
    const scale = (width * height) / total;
    let box = { x: 0, y: 0, width, height };
    let row: typeof order = [];
    const worst = (items: typeof order, side: number) => {
        const areas = items.map((item) => item.value * scale);
        const sum = areas.reduce((a, b) => a + b, 0);
        const max = Math.max(...areas);
        const min = Math.min(...areas);
        return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
    };
    const place = (items: typeof order) => {
        const sum = items.reduce((total, item) => total + item.value * scale, 0);
        const horizontal = box.width >= box.height;
        const thickness = horizontal ? sum / box.height : sum / box.width;
        let offset = 0;
        for (const item of items) {
            const length = (item.value * scale) / thickness;
            result[item.index] = horizontal
                ? { x: box.x, y: box.y + offset, width: thickness, height: length }
                : { x: box.x + offset, y: box.y, width: length, height: thickness };
            offset += length;
        }
        box = horizontal
            ? { x: box.x + thickness, y: box.y, width: box.width - thickness, height: box.height }
            : { x: box.x, y: box.y + thickness, width: box.width, height: box.height - thickness };
    };
    for (const item of order.filter((entry) => entry.value > 0)) {
        const side = Math.min(box.width, box.height);
        if (row.length === 0 || worst([...row, item], side) <= worst(row, side)) {
            row.push(item);
        } else {
            place(row);
            row = [item];
        }
    }
    if (row.length) place(row);
    return result;
}

/** Flows between nodes as bands; nodes in columns from the sources to the targets */
export const sankey = tv({
    slots: {
        base: 'm-0 flex w-full min-w-0 flex-col gap-3',
        title: 'text-sm font-semibold text-fg',
        svg: 'w-full overflow-visible',
        link: 'fill-none stroke-current opacity-35 hover:opacity-60 motion-safe:transition-opacity',
        node: 'fill-current',
        nodeLabel: 'fill-fg text-[11px]',
        nodeValue: 'fill-muted font-mono text-[10px]',
    },
    variants: {
        tone: {
            primary: { link: 'text-primary', node: 'text-primary' },
            info: { link: 'text-info', node: 'text-info' },
            success: { link: 'text-success', node: 'text-success' },
            warn: { link: 'text-warn', node: 'text-warn' },
            danger: { link: 'text-danger', node: 'text-danger' },
        },
    },
});

export interface SankeyNodeInput {
    id: string;
    label: string;
}
export interface SankeyLinkInput {
    source: string;
    target: string;
    value: number;
}
export interface SankeyNodeLayout extends SankeyNodeInput {
    index: number;
    column: number;
    value: number;
    x: number;
    y: number;
    height: number;
}
export interface SankeyLinkLayout extends SankeyLinkInput {
    index: number;
    /** Centre of the band at the source and the target, and its thickness */
    y0: number;
    y1: number;
    x0: number;
    x1: number;
    width: number;
}

/**
 * Columns by the longest path from a source; nodes stacked per column in input order, heights by the larger of
 * in- and outflow; bands leave and enter in the order of the nodes on the other side.
 */
export function sankeyLayout(
    nodes: readonly SankeyNodeInput[],
    links: readonly SankeyLinkInput[],
    width: number,
    height: number,
    { nodeWidth = 12, padding = 14 } = {}
): { nodes: SankeyNodeLayout[]; links: SankeyLinkLayout[] } {
    const byId = new Map(nodes.map((node, index) => [node.id, index]));
    const valid = links.filter((link) => byId.has(link.source) && byId.has(link.target) && link.value > 0);
    const column = nodes.map(() => 0);
    // Longest path from the sources (cycles are cut after nodes.length rounds)
    for (let round = 0; round < nodes.length; round++) {
        let changed = false;
        for (const link of valid) {
            const from = byId.get(link.source)!;
            const to = byId.get(link.target)!;
            if (column[to]! < column[from]! + 1) {
                column[to] = column[from]! + 1;
                changed = true;
            }
        }
        if (!changed) break;
    }
    const columns = Math.max(0, ...column) + 1;
    const inflow = nodes.map(() => 0);
    const outflow = nodes.map(() => 0);
    for (const link of valid) {
        outflow[byId.get(link.source)!]! += link.value;
        inflow[byId.get(link.target)!]! += link.value;
    }
    const value = nodes.map((_, index) => Math.max(inflow[index]!, outflow[index]!));
    const members = Array.from({ length: columns }, (_, current) =>
        nodes.map((_, index) => index).filter((index) => column[index] === current)
    );
    const scale = Math.min(
        ...members.map((list) => {
            const sum = list.reduce((total, index) => total + value[index]!, 0);
            return sum > 0 ? (height - padding * (list.length - 1)) / sum : Infinity;
        })
    );
    const ky = Number.isFinite(scale) ? scale : 0;
    const step = columns > 1 ? (width - nodeWidth) / (columns - 1) : 0;
    const laidOut: SankeyNodeLayout[] = nodes.map((node, index) => ({
        ...node,
        index,
        column: column[index]!,
        value: value[index]!,
        x: column[index]! * step,
        y: 0,
        height: value[index]! * ky,
    }));
    for (const list of members) {
        const used = list.reduce((total, index) => total + laidOut[index]!.height, 0) + padding * (list.length - 1);
        let y = (height - used) / 2;
        for (const index of list) {
            laidOut[index]!.y = y;
            y += laidOut[index]!.height + padding;
        }
    }
    // Bands leave a node ordered by the target's position and enter ordered by the source's position
    const outOffset = nodes.map(() => 0);
    const inOffset = nodes.map(() => 0);
    const order = valid.map((link, index) => ({ link, index }));
    const sourceSorted = [...order].sort(
        (a, b) => laidOut[byId.get(a.link.target)!]!.y - laidOut[byId.get(b.link.target)!]!.y
    );
    const targetSorted = [...order].sort(
        (a, b) => laidOut[byId.get(a.link.source)!]!.y - laidOut[byId.get(b.link.source)!]!.y
    );
    const y0 = new Map<number, number>();
    const y1 = new Map<number, number>();
    for (const { link, index } of sourceSorted) {
        const source = byId.get(link.source)!;
        const band = link.value * ky;
        y0.set(index, laidOut[source]!.y + outOffset[source]! + band / 2);
        outOffset[source]! += band;
    }
    for (const { link, index } of targetSorted) {
        const target = byId.get(link.target)!;
        const band = link.value * ky;
        y1.set(index, laidOut[target]!.y + inOffset[target]! + band / 2);
        inOffset[target]! += band;
    }
    return {
        nodes: laidOut,
        links: order.map(({ link, index }) => ({
            ...link,
            index,
            x0: laidOut[byId.get(link.source)!]!.x + nodeWidth,
            x1: laidOut[byId.get(link.target)!]!.x,
            y0: y0.get(index)!,
            y1: y1.get(index)!,
            width: link.value * ky,
        })),
    };
}

/** SVG path of a band from (x0, y0) to (x1, y1), drawn with stroke-width = its thickness */
export const sankeyPath = (link: Pick<SankeyLinkLayout, 'x0' | 'x1' | 'y0' | 'y1'>) => {
    const middle = (link.x0 + link.x1) / 2;
    return `M${link.x0},${link.y0}C${middle},${link.y0} ${middle},${link.y1} ${link.x1},${link.y1}`;
};

// Bars list, funnel, bullet chart and radial bars: HTML/SVG without a chart library (also on the server).

/** A list of labels with a bar behind each one, proportional to its value; the value at the end */
export const barsList = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-2',
        title: 'm-0 text-sm font-semibold text-fg',
        header: 'flex justify-between gap-4 px-2 font-mono text-[10px] tracking-label text-muted uppercase',
        list: 'm-0 flex list-none flex-col gap-1.5 p-0',
        item: 'relative flex min-h-8 items-center gap-4 rounded-md px-2 text-sm text-fg',
        bar: 'absolute inset-y-0 start-0 rounded-md forced-colors:border forced-colors:border-[CanvasText]',
        label: 'relative min-w-0 flex-1 truncate',
        link: 'rounded-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        value: 'relative shrink-0 tabular-nums',
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

/** Widths (percent of the largest value or `max`) of a bars list */
export function barsListWidths(values: readonly number[], max?: number): number[] {
    const top = max ?? Math.max(0, ...values);
    return values.map((value) => (top > 0 ? Math.min(100, Math.max(0, (value / top) * 100)) : 0));
}

/** Funnel: stages as centred bars that narrow with the value, conversion between the stages; table as text */
export const funnel = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-3',
        title: 'm-0 text-sm font-semibold text-fg',
        stages: 'flex flex-col gap-1',
        stage: 'grid grid-cols-[minmax(6rem,10rem)_1fr_minmax(4rem,auto)] items-center gap-3 text-sm',
        label: 'truncate text-fg',
        track: 'flex justify-center',
        bar: 'h-9 rounded-md transition-[width] motion-reduce:transition-none forced-colors:border forced-colors:border-[CanvasText]',
        value: 'text-end text-fg tabular-nums',
        conversion: 'ps-[calc(min(10rem,30%)+0.75rem)] text-center text-xs text-muted tabular-nums',
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

export interface FunnelStage {
    label: string;
    value: number;
}

/** Stages with their width (percent of the first stage) and conversion from the previous and the first stage */
export function funnelStages(stages: readonly FunnelStage[]) {
    const first = stages[0]?.value ?? 0;
    const top = Math.max(0, ...stages.map((stage) => stage.value));
    return stages.map((stage, index) => {
        const previous = index > 0 ? stages[index - 1]!.value : undefined;
        return {
            ...stage,
            width: top > 0 ? Math.max(2, (Math.max(0, stage.value) / top) * 100) : 0,
            fromPrevious: previous ? stage.value / previous : undefined,
            fromFirst: first ? stage.value / first : undefined,
        };
    });
}

/** Bullet chart: the value as a bar over qualitative bands, the target as a marker */
export const bulletChart = tv({
    slots: {
        base: 'grid min-w-0 grid-cols-[minmax(6rem,auto)_1fr] items-center gap-x-4 gap-y-1',
        header: 'flex flex-col',
        label: 'text-sm font-medium text-fg',
        description: 'text-xs text-muted',
        meter: 'relative h-6 overflow-hidden rounded-md bg-bg-2 forced-colors:border forced-colors:border-[CanvasText]',
        band: 'absolute inset-y-0 start-0 bg-line data-[band=1]:bg-line-2 data-[band=2]:bg-line-strong/40',
        bar: 'absolute inset-y-[30%] start-0 rounded-sm forced-colors:bg-[Highlight]',
        target: 'absolute inset-y-[12%] w-0.5 -translate-x-1/2 bg-fg rtl:translate-x-1/2 forced-colors:bg-[CanvasText]',
        values: 'col-start-2 flex justify-between text-xs text-muted tabular-nums',
        current: 'font-medium text-fg',
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

/** Positions (percent of min…max) of value, target and the bands of a bullet chart */
export function bulletScale(options: {
    value: number;
    target?: number;
    min?: number;
    max: number;
    ranges?: readonly number[];
}) {
    const min = options.min ?? 0;
    const span = options.max - min || 1;
    const at = (value: number) => Math.min(100, Math.max(0, ((value - min) / span) * 100));
    return {
        value: at(options.value),
        target: options.target === undefined ? undefined : at(options.target),
        // Widest band first, so the narrower ones lie on top
        bands: [...(options.ranges ?? [])]
            .sort((a, b) => b - a)
            .map((limit, index, all) => ({ width: at(limit), band: all.length - 1 - index })),
    };
}

/** Radial bars: one ring per item, inside each other; the legend with values is the text form */
export const radialBar = tv({
    slots: {
        base: 'inline-flex flex-wrap items-center gap-6',
        title: 'm-0 w-full text-sm font-semibold text-fg',
        chart: 'relative size-(--size) shrink-0',
        svg: 'size-full -rotate-90 rtl:scale-y-[-1]',
        track: 'fill-none stroke-bg-2',
        ring: 'fill-none transition-[stroke-dasharray] motion-reduce:transition-none forced-colors:stroke-[CanvasText]',
        legend: 'm-0 flex list-none flex-col gap-1.5 p-0',
        legendItem: 'flex items-center gap-2 text-sm text-fg',
        swatch: 'size-2.5 shrink-0 rounded-full forced-colors:border forced-colors:border-[CanvasText]',
        legendValue: 'ms-auto ps-3 text-muted tabular-nums',
    },
    variants: {
        size: {
            sm: { chart: '[--size:96px]' },
            md: { chart: '[--size:160px]' },
            lg: { chart: '[--size:224px]' },
        },
        /** Colour of a ring and its legend swatch */
        tone: {
            primary: { ring: 'stroke-primary', swatch: 'bg-primary' },
            info: { ring: 'stroke-info', swatch: 'bg-info' },
            success: { ring: 'stroke-success', swatch: 'bg-success' },
            warn: { ring: 'stroke-warn', swatch: 'bg-warn' },
            danger: { ring: 'stroke-danger', swatch: 'bg-danger' },
        },
    },
    defaultVariants: {
        size: 'md',
        tone: 'primary',
    },
});

/** Rings of a radial bar chart (viewBox 0 0 100 100): outermost first, dash for the share of each value */
export function radialBarRings(
    values: readonly { value: number; max?: number }[],
    options: { thickness?: number; gap?: number; max?: number } = {}
) {
    const thickness = options.thickness ?? Math.min(10, 40 / Math.max(1, values.length) - 2);
    const gap = options.gap ?? 2;
    return values.map((entry, index) => {
        const radius = 50 - thickness / 2 - index * (thickness + gap);
        const circumference = 2 * Math.PI * Math.max(0, radius);
        const max = entry.max ?? options.max ?? 100;
        const share = max > 0 ? Math.min(1, Math.max(0, entry.value / max)) : 0;
        return { radius: Math.max(0, radius), thickness, circumference, dash: share * circumference, share };
    });
}
