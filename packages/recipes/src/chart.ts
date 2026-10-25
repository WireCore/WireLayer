import { defaultLocale, translations, type Translations } from './i18n.js';
import { tv } from './tv.js';

// Chart (@wirecore/wirelayer-vue/chart, @wirecore/wirelayer-react/chart): Chart.js on a canvas, coloured from the design tokens,
// with the data as a table for everyone who cannot see the chart (WCAG 1.1.1). Nothing here imports Chart.js.

export const chart = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-3',
        title: 'text-sm font-semibold text-fg',
        // Chart.js sizes the canvas to this box (responsive, no fixed aspect ratio)
        canvasBox: 'relative w-full',
        details: 'text-sm',
        summary: [
            'w-fit cursor-pointer rounded-sm text-[13px] text-muted hover:text-fg',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        scroll: 'mt-2 overflow-x-auto',
        table: 'w-full border-collapse text-start',
        caption: 'sr-only',
        th: 'border-b border-line px-3 py-2 font-mono text-[11px] font-normal tracking-label whitespace-nowrap text-muted uppercase',
        rowHeader: 'border-b border-line px-3 py-2 font-normal text-fg',
        td: 'border-b border-line px-3 py-2 text-end text-fg tabular-nums',
    },
});

/** The parts of Chart.js data the helpers need – Chart.js' own ChartData fits */
export interface ChartDataLike {
    labels?: unknown[];
    datasets: { label?: string; data: readonly unknown[] }[];
}

export interface ChartTheme {
    /** Series colours: primary, info, success, warn, danger, muted */
    palette: string[];
    /** Background of the surface – separates pie segments */
    surface: string;
    text: string;
    grid: string;
    font: string;
}

const PALETTE_TOKENS = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];

/**
 * Reads the current token colours at the element (theme and mode) as rgb() – Chart.js cannot parse oklch().
 * Browser only.
 */
export function readChartTheme(element: HTMLElement): ChartTheme {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const probe = document.createElement('span');
    (element.parentElement ?? element).append(probe);
    const resolve = (token: string) => {
        probe.style.color = `var(--wc-${token})`;
        const color = getComputedStyle(probe).color;
        if (!context) return color;
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return `rgba(${r}, ${g}, ${b}, ${Math.round((a! / 255) * 100) / 100})`;
    };
    const theme = {
        palette: PALETTE_TOKENS.map(resolve),
        surface: resolve('card'),
        text: resolve('muted'),
        grid: resolve('line'),
        font: getComputedStyle(element).fontFamily,
    };
    probe.remove();
    return theme;
}

const withAlpha = (rgba: string, alpha: number) => rgba.replace(/[\d.]+\)$/, `${alpha})`);
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    !!value && Object.getPrototypeOf(value) === Object.prototype;

/** Deep merge of plain objects – later wins, arrays and functions are taken as they are */
export function mergeOptions<T extends Record<string, unknown>>(
    ...sources: (Record<string, unknown> | undefined)[]
): T {
    const result: Record<string, unknown> = {};
    for (const source of sources) {
        for (const [key, value] of Object.entries(source ?? {})) {
            result[key] =
                isPlainObject(value) && isPlainObject(result[key])
                    ? mergeOptions(result[key] as Record<string, unknown>, value)
                    : value;
        }
    }
    return result as T;
}

const SEGMENTED = new Set(['pie', 'doughnut', 'polarArea']);
const RADIAL = new Set(['radar', 'polarArea']);

/**
 * Copy of the data with token colours for every dataset that brings none: one colour per series,
 * or per segment in pie/doughnut/polarArea charts. Copies the arrays, so Chart.js never touches the caller's data.
 */
