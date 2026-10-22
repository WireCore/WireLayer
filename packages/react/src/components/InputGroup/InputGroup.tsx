import { inputGroup as inputGroupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface InputGroupProps {
    children?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof inputGroupRecipe>;
}

/** Input with buttons or text (InputGroupAddon) attached; only the outer corners stay round */
export function InputGroup({ children, classes }: InputGroupProps) {
    const inputGroup = useRecipe('inputGroup', inputGroupRecipe, classes);
    const styles = inputGroup();
    return <div className={styles.base()}>{children}</div>;
}

/** Static text or icon next to the input, e.g. "€" or "https://" */
export function InputGroupAddon({ children }: { children: ReactNode }) {
    const inputGroup = useRecipe('inputGroup', inputGroupRecipe);
    const styles = inputGroup();
    return <span className={styles.addon()}>{children}</span>;
}
