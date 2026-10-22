import { saveStatus as saveStatusRecipe, type RecipeClasses, type SaveStatusState } from '@wirecore/wirelayer-recipes';
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export type SaveStatusTranslations = Record<SaveStatusState, string>;

export interface SaveStatusProps extends ComponentProps<'span'> {
    /** idle (nothing to report), saving, saved or error */
    status?: SaveStatusState;
    /** Own texts per state, e.g. { saved: 'Draft saved' } */
    translations?: Partial<SaveStatusTranslations>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof saveStatusRecipe>;
}

/** Save state with icon and text; a live region (role="status"), so changes are announced */
export function SaveStatus({ classes, status = 'idle', translations, className, ...props }: SaveStatusProps) {
    const saveStatus = useRecipe('saveStatus', saveStatusRecipe, classes);
    const styles = saveStatus({ status });
    const texts = useTranslations();
    const text = { ...texts.saveStatus, ...translations }[status];
    return (
        <span {...props} className={styles.base({ class: className })} role="status">
            {status === 'saving' && <LoaderCircle className={styles.spinner()} aria-hidden="true" />}
            {status === 'saved' && <CircleCheck className={styles.icon()} aria-hidden="true" />}
            {status === 'error' && <CircleAlert className={styles.icon()} aria-hidden="true" />}
            {text}
        </span>
    );
}