export function themeChartData<T extends ChartDataLike>(type: string, data: T, theme: ChartTheme): T {
    const color = (index: number) => theme.palette[index % theme.palette.length]!;
    return {
        ...data,
        labels: data.labels && [...data.labels],
        datasets: data.datasets.map((dataset, index) => {
            const defaults = SEGMENTED.has(type)
                ? {
                      backgroundColor: dataset.data.map((_, segment) => color(segment)),
                      borderColor: theme.surface,
                      borderWidth: 2,
                  }
                : type === 'line' || type === 'radar'
                  ? {
                        borderColor: color(index),
                        backgroundColor: withAlpha(color(index), 0.15),
                        pointBackgroundColor: color(index),
                    }
                  : { backgroundColor: color(index), borderColor: color(index), borderRadius: 4 };
            return { ...defaults, ...dataset, data: [...dataset.data] };
        }),
    };
}

/** Chart.js options from the theme, merged with the caller's options (which win) */
export function themeChartOptions(
    type: string,
    theme: ChartTheme,
    options: Record<string, unknown> | undefined,
    reducedMotion: boolean,
    locale = defaultLocale
): Record<string, unknown> {
    const axis = { grid: { color: theme.grid }, border: { color: theme.grid }, ticks: { color: theme.text } };
    const radial = {
        grid: { color: theme.grid },
        angleLines: { color: theme.grid },
        pointLabels: { color: theme.text },
        ticks: { color: theme.text, backdropColor: 'transparent' },
    };
    // Only the axes the type has – Chart.js would otherwise draw x/y axes around a pie
    const scales = RADIAL.has(type) ? { r: radial } : SEGMENTED.has(type) ? undefined : { x: axis, y: axis };
    return mergeOptions(
        {
            responsive: true,
            maintainAspectRatio: false,
            locale,
            color: theme.text,
            borderColor: theme.grid,
            font: { family: theme.font },
            ...(reducedMotion ? { animation: false } : {}),
            ...(scales ? { scales } : {}),
            plugins: { legend: { labels: { color: theme.text, usePointStyle: true } } },
        },
        options
    );
}

/** Rows and columns for the data table: one row per label, one column per dataset */
export function chartTable(
    data: ChartDataLike,
    formatValue: (value: number) => string,
    t: Translations['chart'] = translations.chart
) {
    const columns = data.datasets.map((dataset, index) => dataset.label ?? t.series(index));
    const labels = data.labels ?? data.datasets[0]?.data.map((_, index) => index + 1) ?? [];
    const rows = labels.map((label, row) => ({
        label: String(label),
        values: data.datasets.map((dataset) => {
            const value = dataset.data[row];
            const number = typeof value === 'number' ? value : (value as { y?: unknown } | null)?.y;
            return typeof number === 'number' ? formatValue(number) : value == null ? '–' : String(value);
        }),
    }));
    return { columns, rows };
}

/** Text alternative of a sparkline: the trend and the extremes */
export function sparklineSummary(
    label: string,
    data: readonly number[],
    formatValue: (value: number) => string,
    t: Translations['chart'] = translations.chart
) {
    if (!data.length) return label;
    return t.sparkline(
        label,
        formatValue(data[0]!),
        formatValue(data.at(-1)!),
        formatValue(Math.min(...data)),
        formatValue(Math.max(...data))
    );
}

// Ready-made chart types (BarChart, LineChart, CompositeChart, WaterfallChart, PieChart): one API for rows of data,
// series, reference lines and areas, a second value axis, a log scale, value formatting and a range brush.

/** Token colours of the series (in this order by default) */
export type ChartTone = 'primary' | 'info' | 'success' | 'warn' | 'danger' | 'muted';
const TONES: ChartTone[] = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];

/** One series of a chart: the key of its values in the rows */
export interface ChartSeries {
    /** Property of each row with the value */
    key: string;
    /** Name in legend, tooltip and table (default: the key) */
    label?: string;
    /** Token colour (default: in turn) */
    tone?: ChartTone;
    /** CompositeChart: draw as bars (default) or line */
    type?: 'bar' | 'line';
    /** Value axis: `end` for a second axis on the other side */
    axis?: 'start' | 'end';
    /** Series with the same stack name are stacked (bars and areas) */
    stack?: string;
    /** Line chart: fill the area below the line */
    area?: boolean;
    /** Dashed line (e.g. a plan or forecast) */
    dashed?: boolean;
}

