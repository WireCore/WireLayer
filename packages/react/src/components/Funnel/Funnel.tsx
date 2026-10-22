import {
    chart as chartRecipe,
    funnel as funnelRecipe,
    funnelStages,
    type FunnelStage,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { Fragment, useId, type ComponentProps } from 'react';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface FunnelProps extends Omit<ComponentProps<'figure'>, 'children' | 'title'> {
    /** The stages, widest first */
    stages: FunnelStage[];
    /** Title, also the accessible name of the funnel */
    title: string;
    /** The title only for screen readers */
    hideTitle?: boolean;
    /** Colour of the bars (default primary) */
    tone?: VisualTone;
    /** Conversion from the previous stage between the bars (default true) */
    conversion?: boolean;
    /** The stages as a table below (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof funnelRecipe>;
}

/** Bars narrowing with the value (an image named by the title); the table is the text alternative */
export function Funnel({
    stages,
    title,
    hideTitle,
    tone = 'primary',
    conversion = true,
    table: withTable = true,
    formatValue,
    classes,
    className,
    ...props
}: FunnelProps) {
    const funnel = useRecipe('funnel', funnelRecipe, classes);
    const chart = useRecipe('chart', chartRecipe);
    const locale = useLocale();
    const t = locale.translations.chart;
    const id = useId();
    const styles = funnel({ tone });
    const table = chart();
    const format = formatValue ?? ((value: number) => value.toLocaleString(locale.locale));
    const percent = new Intl.NumberFormat(locale.locale, { style: 'percent', maximumFractionDigits: 1 });
    const rows = funnelStages(stages).map((stage) => ({
        ...stage,
        text: format(stage.value),
        conversionText: stage.fromPrevious === undefined ? undefined : percent.format(stage.fromPrevious),
    }));
    return (
        <figure {...props} className={styles.base({ class: className })}>
            <figcaption id={`${id}title`} className={hideTitle ? table.caption() : styles.title()}>
                {title}
            </figcaption>
            <div role="img" aria-labelledby={`${id}title`} className={styles.stages()}>
                {rows.map((row) => (
                    <Fragment key={row.label}>
                        {conversion && row.conversionText && (
                            <div className={styles.conversion()}>{t.fromPrevious(row.conversionText)}</div>
                        )}
                        <div className={styles.stage()}>
                            <span className={styles.label()}>{row.label}</span>
                            <div className={styles.track()}>
                                <div className={styles.bar()} style={{ width: `${row.width}%` }} />
                            </div>
                            <span className={styles.value()}>{row.text}</span>
                        </div>
                    </Fragment>
                ))}
            </div>
            {withTable && (
                <details className={table.details()}>
                    <summary className={table.summary()}>{t.showTable}</summary>
                    <div className={table.scroll()}>
                        <table className={table.table()}>
                            <caption className={table.caption()}>{title}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={table.th()}>
                                        {t.stage}
                                    </th>
                                    <th scope="col" className={table.th()}>
                                        {t.value}
                                    </th>
                                    <th scope="col" className={table.th()}>
                                        {t.conversion}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.label}>
                                        <th scope="row" className={table.rowHeader()}>
                                            {row.label}
                                        </th>
                                        <td className={table.td()}>{row.text}</td>
                                        <td className={table.td()}>{row.conversionText ?? '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            )}
        </figure>
    );
}
