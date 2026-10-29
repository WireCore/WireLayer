import {
    avatar,
    avatarColor,
    getInitials,
    type AvatarColor,
    type AvatarShape,
    type AvatarSize,
    type AvatarVariant,
} from '@wirecore/wirelayer-recipes/native';
import { User } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';

export interface AvatarProps extends Omit<ViewProps, 'children'> {
    /** Person or organisation – accessible name of the avatar and source of the initials */
    name?: string;
    /** Own initials instead of the ones taken from `name`, e.g. "MS" for "my-server" */
    initials?: string;
    /** Image URL; initials (or the icon) are shown while it loads or if it fails */
    src?: string;
    /** Icon shown when there is neither an image nor a name (default: user icon) */
    icon?: IconComponent;
    variant?: AvatarVariant;
    size?: AvatarSize;
    shape?: AvatarShape;
    /** Tinted background in a token colour; `auto` picks one from the name, so the same person always gets the same colour */
    color?: AvatarColor | 'auto';
}

/** Image, initials (from the name) or an icon – one image named by `name` for screen readers */
export function Avatar({
    name,
    initials: ownInitials,
    src,
    icon = User,
    variant,
    size,
    shape,
    color,
    className,
    ...props
}: AvatarProps) {
    const tint = color === 'auto' ? (name ? avatarColor(name) : undefined) : color;
    const styles = avatar({ variant, size, shape, color: tint });
    const [loaded, setLoaded] = useState(false);
    // A failed image falls back to the initials (or the icon) – also when the source changes later
    const [failed, setFailed] = useState<string | undefined>(undefined);
    const initials = ownInitials ?? (name ? getInitials(name) : '');

    // With a name the avatar is one image for assistive tech; without it is decorative
    return (
        <View
            {...props}
            className={styles.base({ class: className })}
            role={name ? 'img' : undefined}
            aria-label={name || undefined}
            aria-hidden={name ? undefined : true}
        >
            {!loaded &&
                (initials ? (
                    <Text className={styles.label()} aria-hidden>
                        {initials}
                    </Text>
                ) : (
                    <Icon icon={icon} className={styles.icon()} />
                ))}
            {src && failed !== src && (
                <Image
                    source={{ uri: src }}
                    className={styles.image({ class: loaded ? undefined : 'absolute opacity-0' })}
                    onLoad={() => setLoaded(true)}
                    onError={() => {
                        setLoaded(false);
                        setFailed(src);
                    }}
                    alt=""
                    aria-hidden
                />
            )}
        </View>
    );
}