/** A reference line (`value`) or area (`from`–`to`) on the value axis, or on the category axis with `axis: 'x'` */
export interface ChartReference {
    value?: number;
    from?: number;
    to?: number;
    label?: string;
    tone?: ChartTone;
    /** Axis of the value: `start` (default), `end` (second axis) or `x` (category index) */
    axis?: 'start' | 'end' | 'x';
}

export type ChartRow = Record<string, unknown>;

export interface SeriesChartInput {
    kind: 'bar' | 'line' | 'composite';
    data: readonly ChartRow[];
    /** Property of each row with the category (x axis) */
    categoryKey: string;
    series: readonly ChartSeries[];
    /** Bars from the start edge instead of from the bottom */
    horizontal?: boolean;
    /** Stack all series */
    stacked?: boolean;
    /** Logarithmic value axis */
    scale?: 'linear' | 'logarithmic';
    /** Lines: curved instead of straight */
    curved?: boolean;
    references?: readonly ChartReference[];
    /** Shown rows (brush), inclusive indexes */
    range?: readonly [number, number];
    legend?: boolean;
}

const toneColor = (theme: ChartTheme, tone: ChartTone) => theme.palette[TONES.indexOf(tone)] ?? theme.palette[0]!;
const numberOf = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** Chart.js configuration (type, data and options) of a ready-made chart type */
export function seriesChartConfig(
    input: SeriesChartInput,
    theme: ChartTheme,
    formatValue: (value: number) => string,
    reducedMotion = false,
    locale = defaultLocale
): { type: string; data: ChartDataLike; options: Record<string, unknown> } {
    const [first, last] = input.range ?? [0, input.data.length - 1];
    const rows = input.data.slice(Math.max(0, first), last + 1);
    const hasEnd = input.series.some((series) => series.axis === 'end');
    const valueAxis = input.horizontal ? 'x' : 'y';
    const categoryAxis = input.horizontal ? 'y' : 'x';
    const datasets = input.series.map((series, index) => {
        const color = toneColor(theme, series.tone ?? TONES[index % TONES.length]!);
        const line = input.kind === 'line' || (input.kind === 'composite' && series.type === 'line');
        return {
            type: line ? 'line' : 'bar',
            label: series.label ?? series.key,
            data: rows.map((row) => numberOf(row[series.key])),
            borderColor: color,
            backgroundColor: line ? withAlpha(color, series.area ? 0.18 : 1) : color,
            ...(line
                ? {
                      fill: series.area ? (series.stack || input.stacked ? 'stack' : 'origin') : false,
                      tension: input.curved ? 0.35 : 0,
                      pointBackgroundColor: color,
                      pointRadius: rows.length > 40 ? 0 : 3,
                      borderWidth: 2,
                      ...(series.dashed ? { borderDash: [6, 4] } : {}),
                      // Lines above bars in a composite chart
                      order: 0,
                  }
                : { borderRadius: 4, order: 1, ...(series.dashed ? { borderDash: [6, 4], borderWidth: 2 } : {}) }),
            ...(series.stack || input.stacked ? { stack: series.stack ?? 'all' } : {}),
            [`${valueAxis}AxisID`]: series.axis === 'end' ? `${valueAxis}2` : valueAxis,
        };
    });
    const stacked = input.stacked || input.series.some((series) => series.stack);
    const ticks = { color: theme.text, callback: (value: number | string) => formatTick(value, formatValue) };
    const value = {
        type: input.scale ?? 'linear',
        stacked,
        grid: { color: theme.grid },
        border: { color: theme.grid },
        ticks,
    };
    const scales: Record<string, unknown> = {
        [categoryAxis]: {
            stacked,
            grid: { color: theme.grid, display: false },
            border: { color: theme.grid },
            ticks: { color: theme.text },
        },
        [valueAxis]: value,
        ...(hasEnd
            ? {
                  [`${valueAxis}2`]: {
                      ...value,
                      position: input.horizontal ? 'top' : 'right',
                      grid: { drawOnChartArea: false, color: theme.grid },
                  },
              }
            : {}),
    };
    return {
        type: input.kind === 'line' ? 'line' : 'bar',
        data: { labels: rows.map((row) => String(row[input.categoryKey] ?? '')), datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            locale,
            color: theme.text,
            font: { family: theme.font },
            indexAxis: input.horizontal ? 'y' : 'x',
            interaction: { mode: 'index', intersect: false },
            ...(reducedMotion ? { animation: false } : {}),
            scales,
            plugins: {
                legend: {
                    display: input.legend ?? input.series.length > 1,
                    labels: { color: theme.text, usePointStyle: true },
                },
                tooltip: { callbacks: { label: tooltipLabel(formatValue) } },
                wcReferences: {
                    // Category references are indexes into all rows – shifted to the shown range
                    items: (input.references ?? []).map((reference) => ({
                        ...reference,
                        shift: reference.axis === 'x' ? Math.max(0, first) : 0,
                    })),
                    colors: Object.fromEntries(TONES.map((tone) => [tone, toneColor(theme, tone)])),
                    text: theme.text,
                    font: theme.font,
                    valueAxis,
                    categoryAxis,
                },
            },
        },
    };
}

