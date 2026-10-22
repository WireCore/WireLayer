import { spinner as spinnerRecipe, type Size, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SpinnerProps extends Omit<ComponentProps<'span'>, 'children'> {
    size?: Size;
    /** Text announced to screen readers (live region) */
    label?: string;
    /** Fixed progress 0–100: a ring that fills up instead of turning (a progress bar) */
    value?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof spinnerRecipe>;
}

const circumference = 2 * Math.PI * 9;

/** Loading indicator with a label for screen readers (role="status"); with `value` a ring as progress bar */
export function Spinner({ classes, size, label, value, className, ...props }: SpinnerProps) {
    const spinner = useRecipe('spinner', spinnerRecipe, classes);
    const translations = useTranslations();
    const styles = spinner({ size });
    if (value !== undefined) {
        const share = Math.min(100, Math.max(0, value));
        return (
            <span
                {...props}
                className={styles.base({ class: className })}
                role="progressbar"
                aria-label={label ?? translations.common.loading}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
                aria-valuetext={`${Math.round(share)} %`}
            >
                <svg className={styles.ring()} viewBox="0 0 24 24" aria-hidden="true">
                    <circle className={styles.ringTrack()} cx="12" cy="12" r="9" strokeWidth="3" />
                    <circle
                        className={styles.ringRange()}
                        cx="12"
                        cy="12"
                        r="9"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(share / 100) * circumference} ${circumference}`}
                    />
                </svg>
            </span>
        );
    }

    return (
        <span {...props} className={styles.base({ class: className })} role="status">
            <LoaderCircle className={styles.icon()} aria-hidden="true" />
            <span className={styles.label()}>{label ?? translations.common.loading}</span>
        </span>
    );
}
