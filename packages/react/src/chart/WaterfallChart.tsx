import {
    chart as chartRecipe,
    mergeOptions,
    waterfallBars,
    waterfallConfig,
    type ChartTheme,
    type ChartTone,
    type RecipeClasses,
    type WaterfallStep,
} from '@wirecore/wirelayer-recipes';
import { useId, type CSSProperties } from 'react';
import { useLocale } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { ChartCanvas } from './ChartCanvas.js';

export interface WaterfallChartProps {
    /** Changes and totals in order (`total: true` shows the running sum) */
    steps: WaterfallStep[];
    /** Title of the chart, also its accessible name */
    title: string;
    hideTitle?: boolean;
    /** Height of the chart area (CSS length, default 18rem) */
    height?: string;
    /** The steps as a table below (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats values in the axis, tooltips and table */
    formatValue?: (value: number) => string;
    /** Colours of rising, falling and total bars (default success, danger, primary) */
    tones?: { up?: ChartTone; down?: ChartTone; total?: ChartTone };
    /** Chart.js options – merged over the WireLayer defaults */
    options?: Record<string, unknown>;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe chart) */
    classes?: RecipeClasses<typeof chartRecipe>;
}

/** Floating bars: each change starts where the previous one ended, totals from zero; the table is the text */
export function WaterfallChart({
    steps,
    title,
    hideTitle = false,
    height = '18rem',
    table = true,
    formatValue,
    tones,
    options,
    className,
    style,
    classes,
}: WaterfallChartProps) {
    const locale = useLocale();
    const t = locale.translations.chart;
    const styles = useRecipe('chart', chartRecipe, classes)();
    const id = useId();
    const format = formatValue ?? ((value: number) => value.toLocaleString(locale.locale));
    const build = (theme: ChartTheme, reducedMotion: boolean) => {
        const config = waterfallConfig(steps, theme, format, t, tones, reducedMotion, locale.locale);
        return { ...config, options: mergeOptions(config.options, options) };
    };
    const rows = waterfallBars(steps);
    return (
        <figure className={styles.base({ class: className })} style={style}>
            <figcaption id={`${id}title`} className={hideTitle ? styles.caption() : styles.title()}>
                {title}
            </figcaption>
            <div className={styles.canvasBox()} style={{ height }}>
                <ChartCanvas build={build} labelledby={`${id}title`} />
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
                                        {t.change}
                                    </th>
                                    <th scope="col" className={styles.th()}>
                                        {t.total}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, index) => (
                                    <tr key={index}>
                                        <th scope="row" className={styles.rowHeader()}>
                                            {row.label}
                                        </th>
                                        <td className={styles.td()}>
                                            {row.kind === 'total' ? '–' : format(row.change)}
                                        </td>
                                        <td className={styles.td()}>{format(row.sum)}</td>
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
