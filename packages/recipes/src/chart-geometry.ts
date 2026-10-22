import type { ChartReference, ChartRow, ChartSeries, ChartTone } from './chart.js';
import { sparklineSummary } from './chart.js';
import { translations, type Translations } from './i18n.js';

// Geometry of the charts drawn without a chart library (React Native with react-native-svg): "nice" axis values,
// stacked values, scales, bars, line and area paths, pie slices. Pure functions – the same numbers everywhere.

/** A point in the plot (pixels, y downwards) */
export interface ChartPoint {
    x: number;
    y: number;
}

/** Start and end of a value on the value axis – stacked values start where the one below ends */
export interface StackedValue {
    /** The value of the row (null: none) */
    value: number | null;
    start: number;
    end: number;
}

/** A bar of a bar chart in plot pixels */
export interface BarRect {
    /** Index of the series */
    series: number;
    /** Index of the row (category) */
    row: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Angles (radians, clockwise from 12 o'clock) of a pie slice */
export interface PieArc {
    start: number;
    end: number;
    /** Share of the whole, 0–1 */
    share: number;
}

const CHART_TONES: ChartTone[] = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];

/** Colour of the n-th series or slice when it has none (the order of the web charts) */
export const chartToneAt = (index: number): ChartTone => CHART_TONES[index % CHART_TONES.length]!;

// Two decimals are enough for pixels and keep the paths short
const px = (value: number) => String(Math.round(value * 100) / 100);
const finite = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/**
 * "Nice" values of a value axis: about `count` steps of 1, 2, 2.5 or 5 × 10ⁿ that cover min…max. The first and last
 * tick are the ends of the axis.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
    let low = Math.min(min, max);
    let high = Math.max(min, max);
    if (!Number.isFinite(low) || !Number.isFinite(high)) return [0, 1];
    if (low === high) {
        if (low === 0) high = 1;
        else if (low > 0) low = 0;
        else high = 0;
    }
    const rough = (high - low) / Math.max(1, count);
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const norm = rough / magnitude;
    const factor = norm <= 1 + 1e-9 ? 1 : norm <= 2 + 1e-9 ? 2 : norm <= 2.5 + 1e-9 ? 2.5 : norm <= 5 + 1e-9 ? 5 : 10;
    const step = factor * magnitude;
    const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
    const first = Math.floor(low / step + 1e-9);
    const last = Math.ceil(high / step - 1e-9);
    const ticks: number[] = [];
    for (let index = first; index <= last; index++) ticks.push(Number((index * step).toFixed(decimals)) || 0);
    return ticks;
}

/**
 * Start and end of every value, per series and row. Series of one stack (all with `stacked`, or the same `stack`
 * name) pile up – positive values upwards, negative ones downwards; the others start at 0.
 */
export function stackSeries(
    data: readonly ChartRow[],
    series: readonly ChartSeries[],
    stacked = false
): StackedValue[][] {
    const sums = { positive: new Map<string, number[]>(), negative: new Map<string, number[]>() };
    return series.map((entry) => {
        const stack = stacked ? 'all' : entry.stack;
        return data.map((row, index) => {
            const value = finite(row[entry.key]);
            if (value === null) return { value, start: 0, end: 0 };
            if (stack === undefined) return { value, start: 0, end: value };
            const side = value >= 0 ? sums.positive : sums.negative;
            let list = side.get(stack);
            if (!list) {
                list = data.map(() => 0);
                side.set(stack, list);
            }
            const start = list[index]!;
            list[index] = start + value;
            return { value, start, end: start + value };
        });
    });
}

/**
 * Smallest and largest value the axis has to show: the ends of the (stacked) values and the references on the value
 * axis; with `zero` always including 0 (bars, areas). A stack starts at 0 or where another value ends.
 */
export function valueExtent(
    values: readonly (readonly StackedValue[])[],
    references: readonly ChartReference[] = [],
    zero = true
): [number, number] {
    const numbers: number[] = zero ? [0] : [];
    for (const list of values) {
        for (const entry of list) if (entry.value !== null) numbers.push(entry.end);
    }
    for (const reference of references) {
        if (reference.axis === 'x') continue;
        for (const value of [reference.value, reference.from, reference.to])
            if (value !== undefined) numbers.push(value);
    }
    if (!numbers.length) return [0, 1];
    return [Math.min(...numbers), Math.max(...numbers)];
}

/** Maps a value of the domain linearly onto the range (pixels) */
export function linearScale(domain: readonly [number, number], range: readonly [number, number]) {
    const [d0, d1] = domain;
    const [r0, r1] = range;
    const span = d1 - d0 || 1;
    return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/**
 * Positions of the categories along an axis of `length` pixels: the centres of equal bands (`offset`, bars), or from
 * edge to edge (lines). `step` is the distance between two categories.
 */
export function categoryPositions(count: number, length: number, offset = true) {
    const step = offset ? length / Math.max(1, count) : count > 1 ? length / (count - 1) : length;
    const centres = Array.from({ length: Math.max(0, count) }, (_, index) =>
        offset ? step * (index + 0.5) : count > 1 ? step * index : length / 2
    );
    return { step, centres };
}

/**
 * Rectangles of the bars in a plot of width × height: one band per row, one slot per stack (or series) in it.
 * Vertical bars grow from the value 0 up (or down), horizontal ones from 0 to the end edge. Missing values get none.
 */
export function barRects(
    values: readonly (readonly StackedValue[])[],
    options: {
        series: readonly ChartSeries[];
        stacked?: boolean;
        horizontal?: boolean;
        width: number;
        height: number;
        domain: readonly [number, number];
        /** Share of a band left empty around its bars (default 0.3) */
        padding?: number;
    }
): BarRect[] {
    const { series, stacked = false, horizontal = false, width, height, domain, padding = 0.3 } = options;
    const keys = series.map((entry, index) => (stacked ? 'all' : (entry.stack ?? `#${index}`)));
    const slots = [...new Set(keys)];
    const rows = values[0]?.length ?? 0;
    const band = (horizontal ? height : width) / Math.max(1, rows);
    const inner = band * (1 - padding);
    const slotSize = inner / Math.max(1, slots.length);
    const gap = slots.length > 1 ? Math.min(2, slotSize * 0.2) : 0;
    const thickness = Math.max(1, slotSize - gap);
    const scale = horizontal ? linearScale(domain, [0, width]) : linearScale(domain, [height, 0]);
    const round = (value: number) => Math.round(value * 100) / 100;
    const rects: BarRect[] = [];
    values.forEach((list, seriesIndex) => {
        const slot = slots.indexOf(keys[seriesIndex]!);
        list.forEach((entry, row) => {
            if (entry.value === null) return;
            const a = scale(entry.start);
            const b = scale(entry.end);
            const offset = row * band + (band - inner) / 2 + slot * slotSize + (slotSize - thickness) / 2;
            const along = { position: round(Math.min(a, b)), size: round(Math.abs(a - b)) };
            const across = { position: round(offset), size: round(thickness) };
            const [x, y] = horizontal ? [along, across] : [across, along];
            rects.push({ series: seriesIndex, row, x: x.position, y: y.position, width: x.size, height: y.size });
        });
    });
    return rects;
}

/**
 * Points of one series of a line chart: the categories from edge to edge (x), the stacked end – or with
 * `edge: 'start'` the start, the lower edge of an area – of each value (y). Missing values are null (a gap).
 */
export function linePoints(
    values: readonly StackedValue[],
    options: { width: number; height: number; domain: readonly [number, number]; edge?: 'start' | 'end' }
): (ChartPoint | null)[] {
    const { width, height, domain, edge = 'end' } = options;
    const { centres } = categoryPositions(values.length, width, false);
    const scale = linearScale(domain, [height, 0]);
    const low = Math.min(domain[0], domain[1]);
    const high = Math.max(domain[0], domain[1]);
    return values.map((entry, index) =>
        entry.value === null
            ? null
            : {
                  x: centres[index]!,
                  y: scale(Math.min(high, Math.max(low, edge === 'start' ? entry.start : entry.end))),
              }
    );
}

// One run of points as path commands; `curved`: monotone cubic curves (Fritsch–Carlson) – no overshoot past the values
function segment(points: readonly ChartPoint[], curved: boolean, command: 'M' | 'L') {
    let path = `${command}${px(points[0]!.x)},${px(points[0]!.y)}`;
    if (!curved || points.length < 3) {
        for (const point of points.slice(1)) path += `L${px(point.x)},${px(point.y)}`;
        return path;
    }
    const count = points.length;
    const slopes = points.slice(1).map((point, index) => {
        const dx = point.x - points[index]!.x;
        return dx ? (point.y - points[index]!.y) / dx : 0;
    });
    const tangents = points.map((_, index) =>
        index === 0
            ? slopes[0]!
            : index === count - 1
              ? slopes[count - 2]!
              : slopes[index - 1]! * slopes[index]! <= 0
                ? 0
                : (slopes[index - 1]! + slopes[index]!) / 2
    );
    for (let index = 0; index < count - 1; index++) {
        const slope = slopes[index]!;
        if (slope === 0) {
            tangents[index] = 0;
            tangents[index + 1] = 0;
            continue;
        }
        const a = tangents[index]! / slope;
        const b = tangents[index + 1]! / slope;
        const sum = a * a + b * b;
        if (sum > 9) {
            const factor = 3 / Math.sqrt(sum);
            tangents[index] = factor * a * slope;
            tangents[index + 1] = factor * b * slope;
        }
    }
    for (let index = 0; index < count - 1; index++) {
        const from = points[index]!;
        const to = points[index + 1]!;
        const third = (to.x - from.x) / 3;
        path +=
            `C${px(from.x + third)},${px(from.y + tangents[index]! * third)} ` +
            `${px(to.x - third)},${px(to.y - tangents[index + 1]! * third)} ${px(to.x)},${px(to.y)}`;
    }
    return path;
}

// Runs of indexes where every list has a point
function runs(lists: readonly (readonly (ChartPoint | null)[])[]) {
    const result: number[][] = [];
    let current: number[] = [];
    const length = lists[0]?.length ?? 0;
    for (let index = 0; index < length; index++) {
        if (lists.every((list) => list[index])) current.push(index);
        else if (current.length) {
            result.push(current);
            current = [];
        }
    }
    if (current.length) result.push(current);
    return result;
}

/** SVG path of a line through the points – straight or `curved`; a null point leaves a gap */
export function linePath(points: readonly (ChartPoint | null)[], curved = false): string {
    return runs([points])
        .map((run) =>
            segment(
                run.map((index) => points[index]!),
                curved,
                'M'
            )
        )
        .join('');
}

/** SVG path of an area between the line `top` and the line `base` (e.g. the zero line or the series below) */
export function areaPath(
    top: readonly (ChartPoint | null)[],
    base: readonly (ChartPoint | null)[],
    curved = false
): string {
    return runs([top, base])
        .map(
            (run) =>
                segment(
                    run.map((index) => top[index]!),
                    curved,
                    'M'
                ) +
                segment(
                    [...run].reverse().map((index) => base[index]!),
                    curved,
                    'L'
                ) +
                'Z'
        )
        .join('');
}

/**
 * Angles of the slices of a pie, clockwise from 12 o'clock; negative values count as 0. `padAngle` (radians) leaves a
 * gap between the slices when there is more than one.
 */
export function pieArcs(values: readonly number[], padAngle = 0): PieArc[] {
    const positive = values.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0));
    const total = positive.reduce((sum, value) => sum + value, 0);
    const pad = positive.filter((value) => value > 0).length > 1 ? padAngle : 0;
    let angle = 0;
    return positive.map((value) => {
        const share = total ? value / total : 0;
        const start = angle;
        angle += share * Math.PI * 2;
        const gap = Math.min(pad, angle - start) / 2;
        return { start: start + gap, end: angle - gap, share };
    });
}

