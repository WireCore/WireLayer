import { meterGroup as meterGroupRecipe, type MeterColor, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useId, type CSSProperties } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface MeterGroupItem {
    label: string;
    value: number;
    color?: MeterColor;
}

export interface MeterGroupProps {
    items: readonly MeterGroupItem[];
    /** Visible label, e.g. "Storage" */
    label: string;
    /** The whole (default: the sum of the values) */
    max?: number;
    /** Text of a value in the legend (default: percent of max) */
    formatValue?: (value: number, max: number) => string;
    /** Vertical bar growing from the bottom, the legend next to it */
    orientation?: 'horizontal' | 'vertical';
    /** Where the legend is: bottom (default), top, start or end */
    legendPosition?: 'top' | 'bottom' | 'start' | 'end';
    /** Legend entries in a row (default) or one below the other */
    legendOrientation?: 'horizontal' | 'vertical';
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof meterGroupRecipe>;
}

const palette: MeterColor[] = ['primary', 'info', 'success', 'warn', 'danger', 'muted'];
const percent = (value: number, max: number) => `${Math.round((value / max) * 100)} %`;

/** One bar for the parts (visual), the legend lists every part with its value as text */
export function MeterGroup({
    classes,
    items,
    label,
    max,
    formatValue = percent,
    orientation,
    legendPosition,
    legendOrientation,
    className,
    style,
}: MeterGroupProps) {
    const meterGroup = useRecipe('meterGroup', meterGroupRecipe, classes);
    const styles = meterGroup({
        orientation,
        legendPosition,
        legendLayout: legendOrientation === 'vertical' ? 'stacked' : undefined,
    });
    const sizeKey = orientation === 'vertical' ? 'height' : 'width';
    const id = useId();
    const total = max ?? items.reduce((sum, item) => sum + item.value, 0);
    const colorOf = (item: MeterGroupItem, index: number) => item.color ?? palette[index % palette.length]!;
    return (
        <div role="group" aria-labelledby={`${id}label`} className={styles.base({ class: className })} style={style}>
            <span id={`${id}label`} className={styles.label()}>
                {label}
            </span>
            <div className={styles.bar()} aria-hidden="true">
                {items.map((item, index) => (
                    <span
                        key={item.label}
                        className={meterGroup({ color: colorOf(item, index), orientation }).segment()}
                        style={{ [sizeKey]: `${(item.value / total) * 100}%` }}
                    />
                ))}
            </div>
            <ul className={styles.legend()}>
                {items.map((item, index) => (
                    <li key={item.label} className={styles.legendItem()}>
                        <span className={meterGroup({ color: colorOf(item, index) }).swatch()} aria-hidden="true" />
                        {`${item.label} `}
                        <span className={styles.value()}>{formatValue(item.value, total)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
