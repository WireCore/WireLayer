import {
    readChartTheme,
    sparkline as sparklineRecipe,
    sparklineSummary,
    themeChartOptions,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Chart as ChartJs, type ChartConfiguration } from 'chart.js/auto';
import { useEffect, useRef, type CSSProperties } from 'react';
import { useLocale } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';

export interface SparklineProps {
    data: number[];
    /** What the line shows, e.g. "Load over the last 24 hours" – starts the text alternative */
    label: string;
    /** Area under the line */
    fill?: boolean;
    width?: string;
    height?: string;
    formatValue?: (value: number) => string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sparklineRecipe>;
}

/** Small line without axes; the canvas is an image named by the trend and the extremes */
export function Sparkline({
    classes,
    data,
    label,
    fill = true,
    width = '8rem',
    height = '2rem',
    formatValue,
    className,
    style,
}: SparklineProps) {
    const sparkline = useRecipe('sparkline', sparklineRecipe, classes);
    const { locale, translations } = useLocale();
    const canvas = useRef<HTMLCanvasElement>(null);
    const key = data.join(',');
    useEffect(() => {
        const element = canvas.current;
        const context = element?.getContext('2d');
        if (!element || !context) return;
        const values = key ? key.split(',').map(Number) : [];
        const config = () => {
            const theme = readChartTheme(element);
            const color = theme.palette[0]!;
            const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
            return {
                data: {
                    labels: values.map((_, index) => index),
                    datasets: [
                        {
                            data: values,
                            borderColor: color,
                            backgroundColor: color.replace(/[\d.]+\)$/, '0.15)'),
                            borderWidth: 1.5,
                            fill,
                            pointRadius: 0,
                            tension: 0.35,
                        },
                    ],
                },
                options: themeChartOptions(
                    'line',
                    theme,
                    {
                        scales: { x: { display: false }, y: { display: false } },
                        plugins: { legend: { display: false }, tooltip: { enabled: false } },
                        events: [],
                    },
                    reducedMotion,
                    locale
                ),
            };
        };
        const instance = new ChartJs(context, { type: 'line', ...config() } as ChartConfiguration<'line'>);
        const recolor = () => {
            Object.assign(instance, config());
            instance.update();
        };
        // Theme and mode live on <html>; without data-mode the page follows the system
        const observer = new MutationObserver(recolor);
        observer.observe(document.documentElement, { attributes: true });
        const scheme = matchMedia('(prefers-color-scheme: dark)');
        scheme.addEventListener('change', recolor);
        return () => {
            observer.disconnect();
            scheme.removeEventListener('change', recolor);
            instance.destroy();
        };
    }, [key, fill, locale]);
    return (
        <span className={sparkline({ class: className })} style={{ width, height, ...style }}>
            <canvas
                ref={canvas}
                role="img"
                aria-label={sparklineSummary(
                    label,
                    data,
                    formatValue ?? ((value) => value.toLocaleString(locale)),
                    translations.chart
                )}
            />
        </span>
    );
}
