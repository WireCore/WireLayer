import { Avatar as ArkAvatar } from '@ark-ui/react/avatar';
import {
    avatar as avatarRecipe,
    avatarColor,
    getInitials,
    type AvatarColor,
    type AvatarShape,
    type AvatarSize,
    type AvatarVariant,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { User } from 'lucide-react';
import { useContext, type ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { AvatarGroupContext } from './context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface AvatarProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** Person or organisation – accessible name of the avatar and source of the initials */
    name?: string;
    /** Image URL; initials (or the icon) are shown while it loads or if it fails */
    src?: string;
    /** Icon shown when there is neither an image nor a name (default: user icon) */
    icon?: IconComponent;
    variant?: AvatarVariant;
    /** Inherited from a surrounding AvatarGroup if not set */
    size?: AvatarSize;
    shape?: AvatarShape;
    /**
     * Tinted background in a token colour; `auto` picks one from the name, so the same person always gets the same
     * colour (all pairs meet 4.5:1)
     */
    color?: AvatarColor | 'auto';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof avatarRecipe>;
}

export function Avatar({
    classes,
    name,
    src,
    icon: Icon = User,
    variant,
    size,
    shape,
    color,
    className,
    ...props
}: AvatarProps) {
    const avatar = useRecipe('avatar', avatarRecipe, classes);
    const groupSize = useContext(AvatarGroupContext);
    const styles = avatar({
        variant,
        size: size ?? groupSize ?? undefined,
        shape,
        color: color === 'auto' ? (name ? avatarColor(name) : undefined) : color,
        grouped: groupSize !== null,
    });
    const initials = name ? getInitials(name) : '';

    // With a name the avatar is one image for assistive tech; without it is decorative
    return (
        <ArkAvatar.Root
            {...props}
            className={styles.base({ class: className })}
            role={name ? 'img' : undefined}
            aria-label={name || undefined}
            aria-hidden={name ? undefined : true}
        >
            <ArkAvatar.Fallback className={styles.fallback()}>
                {initials || <Icon className={styles.icon()} aria-hidden="true" />}
            </ArkAvatar.Fallback>
            {src && <ArkAvatar.Image src={src} alt="" className={styles.image()} />}
        </ArkAvatar.Root>
    );
}
