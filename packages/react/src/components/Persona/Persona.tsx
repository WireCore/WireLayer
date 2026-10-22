import {
    persona as personaRecipe,
    type AvatarColor,
    type RecipeClasses,
    type StatusDotStatus,
} from '@wirecore/wirelayer-recipes';
import type { HTMLAttributes, MouseEventHandler } from 'react';
import { Avatar } from '../Avatar/Avatar.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { StatusDot } from '../StatusDot/StatusDot.js';

export type PersonaPresence = 'online' | 'away' | 'busy' | 'offline';

export interface PersonaProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
    /** Name of the person – also the source of the initials */
    name: string;
    /** Role or description below the name, e.g. "Project lead" */
    description?: string;
    /** Image URL of the avatar */
    src?: string;
    /** Presence as a dot with text (never colour alone) */
    presence?: PersonaPresence;
    /** Own text for the presence (default "Online", "Away" …) */
    presenceLabel?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Tinted avatar; `auto` picks a colour from the name */
    avatarColor?: AvatarColor | 'auto';
    /** The whole persona is a link */
    href?: string;
    /** `button`: the whole persona is a button (use onClick) */
    as?: 'div' | 'button';
    onClick?: MouseEventHandler<HTMLElement>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof personaRecipe>;
}

const presenceStatus: Record<PersonaPresence, StatusDotStatus> = {
    online: 'success',
    away: 'warn',
    busy: 'danger',
    offline: 'neutral',
};

/** Avatar (decorative here – the name follows as text), name, description and presence; optionally a link/button */
export function Persona({
    classes,
    name,
    description,
    src,
    presence,
    presenceLabel,
    size = 'md',
    avatarColor = 'auto',
    href,
    as = 'div',
    className,
    ...props
}: PersonaProps) {
    const persona = useRecipe('persona', personaRecipe, classes);
    const translations = useTranslations();
    const Tag = href ? 'a' : as;
    const styles = persona({ size, interactive: Tag !== 'div' });
    return (
        <Tag
            {...props}
            className={styles.base({ class: className })}
            href={href}
            type={Tag === 'button' ? 'button' : undefined}
        >
            <span className={styles.avatar()} aria-hidden="true">
                <Avatar name={name} src={src} size={size} color={avatarColor} />
            </span>
            <span className={styles.body()}>
                <span className={styles.name()}>{name}</span>
                {description && <span className={styles.description()}>{description}</span>}
                {presence && (
                    <StatusDot status={presenceStatus[presence]} className={styles.presence()}>
                        {presenceLabel ?? translations.persona.presence[presence]}
                    </StatusDot>
                )}
            </span>
        </Tag>
    );
}
