import {
    animateNumber,
    formatNumber,
    formatTrend,
    prefersMotion,
    statistic as statisticRecipe,
    statisticTrend,
    visuallyHidden,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface StatisticProps extends Omit<ComponentProps<'div'>, 'prefix'> {
    /** What the number is, e.g. "Revenue" */
    label: string;
    /** The number; null or undefined shows nothing (or the placeholder while loading) */
    value?: number | null;
    /** Format of the value, e.g. { style: 'currency', currency: 'EUR' } or { notation: 'compact' } */
    formatOptions?: Intl.NumberFormatOptions;
    /** Unit (Intl unit identifier), e.g. "percent", "kilobyte", "hour" – formatted with the locale */
    unit?: string;
    /** Text before the value, e.g. "≈" */
    prefix?: string;
    /** Text after the value, e.g. "users" */
    suffix?: string;
    /** Change in percent, e.g. 12 → "+12%" with an arrow; color comes on top of arrow and text */
    trend?: number | null;
    /** Text after the trend, e.g. "vs. last month" */
    trendLabel?: string;
    /** Format of the trend (default: percent with sign, one decimal) */
    trendFormatOptions?: Intl.NumberFormatOptions;
    /** Falling is good (e.g. error rate, costs): down is green, up red */
    invertTrend?: boolean;
    /** Text below the value */
    description?: string;
    /** Icon next to the label */
    icon?: IconComponent;
    /** The value is being loaded: placeholder and aria-busy */
    loading?: boolean;
    /**
     * Counts up to a new value (only when the user allows motion). Screen readers get the final value right away,
     * not the counting
     */
    animate?: boolean;
    /** Announces changes of the value (polite live region) – for values that update by themselves */
    live?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /** In a card with border and padding */
    bordered?: boolean;
    /** Locale of the number formats (default: the LocaleProvider's) */
    locale?: string;
    /** A small chart below, e.g. a Sparkline */
    chart?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof statisticRecipe>;
}

const trendIcons = { up: TrendingUp, down: TrendingDown, flat: Minus };

/** Label, value (with prefix/suffix and unit), trend as arrow + text, optional chart */
export function Statistic({
    classes,
    label,
    value,
    formatOptions,
    unit,
    prefix,
    suffix,
    trend,
    trendLabel,
    trendFormatOptions,
    invertTrend,
    description,
    icon: Icon,
    loading,
    animate,
    live,
    size,
    bordered,
    locale: localeProp,
    chart,
    className,
    ...props
}: StatisticProps) {
    const statistic = useRecipe('statistic', statisticRecipe, classes);
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const trendState = statisticTrend(trend, invertTrend);
    const styles = statistic({ size, tone: trendState.tone, bordered });
    const options: Intl.NumberFormatOptions | undefined = unit
        ? { style: 'unit', unit, ...formatOptions }
        : formatOptions;
    const format = (number: number | null | undefined) => formatNumber(number, locale, options);
    const text = format(value);
    const trendText = trend === null || trend === undefined ? '' : formatTrend(trend, locale, trendFormatOptions);
    const TrendIcon = trendIcons[trendState.direction];

    // Counting: while a new value is counted up, `frame` is the number shown (null otherwise)
    const [frame, setFrame] = useState<number | null>(null);
    const previous = useRef(value);
    useEffect(() => {
        const from = previous.current;
        previous.current = value;
        if (!animate || typeof value !== 'number' || typeof from !== 'number' || from === value || !prefersMotion())
            return;
        const whole = Number.isInteger(value) && Number.isInteger(from);
        return animateNumber(from, value, (next) => setFrame(next === value ? null : whole ? Math.round(next) : next));
    }, [value, animate]);
    const counting = animate && frame !== null;
    const hidden = visuallyHidden();

    let content: ReactNode;
    if (loading)
        content = (
            <>
                <span className={styles.placeholder()} aria-hidden="true" />
                <span className={hidden}>{localeContext.translations.statistic.loading}</span>
            </>
        );
    else if (animate)
        content = (
            <>
                <span aria-hidden="true">{counting ? format(frame) : text}</span>
                <span className={hidden}>{text}</span>
            </>
        );
    else content = <span>{text}</span>;

    return (
        <div {...props} className={styles.base({ class: className })} aria-busy={loading || undefined}>
            <div className={styles.header()}>
                <span className={styles.label()}>{label}</span>
                {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
            </div>
            <div
                className={styles.value()}
                aria-live={live ? 'polite' : undefined}
                aria-atomic={live ? 'true' : undefined}
            >
                {prefix && <span className={styles.affix()}>{prefix}</span>}
                {content}
                {suffix && <span className={styles.affix()}>{suffix}</span>}
            </div>
            {(trendText || trendLabel || description) && (
                <p className={styles.footer()}>
                    {trendText && (
                        <span className={styles.trend()}>
                            <TrendIcon className={styles.trendIcon()} aria-hidden="true" />
                            {trendText}
                        </span>
                    )}
                    {trendLabel && <span>{trendLabel}</span>}
                    {description && <span className={styles.description()}>{description}</span>}
                </p>
            )}
            {chart && <div className={styles.chart()}>{chart}</div>}
        </div>
    );
}
