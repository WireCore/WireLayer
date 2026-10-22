import { persona, type AvatarColor } from '@wirecore/wirelayer-recipes/native';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Avatar } from '../Avatar/Avatar.js';

export type PersonaPresence = 'online' | 'away' | 'busy' | 'offline';

export interface PersonaProps extends ViewProps {
    /** Name – also the source of the initials */
    name: string;
    /** Role or e-mail below the name */
    description?: string;
    /** Image of the avatar */
    src?: string;
    /** Dot on the avatar and the text below the name – never colour alone */
    presence?: PersonaPresence;
    /** Own presence text */
    presenceLabel?: string;
    size?: 'sm' | 'md' | 'lg';
    /** Colour of the initials; `auto` (default) picks one from the name */
    avatarColor?: AvatarColor | 'auto';
    /** Makes the whole persona a button, e.g. to open the profile */
    onPress?: () => void;
    className?: string;
}

const avatarSize = { sm: 'sm', md: 'md', lg: 'lg' } as const;

/** A person: avatar, name, role and presence */
export function Persona({
    name,
    description,
    src,
    presence,
    presenceLabel,
    size = 'md',
    avatarColor = 'auto',
    onPress,
    className,
    ...props
}: PersonaProps) {
    const translations = useTranslations();
    const styles = persona({ size, presence, interactive: !!onPress });
    const status = presence ? (presenceLabel ?? translations.persona.presence[presence]) : undefined;
    const content = (
        <>
            <View className={styles.avatar()} aria-hidden>
                <Avatar name={name} src={src} size={avatarSize[size]} color={avatarColor} />
                {presence && <View className={styles.presence()} />}
            </View>
            <View className={styles.text()}>
                <Text className={styles.name()} numberOfLines={1}>
                    {name}
                </Text>
                {!!description && (
                    <Text className={styles.description()} numberOfLines={1}>
                        {description}
                    </Text>
                )}
                {!!status && (
                    <View className={styles.status()}>
                        <View className={styles.dot()} aria-hidden />
                        <Text className={styles.statusLabel()}>{status}</Text>
                    </View>
                )}
            </View>
        </>
    );
    if (onPress)
        return (
            <Pressable role="button" {...props} className={styles.base({ class: className })} onPress={onPress}>
                {content}
            </Pressable>
        );
    return (
        <View {...props} className={styles.base({ class: className })}>
            {content}
        </View>
    );
}
