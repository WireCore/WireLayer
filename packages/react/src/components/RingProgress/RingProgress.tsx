import {
    ringParts,
    ringProgress as ringProgressRecipe,
    type MeterColor,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface RingProgressSegment {
    value: number;
    /** Name in the legend */
    label?: string;
    color?: MeterColor;
}

export interface RingProgressProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** One value (a progress bar) – or `segments` */
    value?: number;
    /** Several parts one after another (a group with a legend) */
    segments?: readonly RingProgressSegment[];
    /** The whole (default 100, or the sum of the segments when larger) */
    max?: number;
    /** Visible label below the ring, also its accessible name */
    label: string;
    size?: 'sm' | 'md' | 'lg';
    /** Width of the ring in % of its size (default 10) */
    thickness?: number;
    /** Round line ends (one value only) */
    roundCaps?: boolean;
    /** Show the legend of the segments (otherwise only for screen readers) */
    legend?: boolean;
    /** Text of a value, in the middle and the legend (default: percent of max) */
    formatValue?: (value: number, max: number) => string;
    /** Content in the middle of the ring (default: the value) */
    center?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof ringProgressRecipe>;
}

const palette: MeterColor[] = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];
const percent = (value: number, max: number) => `${Math.round((value / max) * 100)} %`;

/**
 * One value: the ring is a progress bar named by the label. Segments: a group named by the label, the legend
 * lists every part with its value as text. The drawing itself is hidden from screen readers.
 */
export function RingProgress({
    classes,
    value,
    segments,
    max,
    label,
    size,
    thickness = 10,
    roundCaps,
    legend = true,
    formatValue = percent,
    center,
    className,
    ...props
}: RingProgressProps) {
    const ringProgress = useRecipe('ringProgress', ringProgressRecipe, classes);
    const labelId = `${useId()}label`;
    const parts: readonly RingProgressSegment[] =
        segments ?? (value === undefined ? [] : [{ value, color: 'primary' }]);
    const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0);
    const whole = max ?? Math.max(100, total);
    const single = !segments;
    const radius = 50 - thickness / 2;
    const circumference = 2 * Math.PI * radius;
    const arcs = ringParts(
        parts.map((part) => part.value),
        whole,
        parts.length > 1 ? 0.006 : 0
    ).map((arc, index) => {
        const part = parts[index]!;
        return {
            key: part.label ?? String(index),
            color: part.color ?? palette[index % palette.length]!,
            dasharray: `${arc.length * circumference} ${circumference}`,
            dashoffset: -arc.start * circumference,
        };
    });
    const text = formatValue(total, whole);
    const styles = ringProgress({ size, hideLegend: !legend });
    return (
        <div
            {...props}
            className={styles.base({ class: className })}
            role={single ? undefined : 'group'}
            aria-labelledby={single ? undefined : labelId}
        >
            <div
                className={styles.ring()}
                role={single ? 'progressbar' : undefined}
                aria-labelledby={single ? labelId : undefined}
                aria-valuenow={single ? total : undefined}
                aria-valuemin={single ? 0 : undefined}
                aria-valuemax={single ? whole : undefined}
                aria-valuetext={single ? text : undefined}
            >
                <svg className={styles.svg()} viewBox="0 0 100 100" aria-hidden="true">
                    <circle className={styles.track()} cx="50" cy="50" r={radius} strokeWidth={thickness} />
                    {arcs.map((arc) => (
                        <circle
                            key={arc.key}
                            className={ringProgress({ color: arc.color }).segment()}
                            cx="50"
                            cy="50"
                            r={radius}
                            strokeWidth={thickness}
                            strokeDasharray={arc.dasharray}
                            strokeDashoffset={arc.dashoffset}
                            strokeLinecap={single && roundCaps && total > 0 ? 'round' : undefined}
                        />
                    ))}
                </svg>
                <div className={styles.center()} aria-hidden={single || undefined}>
                    {center ?? <span className={styles.value()}>{text}</span>}
                </div>
            </div>
            <span id={labelId} className={styles.label()}>
                {label}
            </span>
            {!!segments?.length && (
                <ul className={styles.legend()}>
                    {segments.map((part, index) => (
                        <li key={part.label ?? index} className={styles.legendItem()}>
                            <span className={ringProgress({ color: arcs[index]!.color }).swatch()} aria-hidden="true" />
                            {`${part.label ?? ''} `}
                            <span className={styles.legendValue()}>{formatValue(part.value, whole)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