function formatTick(value: number | string, formatValue: (value: number) => string) {
    return typeof value === 'number' ? formatValue(value) : value;
}

/** Tooltip line "Series: formatted value" (also for floating bars [start, end]: the difference) */
export function tooltipLabel(formatValue: (value: number) => string) {
    return (context: { dataset: { label?: string }; raw: unknown; parsed?: Record<string, number> }) => {
        const raw = context.raw;
        const value = Array.isArray(raw)
            ? Number(raw[1]) - Number(raw[0])
            : typeof raw === 'number'
              ? raw
              : (context.parsed?.y ?? Number.NaN);
        const text = Number.isFinite(value) ? formatValue(value) : '–';
        return context.dataset.label ? `${context.dataset.label}: ${text}` : text;
    };
}

/** Table of a ready-made chart: one row per category, one column per series */
export function seriesTable(
    data: readonly ChartRow[],
    categoryKey: string,
    series: readonly ChartSeries[],
    formatValue: (value: number) => string,
    range?: readonly [number, number]
) {
    const rows = range ? data.slice(range[0], range[1] + 1) : data;
    return {
        columns: series.map((entry) => entry.label ?? entry.key),
        rows: rows.map((row) => ({
            label: String(row[categoryKey] ?? ''),
            values: series.map((entry) => {
                const value = numberOf(row[entry.key]);
                return value === null ? '–' : formatValue(value);
            }),
        })),
    };
}

/** A step of a waterfall: a change, or a total (`total: true`, its value is the running sum unless given) */
export interface WaterfallStep {
    label: string;
    value?: number;
    total?: boolean;
}

/** Floating bars of a waterfall: [start, end] per step, the running sum and the kind (up, down, total) */
export function waterfallBars(steps: readonly WaterfallStep[]) {
    let sum = 0;
    return steps.map((step) => {
        if (step.total) {
            sum = step.value ?? sum;
            return { label: step.label, range: [0, sum] as [number, number], change: sum, sum, kind: 'total' as const };
        }
        const start = sum;
        sum += step.value ?? 0;
        return {
            label: step.label,
            range: [start, sum] as [number, number],
            change: step.value ?? 0,
            sum,
            kind: (step.value ?? 0) < 0 ? ('down' as const) : ('up' as const),
        };
    });
}

