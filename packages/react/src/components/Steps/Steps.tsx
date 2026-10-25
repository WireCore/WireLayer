import { steps as stepsRecipe, type StepStatus, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Check } from 'lucide-react';
import type { ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface StepItem {
    label: string;
    /** Icon component for the active/open state (default: the step number) */
    icon?: IconComponent;
}

export interface StepsProps extends ComponentProps<'ol'> {
    items: readonly StepItem[];
    /** Index of the current step; earlier steps are done */
    current: number;
    /** Accessible name of the list, e.g. "Project timeline" */
    label?: string;
    /** Status text read by screen readers after each step (default: from the locale) */
    statusLabels?: Record<StepStatus, string>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof stepsRecipe>;
}

/** Progress through steps (list with the current step marked) */
export function Steps({ classes, items, current, label, statusLabels, className, ...props }: StepsProps) {
    const steps = useRecipe('steps', stepsRecipe, classes);
    const translations = useTranslations();
    const labels = statusLabels ?? translations.stepper.status;
    const statusOf = (index: number): StepStatus => (index < current ? 'done' : index === current ? 'active' : 'todo');

    return (
        <ol {...props} className={steps().base({ class: className })} aria-label={label}>
            {items.map((item, index) => {
                const status = statusOf(index);
                const styles = steps({ status });
                return (
                    <li key={index} className={styles.item()} aria-current={status === 'active' ? 'step' : undefined}>
                        <span className={styles.indicator()} aria-hidden="true">
                            {status === 'done' ? (
                                <Check className={styles.icon()} />
                            ) : item.icon ? (
                                <item.icon className={styles.icon()} />
                            ) : (
                                <span className={styles.number()}>{index + 1}</span>
                            )}
                        </span>
                        <span className={styles.label()}>{item.label}</span>
                        <span className={styles.status()}>{`, ${labels[status]}`}</span>
                    </li>
                );
            })}
        </ol>
    );
}