/**
 * SVG path of a pie slice (`innerRadius` 0) or a ring segment from `start` to `end` (radians, clockwise from 12
 * o'clock) around (cx, cy). A full turn becomes a closed circle or ring.
 */
export function arcPath(cx: number, cy: number, radius: number, innerRadius: number, start: number, end: number) {
    const at = (r: number, angle: number) => `${px(cx + r * Math.sin(angle))},${px(cy - r * Math.cos(angle))}`;
    const r = px(radius);
    if (end - start >= Math.PI * 2 - 1e-6) {
        const outer = `M${at(radius, 0)}A${r},${r} 0 1 1 ${at(radius, Math.PI)}A${r},${r} 0 1 1 ${at(radius, 0)}Z`;
        if (innerRadius <= 0) return outer;
        // The hole runs the other way round, so the default fill rule leaves it empty
        const ri = px(innerRadius);
        const hole = `M${at(innerRadius, 0)}A${ri},${ri} 0 1 0 ${at(innerRadius, Math.PI)}`;
        return `${outer}${hole}A${ri},${ri} 0 1 0 ${at(innerRadius, 0)}Z`;
    }
    if (end <= start) return '';
    const large = end - start > Math.PI ? 1 : 0;
    if (innerRadius <= 0) {
        return `M${px(cx)},${px(cy)}L${at(radius, start)}A${r},${r} 0 ${large} 1 ${at(radius, end)}Z`;
    }
    const ri = px(innerRadius);
    return (
        `M${at(radius, start)}A${r},${r} 0 ${large} 1 ${at(radius, end)}` +
        `L${at(innerRadius, end)}A${ri},${ri} 0 ${large} 0 ${at(innerRadius, start)}Z`
    );
}

/**
 * Short text alternative of a bar or line chart: the title, then the trend and the extremes of each series
 * ("Revenue: from 120 to 230, low 98, high 230")
 */
export function seriesSummary(
    title: string,
    data: readonly ChartRow[],
    series: readonly ChartSeries[],
    formatValue: (value: number) => string,
    t: Translations['chart'] = translations.chart
): string {
    const parts = series.map((entry) =>
        sparklineSummary(
            entry.label ?? entry.key,
            data.map((row) => finite(row[entry.key])).filter((value): value is number => value !== null),
            formatValue,
            t
        )
    );
    return [title, ...parts].join('. ');
}