/** Chart.js configuration of a waterfall: floating bars coloured by kind */
export function waterfallConfig(
    steps: readonly WaterfallStep[],
    theme: ChartTheme,
    formatValue: (value: number) => string,
    t: Translations['chart'],
    tones: { up?: ChartTone; down?: ChartTone; total?: ChartTone } = {},
    reducedMotion = false,
    locale = defaultLocale
) {
    const bars = waterfallBars(steps);
    const colors = { up: tones.up ?? 'success', down: tones.down ?? 'danger', total: tones.total ?? 'primary' };
    return {
        type: 'bar',
        data: {
            labels: bars.map((bar) => bar.label),
            datasets: [
                {
                    label: t.change,
                    data: bars.map((bar) => bar.range),
                    backgroundColor: bars.map((bar) => toneColor(theme, colors[bar.kind])),
                    borderRadius: 4,
                    borderSkipped: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            locale,
            color: theme.text,
            font: { family: theme.font },
            ...(reducedMotion ? { animation: false } : {}),
            scales: {
                x: { grid: { display: false }, border: { color: theme.grid }, ticks: { color: theme.text } },
                y: {
                    grid: { color: theme.grid },
                    border: { color: theme.grid },
                    ticks: { color: theme.text, callback: (value: number | string) => formatTick(value, formatValue) },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context: { dataIndex: number }) => {
                            const bar = bars[context.dataIndex]!;
                            return bar.kind === 'total'
                                ? `${t.total}: ${formatValue(bar.sum)}`
                                : `${t.change}: ${formatValue(bar.change)} · ${t.total}: ${formatValue(bar.sum)}`;
                        },
                    },
                },
            },
        },
    };
}

/** A slice of a pie or doughnut */
export interface PieSlice {
    label: string;
    value: number;
    tone?: ChartTone;
}

/** Legend and table rows of a pie: value and share of each slice */
export function pieLegend(slices: readonly PieSlice[], formatValue: (value: number) => string, locale = defaultLocale) {
    const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0);
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
    return slices.map((slice, index) => ({
        label: slice.label,
        tone: slice.tone ?? TONES[index % TONES.length]!,
        value: formatValue(slice.value),
        share: percent.format(total ? Math.max(0, slice.value) / total : 0),
    }));
}

/** Chart.js configuration of a pie or doughnut (legend in HTML, not drawn) */
export function pieConfig(
    slices: readonly PieSlice[],
    donut: boolean,
    theme: ChartTheme,
    formatValue: (value: number) => string,
    label: string,
    reducedMotion = false,
    locale = defaultLocale
) {
    return {
        type: donut ? 'doughnut' : 'pie',
        data: {
            labels: slices.map((slice) => slice.label),
            datasets: [
                {
                    label,
                    data: slices.map((slice) => slice.value),
                    backgroundColor: slices.map((slice, index) =>
                        toneColor(theme, slice.tone ?? TONES[index % TONES.length]!)
                    ),
                    borderColor: theme.surface,
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            locale,
            ...(reducedMotion ? { animation: false } : {}),
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: tooltipLabel(formatValue) } } },
        },
    };
}

/** Minimal Chart.js chart as the reference plugin sees it (no Chart.js import here) */
interface PluginChart {
    ctx: CanvasRenderingContext2D;
    chartArea: { left: number; right: number; top: number; bottom: number };
    scales: Record<string, { getPixelForValue: (value: number) => number } | undefined>;
    options: { plugins?: Record<string, unknown> };
}

interface ReferenceOptions {
    items: (ChartReference & { shift?: number })[];
    colors: Record<ChartTone, string>;
    text: string;
    font: string;
    valueAxis: 'x' | 'y';
    categoryAxis: 'x' | 'y';
}

/**
 * Chart.js plugin for reference lines and areas (own code): areas are drawn behind the data, lines and their labels
 * in front. Reads `options.plugins.wcReferences` (set by seriesChartConfig).
 */
export const referencePlugin = {
    id: 'wcReferences',
    beforeDatasetsDraw(chart: PluginChart) {
        drawReferences(chart, 'areas');
    },
    afterDatasetsDraw(chart: PluginChart) {
        drawReferences(chart, 'lines');
    },
};

