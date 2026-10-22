import { dataList as dataListRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

const DataListContext = createContext<ReturnType<typeof dataListRecipe> | null>(null);

export interface DataListProps extends ComponentProps<'dl'> {
    /** Label above its value, or next to it (labels line up in a column) */
    orientation?: 'vertical' | 'horizontal';
    /** Lines between the items */
    divided?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dataListRecipe>;
}

/** Terms and values as a description list (<dl>), e.g. the details of a record */
export function DataList({ classes, orientation, divided, className, ...props }: DataListProps) {
    const dataList = useRecipe('dataList', dataListRecipe, classes);
    const styles = dataList({ orientation, divided });
    return (
        <DataListContext value={styles}>
            <dl {...props} className={styles.base({ class: className })} />
        </DataListContext>
    );
}

export interface DataListItemProps extends ComponentProps<'div'> {
    /** The term (<dt>); the children are its value (<dd>) */
    label: string;
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dataListRecipe>;
}

/** One term and its value in a DataList */
export function DataListItem({ classes, label, className, children, ...props }: DataListItemProps) {
    const dataList = useRecipe('dataList', dataListRecipe, classes);
    const styles = useContext(DataListContext) ?? dataList();
    return (
        <div {...props} className={styles.item({ class: className })}>
            <dt className={styles.term()}>{label}</dt>
            <dd className={styles.details()}>{children}</dd>
        </div>
    );
}
