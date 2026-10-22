import { aiLabel as aiLabelRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Sparkles } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { Toggletip } from '../Toggletip/Toggletip.js';

export interface AiLabelProps extends ComponentProps<'span'> {
    /** Text of the label (default "AI-generated") */
    label?: string;
    /** Explanation behind the (i) button (default: a short note on AI content); `false` hides the button */
    explanation?: ReactNode | false;
    size?: 'sm' | 'md';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof aiLabelRecipe>;
}

/** "AI-generated" (text, not only an icon) with the explanation in a toggletip */
export function AiLabel({ classes, label, explanation, size = 'md', className, children, ...props }: AiLabelProps) {
    const aiLabel = useRecipe('aiLabel', aiLabelRecipe, classes);
    const translations = useTranslations();
    const styles = aiLabel({ size });
    return (
        <span {...props} className={styles.base({ class: className })}>
            <span className={styles.badge()}>
                <Sparkles className={styles.icon()} aria-hidden="true" />
                {label ?? translations.aiLabel.label}
            </span>
            {explanation !== false && (
                <Toggletip triggerLabel={translations.aiLabel.help}>
                    {children ?? explanation ?? translations.aiLabel.explanation}
                </Toggletip>
            )}
        </span>
    );
}
