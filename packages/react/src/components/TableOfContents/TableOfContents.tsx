import { Toc } from '@ark-ui/react/toc';
import { tableOfContents as tableOfContentsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { CSSProperties } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface TocEntry {
    /** id of the heading on the page */
    id: string;
    label: string;
    /** 1 for the top level, 2 below it … */
    depth?: number;
}

export interface TableOfContentsProps {
    items: TocEntry[];
    title?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tableOfContentsRecipe>;
}

/** Navigation to the headings of the page; the section in view is marked (aria-current="location") */
export function TableOfContents({ classes, items, title: titleProp, className, style }: TableOfContentsProps) {
    const tableOfContents = useRecipe('tableOfContents', tableOfContentsRecipe, classes);
    const styles = tableOfContents();
    const translations = useTranslations();
    const title = titleProp ?? translations.tableOfContents.title;
    const tocItems = items.map((item) => ({ value: item.id, depth: item.depth ?? 1 }));
    return (
        <Toc.Root items={tocItems} className={styles.base({ class: className })} style={style}>
            <Toc.Nav aria-label={title}>
                <Toc.Title className={styles.title()}>{title}</Toc.Title>
                <Toc.List className={styles.list()}>
                    {tocItems.map((item, index) => (
                        <Toc.Item key={item.value} item={item}>
                            <Toc.Link href={`#${item.value}`} className={styles.link()}>
                                {items[index]!.label}
                            </Toc.Link>
                        </Toc.Item>
                    ))}
                </Toc.List>
            </Toc.Nav>
        </Toc.Root>
    );
}