function drawReferences(chart: PluginChart, layer: 'areas' | 'lines') {
    const options = chart.options.plugins?.wcReferences as ReferenceOptions | undefined;
    if (!options?.items.length) return;
    const { ctx, chartArea: area } = chart;
    for (const reference of options.items) {
        const onCategory = reference.axis === 'x';
        const axisId = onCategory
            ? options.categoryAxis
            : reference.axis === 'end'
              ? `${options.valueAxis}2`
              : options.valueAxis;
        const scale = chart.scales[axisId];
        if (!scale) continue;
        const vertical = axisId.startsWith('x');
        const shift = reference.shift ?? 0;
        const pixel = (value: number) => scale.getPixelForValue(onCategory ? value - shift : value);
        const color = options.colors[reference.tone ?? 'muted'];
        ctx.save();
        if (reference.from !== undefined && reference.to !== undefined) {
            if (layer !== 'areas') {
                ctx.restore();
                continue;
            }
            const a = pixel(reference.from);
            const b = pixel(reference.to);
            ctx.fillStyle = withAlpha(color, 0.12);
            if (vertical) ctx.fillRect(Math.min(a, b), area.top, Math.abs(b - a), area.bottom - area.top);
            else ctx.fillRect(area.left, Math.min(a, b), area.right - area.left, Math.abs(b - a));
            if (reference.label)
                label(
                    ctx,
                    options,
                    reference.label,
                    vertical ? Math.min(a, b) + 4 : area.left + 4,
                    vertical ? area.top + 12 : Math.min(a, b) + 12
                );
        } else if (reference.value !== undefined && layer === 'lines') {
            const at = pixel(reference.value);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            if (vertical) {
                ctx.moveTo(at, area.top);
                ctx.lineTo(at, area.bottom);
            } else {
                ctx.moveTo(area.left, at);
                ctx.lineTo(area.right, at);
            }
            ctx.stroke();
            if (reference.label)
                label(
                    ctx,
                    options,
                    reference.label,
                    vertical ? at + 4 : area.right - 4,
                    vertical ? area.top + 12 : at - 6,
                    vertical ? 'left' : 'right'
                );
        }
        ctx.restore();
    }
}

function label(
    ctx: CanvasRenderingContext2D,
    options: ReferenceOptions,
    text: string,
    x: number,
    y: number,
    align: CanvasTextAlign = 'left'
) {
    ctx.setLineDash([]);
    ctx.font = `12px ${options.font}`;
    ctx.fillStyle = options.text;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
}

/** Text of the reference lines and areas for the table caption ("Target: 250 · Range: 100–200") */
export function referenceSummary(references: readonly ChartReference[], formatValue: (value: number) => string) {
    return references
        .map((reference) => {
            const value =
                reference.value !== undefined
                    ? formatValue(reference.value)
                    : `${formatValue(reference.from ?? 0)}–${formatValue(reference.to ?? 0)}`;
            return reference.label ? `${reference.label}: ${value}` : value;
        })
        .join(' · ');
}

/** Brush: the range clamped to the data, with at least `minSize` rows */
export function clampRange(range: readonly [number, number] | undefined, count: number, minSize = 2): [number, number] {
    const last = Math.max(0, count - 1);
    if (!range) return [0, last];
    let [start, end] = [Math.round(Math.min(range[0], range[1])), Math.round(Math.max(range[0], range[1]))];
    start = Math.max(0, Math.min(start, last));
    end = Math.max(start, Math.min(end, last));
    if (end - start + 1 < minSize) end = Math.min(last, start + minSize - 1);
    if (end - start + 1 < minSize) start = Math.max(0, end - minSize + 1);
    return [start, end];
}

/** Ready-made chart types: title, chart area, legend, brush and the data table */
export const seriesChart = tv({
    slots: {
        legend: 'm-0 flex list-none flex-col gap-1.5 p-0',
        legendItem: 'flex items-center gap-2 text-sm text-fg',
        swatch: 'size-2.5 shrink-0 rounded-full forced-colors:border forced-colors:border-[CanvasText]',
        legendLabel: 'min-w-0 flex-1 truncate',
        legendValue: 'text-muted tabular-nums',
        pieLayout: 'flex flex-wrap items-center gap-6',
        pieBox: 'relative min-w-40 flex-1',
        brush: 'relative flex flex-col gap-1',
        brushCanvas: 'relative h-12 w-full',
        references: 'text-xs text-muted',
    },
    variants: {
        tone: {
            primary: { swatch: 'bg-primary' },
            info: { swatch: 'bg-info' },
            success: { swatch: 'bg-success' },
            warn: { swatch: 'bg-warn' },
            danger: { swatch: 'bg-danger' },
            muted: { swatch: 'bg-muted' },
        },
    },
    defaultVariants: {
        tone: 'primary',
    },
});
