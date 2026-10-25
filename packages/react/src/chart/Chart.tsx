import {
    chart as chartRecipe,
    type RecipeClasses,
    chartTable,
    readChartTheme,
    themeChartData,
    themeChartOptions,
} from '@wirecore/wirelayer-recipes';
import { Chart as ChartJs, type ChartData, type ChartOptions, type ChartType, type Plugin } from 'chart.js/auto';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useLocale } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';

export interface ChartProps<TType extends ChartType> {
    /** Chart.js chart type – it alone decides the types of `data`, `options` and `plugins` */
    type: TType;
    data: ChartData<NoInfer<TType>>;
    /**
     * Chart.js options – merged over the WireLayer defaults (colours, font, no fixed aspect ratio). Options kept in
     * a variable need their type, e.g. `computed<ChartOptions<'bar'>>(…)`, or `indexAxis: 'y'` becomes a string
     */
    options?: ChartOptions<NoInfer<TType>>;
    /** Inline Chart.js plugins of this chart (global ones: `Chart.register`) – changing them re-creates the chart */
    plugins?: Plugin<NoInfer<TType>>[];
    /** Title of the chart, also its accessible name */
    title: string;
    /** Keep the title for screen readers only, e.g. inside a card that already has a heading */
    hideTitle?: boolean;
    /** Height of the chart area (CSS length) */
    height?: string;
    /** The data as a table below the chart (opens on demand) – the text alternative for the canvas */
    table?: boolean;
    formatValue?: (value: number) => string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chartRecipe>;
}

/** Canvas with role="img" named by the title; the data table is its text alternative (WCAG 1.1.1) */
export function Chart<TType extends ChartType>({
    classes,
    type,
    data,
    options,
    plugins,
    title,
    hideTitle = false,
    height = '18rem',
    table = true,
    formatValue,
    className,
    style,
}: ChartProps<TType>) {
    const styles = useRecipe('chart', chartRecipe, classes)();
    const { locale, translations } = useLocale();
    const id = useId();
    const canvas = useRef<HTMLCanvasElement>(null);
    // The latest props and the update function of the current chart, for the effects below
    const latest = useRef({ data, options });
    const refresh = useRef<(() => void) | undefined>(undefined);
    const rows = chartTable(data, formatValue ?? ((value) => value.toLocaleString(locale)), translations.chart);
    // A new list with the same plugins (inline) is no change – other plugins re-create the chart
    const [ownPlugins, setOwnPlugins] = useState(plugins);
    const samePlugins =
        ownPlugins === plugins ||
        (ownPlugins?.length === plugins?.length && !!plugins?.every((plugin, index) => plugin === ownPlugins![index]));
    if (!samePlugins) setOwnPlugins(plugins);
    const chartPlugins = samePlugins ? ownPlugins : plugins;

    // (Re)create the chart when the type changes; recolour on theme/mode/motion changes
    useEffect(() => {
        const motion = matchMedia('(prefers-reduced-motion: reduce)');
        // Without data-mode the page follows the system – recolour when it switches
        const scheme = matchMedia('(prefers-color-scheme: dark)');
        const config = () => {
            const theme = readChartTheme(canvas.current!);
            return {
                data: themeChartData(type, latest.current.data, theme),
                options: themeChartOptions(
                    type,
                    theme,
                    latest.current.options,
                    motion.matches,
                    locale
                ) as ChartOptions<TType>,
            };
        };
        // No 2D context outside a real browser (e.g. jsdom) – the table still renders
        const context = canvas.current?.getContext('2d');
        const instance = context
            ? new ChartJs(context, { type, ...config(), plugins: chartPlugins ? [...chartPlugins] : [] })
            : undefined;
        const update = () => {
            if (!instance) return;
            Object.assign(instance, config());
            instance.update();
        };
        refresh.current = update;
        // Theme and mode live on <html> (data-theme, data-mode)
        const observer = new MutationObserver(update);
        observer.observe(document.documentElement, { attributes: true });
        motion.addEventListener('change', update);
        scheme.addEventListener('change', update);
        return () => {
            observer.disconnect();
            motion.removeEventListener('change', update);
            scheme.removeEventListener('change', update);
            instance?.destroy();
        };
    }, [type, locale, chartPlugins]);

    useEffect(() => {
        latest.current = { data, options };
        refresh.current?.();
    }, [data, options]);

    return (
        <figure className={styles.base({ class: className })} style={style}>
            <figcaption id={`${id}title`} className={hideTitle ? styles.caption() : styles.title()}>
                {title}
            </figcaption>
            <div className={styles.canvasBox()} style={{ height }}>
                <canvas ref={canvas} role="img" aria-labelledby={`${id}title`} />
            </div>
            {table && (
                <details className={styles.details()}>
                    <summary className={styles.summary()}>{translations.chart.showTable}</summary>
                    <div className={styles.scroll()}>
                        <table className={styles.table()}>
                            <caption className={styles.caption()}>{title}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={styles.th()}>
                                        {translations.chart.category}
                                    </th>
                                    {rows.columns.map((column) => (
                                        <th key={column} scope="col" className={styles.th()}>
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.rows.map((row) => (
                                    <tr key={row.label}>
                                        <th scope="row" className={styles.rowHeader()}>
                                            {row.label}
                                        </th>
                                        {row.values.map((value, index) => (
                                            <td key={index} className={styles.td()}>
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
