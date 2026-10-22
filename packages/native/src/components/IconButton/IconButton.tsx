import {
    buttonColorKey,
    formatCount,
    iconButton,
    type ButtonColor,
    type ButtonShape,
    type IconButtonVariant,
    type Size,
} from '@wirecore/wirelayer-recipes/native';
import { Pressable, Text, View, type PressableProps } from 'react-native';
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
    badge = false,
    badgeLabel = (value) => (value === null ? 'new' : `${value} new`),
    className,
    ...props
}: IconButtonProps) {
    const styles = iconButton({ variant, color: buttonColorKey(color), size, shape });
    const count = typeof badge === 'number' && badge > 0 ? badge : 0;
    const accessibleName = count
        ? `${label}, ${badgeLabel(formatCount(count))}`
        : badge === true
          ? `${label}, ${badgeLabel(null)}`
          : label;

    return (
        <Pressable role="button" {...props} className={styles.base({ class: className })} aria-label={accessibleName}>
            <Icon icon={icon} className={styles.icon()} />
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
