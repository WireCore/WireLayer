import { heatLevel, heatmap as heatmapRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface HeatmapProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** Title of the table (caption) */
    caption: string;
    /** Row names */
    rows: string[];
    /** Column names */
    columns: readonly string[];
    /** Values per row and column; null for no value */
    values: (number | null)[][];
    /** Range of the colours (default: smallest and largest value) */
    min?: number;
    max?: number;
    /** The values as text in the cells – without, they stay readable for screen readers and as tooltip */
    showValues?: boolean;
    /** Colour scale below the table */
    legend?: boolean;
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof heatmapRecipe>;
}

/** A real table: row and column headers name every value; the colour only adds to the number */
export function Heatmap({
    caption,
    rows,
    columns,
    values,
    min,
    max,
    showValues = true,
    legend = true,
    formatOptions,
    locale,
    classes,
    className,
    ...props
}: HeatmapProps) {
    const styles = useRecipe('heatmap', heatmapRecipe, classes)();
    const localeContext = useLocale();
    const t = useTranslations().heatmap;
    const numbers = values.flat().filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));
    const low = min ?? Math.min(...numbers, 0);
    const high = max ?? Math.max(...numbers, 0);
    const number = new Intl.NumberFormat(locale ?? localeContext.locale, formatOptions);
    return (
        <div {...props} className={styles.base({ class: className })}>
            <div className={styles.scroll()}>
                <table className={styles.table()}>
                    <caption className={styles.caption()}>{caption}</caption>
                    <thead>
                        <tr>
                            <td />
                            {columns.map((column) => (
                                <th key={column} scope="col" className={styles.columnHeader()}>
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={row}>
                                <th scope="row" className={styles.rowHeader()}>
                                    {row}
                                </th>
                                {columns.map((column, columnIndex) => {
                                    const value = values[rowIndex]?.[columnIndex] ?? null;
                                    const text = value === null ? null : number.format(value);
                                    const level = heatLevel(value, low, high);
                                    return (
                                        <td
                                            key={column}
                                            className={styles.cell()}
                                            data-level={level ?? undefined}
                                            title={showValues ? undefined : (text ?? undefined)}
                                        >
                                            {text === null ? (
                                                <>
                                                    <span className={styles.empty()} aria-hidden="true">
                                                        –
                                                    </span>
                                                    <span className={styles.srOnly()}>{t.empty}</span>
                                                </>
                                            ) : showValues ? (
                                                text
                                            ) : (
                                                <span className={styles.srOnly()}>{text}</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {legend && (
                <div className={styles.legend()} aria-hidden="true">
                    <span>{t.less}</span>
                    {[0, 1, 2, 3, 4].map((level) => (
                        <span key={level} className={styles.legendCell()} data-level={level} />
                    ))}
                    <span>{t.more}</span>
                </div>
            )}
        </div>
    );
}
