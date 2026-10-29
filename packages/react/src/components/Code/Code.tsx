import { inlineCode as inlineCodeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CodeProps extends ComponentProps<'code'> {
    /** The code (one line) – or pass it as the content */
    code?: string;
    /** Extra classes of the recipe (see the recipe inlineCode) */
    classes?: RecipeClasses<typeof inlineCodeRecipe>;
}

/** Code inside a sentence, without syntax colours: the look of InlineCode (/code) without shiki */
export function Code({ code, classes, className, children, ...props }: CodeProps) {
    const inlineCode = useRecipe('inlineCode', inlineCodeRecipe, classes);
    return (
        <code {...props} className={inlineCode({ class: className })}>
            {children ?? code}
        </code>
    );
}
