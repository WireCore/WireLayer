import {
    radialBar as radialBarRecipe,
    radialBarRings,
    toneAt,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { Fragment, useId, type ComponentProps } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface RadialBarItem {
    label: string;
    value: number;
    /** End of this ring's scale (default: the chart's `max`) */
    max?: number;
    /** Colour of the ring (default: in turn) */
    tone?: VisualTone;
}

export interface RadialBarProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** One ring per item, the first outermost */
    items: readonly RadialBarItem[];
    /** Accessible name (visible with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** End of the scale (default 100) */
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    /** Formats the value in the legend (default: the share in percent) */
    formatValue?: (value: number, max: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radialBarRecipe>;
}

/** Rings (decorative) and a legend with the values as the text (a named group) */
export function RadialBar({
    items,
    label,
    showTitle,
    max = 100,
    size = 'md',
    formatValue,
    classes,
    className,
    ...props
}: RadialBarProps) {
    const radialBar = useRecipe('radialBar', radialBarRecipe, classes);
    const locale = useLocale();
    const id = useId();
    const styles = radialBar({ size });
    const parts = radialBarRings(items, { max });
    const percent = new Intl.NumberFormat(locale.locale, { style: 'percent', maximumFractionDigits: 1 });
    const rings = items.map((item, index) => {
        const part = parts[index]!;
        const tone = item.tone ?? toneAt(index);
        return {
            ...item,
            ...part,
            text: formatValue ? formatValue(item.value, item.max ?? max) : percent.format(part.share),
            ring: radialBar({ tone }).ring(),
            swatch: radialBar({ tone }).swatch(),
        };
    });
    return (
        <div
            {...props}
            className={styles.base({ class: className })}
            role="group"
            aria-label={showTitle ? undefined : label}
            aria-labelledby={showTitle ? `${id}title` : undefined}
        >
            {showTitle && (
                <p id={`${id}title`} className={styles.title()}>
                    {label}
                </p>
            )}
            <div className={styles.chart()}>
                <svg className={styles.svg()} viewBox="0 0 100 100" aria-hidden="true">
                    {rings.map((ring) => (
                        <Fragment key={ring.label}>
                            <circle
                                className={styles.track()}
                                cx="50"
                                cy="50"
                                r={ring.radius}
                                strokeWidth={ring.thickness}
                            />
                            <circle
                                className={ring.ring}
                                cx="50"
                                cy="50"
                                r={ring.radius}
                                strokeWidth={ring.thickness}
                                strokeLinecap="round"
                                strokeDasharray={`${ring.dash} ${ring.circumference}`}
                            />
                        </Fragment>
                    ))}
                </svg>
            </div>
            <ul role="list" className={styles.legend()}>
                {rings.map((ring) => (
                    <li key={ring.label} className={styles.legendItem()}>
                        <span className={ring.swatch} aria-hidden="true" />
                        {ring.label}
                        <span className={styles.legendValue()}>{ring.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
