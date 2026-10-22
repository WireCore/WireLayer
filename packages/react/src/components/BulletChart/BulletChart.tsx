import {
    bulletChart as bulletChartRecipe,
    bulletScale,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { useId, type ComponentProps } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface BulletChartProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** Name of the measure, e.g. "Revenue" */
    label: string;
    /** Smaller text below the name, e.g. the unit */
    description?: string;
    value: number;
    /** End of the scale */
    max: number;
    /** Start of the scale (default 0) */
    min?: number;
    /** Target value: a marker across the bar */
    target?: number;
    /** Upper limits of the qualitative bands (e.g. poor, fair, good), shown as shades behind the bar */
    ranges?: number[];
    /** Colour of the bar (default primary) */
    tone?: VisualTone;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof bulletChartRecipe>;
}

/** A meter (role="meter") with the value, the end of the scale and the target as its text */
export function BulletChart({
    label,
    description,
    value,
    max,
    min = 0,
    target,
    ranges,
    tone = 'primary',
    formatValue,
    classes,
    className,
    ...props
}: BulletChartProps) {
    const bulletChart = useRecipe('bulletChart', bulletChartRecipe, classes);
    const locale = useLocale();
    const t = locale.translations.chart;
    const id = useId();
    const styles = bulletChart({ tone });
    const format = formatValue ?? ((number: number) => number.toLocaleString(locale.locale));
    const scale = bulletScale({ value, target, min, max, ranges });
    return (
        <div {...props} className={styles.base({ class: className })}>
            <div className={styles.header()}>
                <span id={`${id}label`} className={styles.label()}>
                    {label}
                </span>
                {description && (
                    <span id={`${id}description`} className={styles.description()}>
                        {description}
                    </span>
                )}
            </div>
            <div
                role="meter"
                aria-labelledby={`${id}label`}
                aria-describedby={description ? `${id}description` : undefined}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value}
                aria-valuetext={t.bulletValue(
                    format(value),
                    format(max),
                    target === undefined ? undefined : format(target)
                )}
                className={styles.meter()}
            >
                {scale.bands.map((band) => (
                    <span
                        key={band.band}
                        className={styles.band()}
                        data-band={band.band}
                        style={{ width: `${band.width}%` }}
                    />
                ))}
                <span className={styles.bar()} style={{ width: `${scale.value}%` }} />
                {scale.target !== undefined && (
                    <span className={styles.target()} style={{ insetInlineStart: `${scale.target}%` }} />
                )}
            </div>
            <div className={styles.values()} aria-hidden="true">
                <span className={styles.current()}>{format(value)}</span>
                {target !== undefined && <span>{`${t.target}: ${format(target)}`}</span>}
                <span>{format(max)}</span>
            </div>
        </div>
    );
}
