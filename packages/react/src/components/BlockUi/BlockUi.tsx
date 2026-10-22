import { blockUi as blockUiRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { CSSProperties, ReactNode } from 'react';
import { Spinner } from '../Spinner/Spinner.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface BlockUiProps {
    /** Covers the content and makes it inert */
    blocked?: boolean;
    label?: string;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof blockUiRecipe>;
}

/** While blocked: the content is inert (no focus, no clicks) and busy; the overlay says why */
export function BlockUi({ classes, blocked = false, label: labelProp, children, className, style }: BlockUiProps) {
    const blockUi = useRecipe('blockUi', blockUiRecipe, classes);
    const styles = blockUi();
    const translations = useTranslations();
    const label = labelProp ?? translations.blockUi.label;
    return (
        <div className={styles.base({ class: className })} style={style} aria-busy={blocked || undefined}>
            <div inert={blocked || undefined}>{children}</div>
            {blocked && (
                <div className={styles.overlay()} role="status">
                    <Spinner label={label} />
                    {label}
                </div>
            )}
        </div>
    );
}
