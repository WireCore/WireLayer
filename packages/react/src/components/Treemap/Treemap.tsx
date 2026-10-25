import {
    squarify,
    toneAt,
    treemap as treemapRecipe,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface TreemapItem {
    label: string;
    value: number;
    /** Colour of the tile (default: in turn) */
    tone?: VisualTone;
}

export interface TreemapProps extends Omit<ComponentProps<'div'>, 'children'> {
    items: readonly TreemapItem[];
    /** Accessible name of the list (and visible title with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** Height of the area (CSS length) */
    height?: string;
    /** Width to height of the area the tiles are laid out for */
    ratio?: number;
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof treemapRecipe>;
}

/** A list of the items with value and share; the tiles show the shares as areas */
export function Treemap({
    items,
    label,
    showTitle = false,
    height = '320px',
    ratio = 2,
    formatOptions,
    locale,
    classes,
    className,
    ...props
}: TreemapProps) {
    const treemap = useRecipe('treemap', treemapRecipe, classes);
    const styles = treemap();
    const localeContext = useLocale();
    const t = useTranslations().treemap;
    const total = items.reduce((sum, item) => sum + Math.max(0, item.value), 0);
    const rects = squarify(
        items.map((item) => item.value),
        ratio * 100,
        100
    );
    const number = new Intl.NumberFormat(locale ?? localeContext.locale, formatOptions);
    const percent = new Intl.NumberFormat(locale ?? localeContext.locale, {
        style: 'percent',
        maximumFractionDigits: 1,
    });
    return (
        <div {...props} className={styles.base({ class: className })}>
            {showTitle && (
                <p className={styles.title()} aria-hidden="true">
                    {label}
                </p>
            )}
            <ul role="list" aria-label={label} className={styles.list()} style={{ height }}>
                {items.map((item, index) => {
                    const rect = rects[index]!;
                    const text = t.share(number.format(item.value), percent.format(total ? item.value / total : 0));
                    return (
                        <li
                            key={item.label}
                            className={treemap({ tone: item.tone ?? toneAt(index) }).tile()}
                            style={{
                                left: `${rect.x / ratio}%`,
                                top: `${rect.y}%`,
                                width: `${rect.width / ratio}%`,
                                height: `${rect.height}%`,
                            }}
                            title={`${item.label}: ${text}`}
                        >
                            <span className={styles.tileLabel()}>{item.label}</span>
                            <span className={styles.tileValue()}>{text}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
