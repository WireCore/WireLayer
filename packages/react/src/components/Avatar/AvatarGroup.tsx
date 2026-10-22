import {
    avatarGroup as avatarGroupRecipe,
    formatCount,
    type AvatarSize,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { AvatarGroupContext } from './context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';

export interface AvatarGroupProps extends ComponentProps<'div'> {
    /** Size of all avatars in the group */
    size?: AvatarSize;
    /** Number of further people, shown as "+N" */
    more?: number;
    /** Accessible name of the "+N" bubble */
    moreLabel?: (count: number) => string;
    /** Accessible name of the group, e.g. "Project team" */
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof avatarGroupRecipe>;
}

/** Overlapping avatars, with "+n" for the ones not shown */
export function AvatarGroup({
    classes,
    size = 'sm',
    more,
    moreLabel,
    label,
    className,
    children,
    ...props
}: AvatarGroupProps) {
    const avatarGroup = useRecipe('avatarGroup', avatarGroupRecipe, classes);
    const styles = avatarGroup({ size });
    const translations = useTranslations();
    const labelOf = moreLabel ?? ((count: number) => `${count} ${translations.overflowList.more}`);

    return (
        <AvatarGroupContext value={size}>
            <div {...props} className={styles.base({ class: className })} role="group" aria-label={label}>
                {children}
                {!!more && (
                    <span className={styles.more()} role="img" aria-label={labelOf(more)}>
                        {`+${formatCount(more)}`}
                    </span>
                )}
            </div>
        </AvatarGroupContext>
    );
}
