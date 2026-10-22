import { GAUGE_ARC, gauge as gaugeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export type GaugeStatus = 'neutral' | 'success' | 'warn' | 'danger';

export interface GaugeProps extends Omit<ComponentProps<'div'>, 'children'> {
    value: number;
    min?: number;
    max?: number;
    /** Visible label below the gauge, also its accessible name */
    label: string;
    /** Colour of the arc (default: from `thresholds`, else neutral) */
    status?: GaugeStatus;
    /** From this value on the arc takes the status, e.g. [{ from: 70, status: 'warn' }, { from: 90, status: 'danger' }] */
    thresholds?: { from: number; status: GaugeStatus }[];
    size?: 'sm' | 'md' | 'lg';
    /** Number format of the value, min and max, e.g. { style: 'unit', unit: 'percent' } */
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof gaugeRecipe>;
}

const arc = 'M10 62 A50 50 0 0 1 110 62';

/** role="meter": a value in a known range; the arc is decoration, the value is named as text */
export function Gauge({
    value,
    min = 0,
    max = 100,
    label,
    status,
    thresholds,
    size,
    formatOptions,
    locale,
    classes,
    className,
    ...props
}: GaugeProps) {
    const gauge = useRecipe('gauge', gaugeRecipe, classes);
    const localeContext = useLocale();
    const current =
        status ??
        [...(thresholds ?? [])].sort((a, b) => b.from - a.from).find((threshold) => value >= threshold.from)?.status ??
        'neutral';
    const styles = gauge({ status: current, size });
    const number = new Intl.NumberFormat(locale ?? localeContext.locale, formatOptions);
    const share = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0;
    return (
        <div
            {...props}
            className={styles.base({ class: className })}
            role="meter"
            aria-label={label}
            aria-valuenow={value}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuetext={number.format(value)}
        >
            <svg className={styles.svg()} viewBox="0 0 120 74" aria-hidden="true">
                <path className={styles.track()} d={arc} strokeWidth="10" />
                <path
                    className={styles.range()}
                    d={arc}
                    strokeWidth="10"
                    strokeDasharray={`${share * GAUGE_ARC} ${GAUGE_ARC}`}
                />
                <text className={styles.value()} x="60" y="58" textAnchor="middle">
                    {number.format(value)}
                </text>
                <text className={styles.bounds()} x="10" y="73" textAnchor="middle">
                    {number.format(min)}
                </text>
                <text className={styles.bounds()} x="110" y="73" textAnchor="middle">
                    {number.format(max)}
                </text>
            </svg>
            <span className={styles.label()} aria-hidden="true">
                {label}
            </span>
        </div>
    );
}
