import {
    chart as chartRecipe,
    mergeOptions,
    pieConfig,
    pieLegend,
    seriesChart as seriesChartRecipe,
    type ChartTheme,
    type RecipeClasses,
    type PieSlice,
} from '@wirecore/wirelayer-recipes';
import { useId, type CSSProperties } from 'react';
import { useLocale } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { ChartCanvas } from './ChartCanvas.js';

export interface PieChartProps {
    /** The slices: label, value, colour */
    slices: PieSlice[];
    /** Title of the chart, also its accessible name */
    title: string;
    hideTitle?: boolean;
    /** A ring instead of a full pie */
    donut?: boolean;
    /** Height of the chart area (CSS length, default 14rem) */
    height?: string;
    /** Legend beside the chart with value and share of each slice (default true) */
    legend?: boolean;
    /** The slices as a table below (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats values in the legend, tooltips and table */
    formatValue?: (value: number) => string;
    /** Chart.js options – merged over the WireLayer defaults */
    options?: Record<string, unknown>;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe chart) */
    classes?: RecipeClasses<typeof chartRecipe>;
}

/** Pie or doughnut on a canvas named by the title; the legend lists value and share, the table is the text */
export function PieChart({
    slices,
    title,
    hideTitle = false,
    donut = false,
    height = '14rem',
    legend = true,
    table = true,
    formatValue,
    options,
    className,
    style,
    classes,
}: PieChartProps) {
    const locale = useLocale();
    const t = locale.translations.chart;
    const styles = useRecipe('chart', chartRecipe, classes)();
    const seriesChart = useRecipe('seriesChart', seriesChartRecipe);
    const parts = seriesChart();
    const id = useId();
    const format = formatValue ?? ((value: number) => value.toLocaleString(locale.locale));
    const build = (theme: ChartTheme, reducedMotion: boolean) => {
        const config = pieConfig(slices, donut, theme, format, title, reducedMotion, locale.locale);
        return { ...config, options: mergeOptions(config.options, options) };
    };
    const rows = pieLegend(slices, format, locale.locale);
    return (
        <figure className={styles.base({ class: className })} style={style}>
            <figcaption id={`${id}title`} className={hideTitle ? styles.caption() : styles.title()}>
                {title}
            </figcaption>
            <div className={parts.pieLayout()}>
                <div className={parts.pieBox()} style={{ height }}>
                    <ChartCanvas build={build} labelledby={`${id}title`} />
                </div>
                {legend && (
                    <ul role="list" aria-label={t.legend} className={parts.legend()}>
                        {rows.map((row) => (
                            <li key={row.label} className={parts.legendItem()}>
                                <span className={seriesChart({ tone: row.tone }).swatch()} aria-hidden="true" />
                                <span className={parts.legendLabel()}>{row.label}</span>
                                <span className={parts.legendValue()}>{`${row.value} · ${row.share}`}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
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
                                    <th scope="col" className={styles.th()}>
                                        {t.value}
                                    </th>
                                    <th scope="col" className={styles.th()}>
                                        {t.share}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.label}>
                                        <th scope="row" className={styles.rowHeader()}>
                                            {row.label}
                                        </th>
                                        <td className={styles.td()}>{row.value}</td>
                                        <td className={styles.td()}>{row.share}</td>
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
