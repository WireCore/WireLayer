import {
    chart as chartRecipe,
    clampRange,
    mergeOptions,
    referencePlugin,
    referenceSummary,
    seriesChart as seriesChartRecipe,
    seriesChartConfig,
    seriesTable,
    type ChartTheme,
} from '@wirecore/wirelayer-recipes';
import { useId, useState } from 'react';
import { useLocale } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { Slider } from '../components/Slider/Slider.js';
import { ChartCanvas } from './ChartCanvas.js';
import type { SeriesChartBaseProps } from './types.js';

// Internal: BarChart, LineChart and CompositeChart

interface Props extends SeriesChartBaseProps {
    kind: 'bar' | 'line' | 'composite';
    horizontal?: boolean;
    stacked?: boolean;
    curved?: boolean;
    area?: boolean;
}

export function SeriesChartView({
    kind,
    data,
    categoryKey,
    series: seriesProp,
    title,
    hideTitle = false,
    height = '18rem',
    table = true,
    formatValue,
    references,
    scale,
    legend,
    brush,
    range,
    defaultRange,
    onRangeChange,
    options,
    horizontal,
    stacked,
    curved,
    area,
    className,
    style,
    classes,
}: Props) {
    const locale = useLocale();
    const t = locale.translations.chart;
    const styles = useRecipe('chart', chartRecipe, classes)();
    const parts = useRecipe('seriesChart', seriesChartRecipe)();
    const id = useId();
    const format = formatValue ?? ((value: number) => value.toLocaleString(locale.locale));
    const [internalRange, setInternalRange] = useState<[number, number] | undefined>(defaultRange);
    const shownRange = brush ? clampRange(range ?? internalRange, data.length) : undefined;
    const series = area ? seriesProp.map((entry) => ({ ...entry, area: entry.area ?? true })) : seriesProp;
    const build = (theme: ChartTheme, reducedMotion: boolean) => {
        const config = seriesChartConfig(
            {
                kind,
                data,
                categoryKey,
                series,
                horizontal,
                stacked,
                scale,
                curved,
                references,
                range: shownRange,
                legend,
            },
            theme,
            format,
            reducedMotion,
            locale.locale
        );
        return { ...config, options: mergeOptions(config.options, options), plugins: [referencePlugin] };
    };
    // The overview below: the first series as a thin line over all rows, without axes
    const overview = (theme: ChartTheme) => {
        const config = seriesChartConfig(
            { kind: 'line', data, categoryKey, series: series.slice(0, 1), legend: false },
            theme,
            format,
            true,
            locale.locale
        );
        return {
            ...config,
            options: mergeOptions(config.options, {
                scales: { x: { display: false }, y: { display: false } },
                plugins: { tooltip: { enabled: false } },
                elements: { point: { radius: 0 } },
                events: [],
            }),
        };
    };
    const labels = data.map((row) => String(row[categoryKey] ?? ''));
    const rows = seriesTable(data, categoryKey, series, format, shownRange);
    const referenceText = references?.length ? referenceSummary(references, format) : '';

    return (
        <figure className={styles.base({ class: className })} style={style}>
            <figcaption id={`${id}title`} className={hideTitle ? styles.caption() : styles.title()}>
                {title}
            </figcaption>
            <div className={styles.canvasBox()} style={{ height }}>
                <ChartCanvas build={build} labelledby={`${id}title`} />
            </div>
            {referenceText && <p className={parts.references()}>{`${t.references}: ${referenceText}`}</p>}
            {brush && data.length > 1 && (
                <div className={parts.brush()}>
                    <div className={parts.brushCanvas()}>
                        <ChartCanvas build={overview} />
                    </div>
                    <Slider
                        value={shownRange}
                        min={0}
                        max={data.length - 1}
                        step={1}
                        minRange={1}
                        label={t.brush}
                        thumbLabels={t.brushThumbs}
                        formatValue={(index) => labels[index] ?? ''}
                        showValue
                        onValueChange={(value) => {
                            const next = clampRange([value[0] ?? 0, value[1] ?? 0], data.length);
                            setInternalRange(next);
                            onRangeChange?.(next);
                        }}
                    />
                </div>
            )}
            {table && (
                <details className={styles.details()}>
                    <summary className={styles.summary()}>{t.showTable}</summary>
                    <div className={styles.scroll()}>
                        <table className={styles.table()}>
                            <caption className={styles.caption()}>{title}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={styles.th()}>
                                        {t.category}
                                    </th>
                                    {rows.columns.map((column) => (
                                        <th key={column} scope="col" className={styles.th()}>
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.rows.map((row, index) => (
                                    <tr key={index}>
                                        <th scope="row" className={styles.rowHeader()}>
                                            {row.label}
                                        </th>
                                        {row.values.map((value, column) => (
                                            <td key={column} className={styles.td()}>
                                                {value}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            )}
        </figure>
    );
}
