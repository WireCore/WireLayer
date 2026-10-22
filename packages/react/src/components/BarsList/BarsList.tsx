import {
    barsList as barsListRecipe,
    barsListWidths,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { useId, type ComponentProps } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface BarsListItem {
    label: string;
    value: number;
    /** Makes the label a link */
    href?: string;
    /** Colour of the bar (default: the list's tone) */
    tone?: VisualTone;
}

export interface BarsListProps extends Omit<ComponentProps<'div'>, 'children'> {
    items: BarsListItem[];
    /** Accessible name of the list (visible with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** Value of a full bar (default: the largest value) */
    max?: number;
    /** Colour of the bars (default primary) */
    tone?: VisualTone;
    /** Column headings above the list, e.g. "Page" and "Views" */
    labelHeader?: string;
    valueHeader?: string;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof barsListRecipe>;
}

/** A list of labels and values; the bars behind the labels show the values as lengths */
export function BarsList({
    items,
    label,
    showTitle,
    max,
    tone = 'primary',
    labelHeader,
    valueHeader,
    formatValue,
    classes,
    className,
    ...props
}: BarsListProps) {
    const barsList = useRecipe('barsList', barsListRecipe, classes);
    const locale = useLocale();
    const id = useId();
    const styles = barsList({ tone });
    const widths = barsListWidths(
        items.map((item) => item.value),
        max
    );
    const format = formatValue ?? ((value: number) => value.toLocaleString(locale.locale));
    return (
        <div {...props} className={styles.base({ class: className })}>
            {showTitle && (
                <p id={`${id}title`} className={styles.title()}>
                    {label}
                </p>
            )}
            {(labelHeader || valueHeader) && (
                <div className={styles.header()} aria-hidden="true">
                    <span>{labelHeader}</span>
                    <span>{valueHeader}</span>
                </div>
            )}
            <ul
                role="list"
                className={styles.list()}
                aria-label={showTitle ? undefined : label}
                aria-labelledby={showTitle ? `${id}title` : undefined}
            >
                {items.map((item, index) => (
                    <li key={item.label} className={styles.item()}>
                        <span
                            className={barsList({ tone: item.tone ?? tone }).bar()}
                            style={{ width: `${widths[index]}%` }}
                            aria-hidden="true"
                        />
                        <span className={styles.label()}>
                            {item.href ? (
                                <a href={item.href} className={styles.link()}>
                                    {item.label}
                                </a>
                            ) : (
                                item.label
                            )}
                        </span>
                        <span className={styles.value()}>{format(item.value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
