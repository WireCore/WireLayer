import {
    columnVariables,
    descriptions as descriptionsRecipe,
    type RecipeClasses,
    type ResponsiveColumns,
} from '@wirecore/wirelayer-recipes';
import { useId, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface DescriptionsItem {
    /** Key of the item (default: the position) */
    id?: string;
    label: string;
    value?: string | number;
    /** Columns the item spans (never more than there are), or `full` for the whole row */
    span?: number | 'full';
}

export interface DescriptionsProps extends Omit<ComponentProps<'div'>, 'title'> {
    items: DescriptionsItem[];
    /** Heading above the list */
    title?: string;
    /** Level of the title (default 3) */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Buttons next to the title, e.g. "Edit" */
    actions?: ReactNode;
    /** Columns: a number or per breakpoint (default { base: 1, sm: 2, lg: 3 }) */
    columns?: ResponsiveColumns;
    /** Label above its value (vertical, default) or beside it */
    orientation?: 'vertical' | 'horizontal';
    /** Table look with lines between the cells */
    bordered?: boolean;
    /** Edit mode: the values give way to `renderEdit` (inputs labelled by the term via `labelId`) */
    editing?: boolean;
    /** Own content of a value (undefined: the value as text) */
    renderValue?: (item: DescriptionsItem) => ReactNode;
    /** Input of an item in edit mode (undefined: the value stays) */
    renderEdit?: (item: DescriptionsItem, state: { labelId: string }) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof descriptionsRecipe>;
}

/** Terms and values (<dl>) in columns, with an optional title and actions; values can turn into inputs */
export function Descriptions({
    classes,
    items,
    title,
    headingLevel = 3,
    actions,
    columns = { base: 1, sm: 2, lg: 3 },
    orientation,
    bordered,
    editing,
    renderValue,
    renderEdit,
    className,
    ...props
}: DescriptionsProps) {
    const descriptions = useRecipe('descriptions', descriptionsRecipe, classes);
    const styles = descriptions({ orientation, bordered });
    const id = useId();
    const Heading = `h${headingLevel}` as const;
    return (
        <div {...props} className={styles.base({ class: className })}>
            {(title || actions) && (
                <div className={styles.header()}>
                    {title && <Heading className={styles.title()}>{title}</Heading>}
                    {actions && <div className={styles.actions()}>{actions}</div>}
                </div>
            )}
            <dl className={styles.list()} style={columnVariables(columns) as CSSProperties}>
                {items.map((item, index) => {
                    const labelId = `${id}-${index}`;
                    const edit = editing ? renderEdit?.(item, { labelId }) : undefined;
                    const value = renderValue?.(item);
                    return (
                        <div
                            key={item.id ?? index}
                            className={styles.item()}
                            data-span={item.span}
                            style={
                                item.span === undefined
                                    ? undefined
                                    : ({
                                          '--wc-span': item.span === 'full' ? '999' : String(item.span),
                                      } as CSSProperties)
                            }
                        >
                            <dt id={labelId} className={styles.term()}>
                                {item.label}
                            </dt>
                            <dd className={styles.details()}>{edit ?? value ?? item.value}</dd>
                        </div>
                    );
                })}
            </dl>
        </div>
    );
}
