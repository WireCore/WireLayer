import { navigationProgress as navigationProgressRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useSyncExternalStore } from 'react';
import { navigationProgressStore } from './progress.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface NavigationProgressProps {
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof navigationProgressRecipe>;
}

/** Place once in the app; drive it with navigationProgress.start() / done() */
export function NavigationProgress({ label: labelProp, classes }: NavigationProgressProps) {
    const styles = useRecipe('navigationProgress', navigationProgressRecipe, classes)();
    const translations = useTranslations();
    const label = labelProp ?? translations.navigationProgress.label;
    const value = useSyncExternalStore(navigationProgressStore.subscribe, navigationProgressStore.get, () => null);
    const loading = value !== null;
    return (
        <div
            className={styles.base()}
            data-state={loading ? 'loading' : 'idle'}
            role={loading ? 'progressbar' : undefined}
            aria-label={loading ? label : undefined}
            aria-valuenow={loading ? Math.round(value) : undefined}
            aria-valuemin={loading ? 0 : undefined}
            aria-valuemax={loading ? 100 : undefined}
        >
            <div className={styles.bar()} style={{ width: `${value ?? 0}%` }} />
        </div>
    );
}
