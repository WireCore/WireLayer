import {
    buttonColorKey,
    formatCount,
    iconButton,
    type ButtonColor,
    type ButtonShape,
    type IconButtonVariant,
    type Size,
} from '@wirecore/wirelayer-recipes/native';
import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { Icon, type IconComponent } from '../../utils/Icon.js';

export interface IconButtonProps extends Omit<PressableProps, 'children'> {
    /** Icon component */
    icon: IconComponent;
    /** Accessible name – icon buttons have no visible text */
    label: string;
    variant?: IconButtonVariant;
    /** Colour combined with the variant, like Button `color` (e.g. a danger text button) */
    color?: ButtonColor;
    size?: Size;
    /** Corner shape: `pill` (round, default), `rounded` or `square` */
    shape?: ButtonShape;
    /** Shows a spinner instead of the icon and ignores presses; stays focusable (aria-disabled + aria-busy) */
    loading?: boolean;
    /** Counter (number > 0) or dot (true) in the top-right corner */
    badge?: number | boolean;
    /** Appended to the accessible name while a badge is shown, e.g. "Notifications, 4 new" */
    badgeLabel?: (count: string | null) => string;
    className?: string;
}

/** Icon-only button with a required accessible name, colours and an optional counter or dot */
export function IconButton({
    icon,
    label,
    variant,
    color,
    size,
    shape,
    loading = false,
    badge = false,
    badgeLabel = (value) => (value === null ? 'new' : `${value} new`),
    className,
    onPress,
    ...props
}: IconButtonProps) {
    const styles = iconButton({ variant, color: buttonColorKey(color), size, shape });
    const loader = useResolveClassNames(styles.icon());
    const count = typeof badge === 'number' && badge > 0 ? badge : 0;
    const accessibleName = count
        ? `${label}, ${badgeLabel(formatCount(count))}`
        : badge === true
          ? `${label}, ${badgeLabel(null)}`
          : label;

    return (
        <Pressable
            role="button"
            {...props}
            className={styles.base({ class: className })}
            aria-label={accessibleName}
            // Only while loading – otherwise an aria-disabled passed in stays
            {...(loading ? { 'aria-disabled': true, 'aria-busy': true } : {})}
            onPress={loading ? undefined : onPress}
        >
            {loading ? (
                <ActivityIndicator
                    color={typeof loader.color === 'string' ? loader.color : undefined}
                    size={typeof loader.width === 'number' ? loader.width : 'small'}
                    aria-hidden
                />
            ) : (
                <Icon icon={icon} className={styles.icon()} />
            )}
            {count ? (
                <View className={styles.badge()} aria-hidden>
                    <Text className={styles.badgeLabel()}>{formatCount(count)}</Text>
                </View>
            ) : (
                badge === true && <View className={styles.dot()} aria-hidden />
            )}
        </Pressable>
    );
}
