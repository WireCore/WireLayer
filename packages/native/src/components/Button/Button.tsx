import {
    button,
    buttonColorKey,
    visuallyHidden,
    formatCount,
    type ButtonColor,
    type ButtonShape,
    type ButtonVariant,
    type Size,
} from '@wirecore/wirelayer-recipes/native';
import type { ComponentRef, ReactNode, Ref } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View, type PressableProps } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { Icon, type IconComponent } from '../../utils/Icon.js';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
    variant?: ButtonVariant;
    /** Colour combined with the variant: with `outline`, `text`, `soft` and `link` it colours that style (e.g. a danger text button), with a filled variant it replaces the fill */
    color?: ButtonColor;
    size?: Size;
    /** Corner shape: `pill` (default), `rounded` or `square` */
    shape?: ButtonShape;
    /** Full width of the container */
    block?: boolean;
    /** Icon component rendered before the label */
    leadingIcon?: IconComponent;
    /** Icon component rendered after the label */
    trailingIcon?: IconComponent;
    /** Shows a spinner and ignores presses; stays focusable (busy, not disabled) */
    loading?: boolean;
    /** Counter (number > 0) or dot (true) after the label */
    badge?: number | boolean;
    /** Added to the accessible name while a badge is shown, e.g. "Notifications 4 new" (the visible counter stays part of it) */
    badgeLabel?: (count: string | null) => string;
    className?: string;
    children?: ReactNode;
    ref?: Ref<ComponentRef<typeof Pressable>>;
}

/** Button with variants and colours, sizes, icons, loading state (busy, still focusable) and an optional counter */
export function Button({
    variant,
    color,
    size,
    shape,
    block,
    leadingIcon,
    trailingIcon,
    loading = false,
    badge = false,
    badgeLabel = (value) => (value === null ? 'new' : `${value} new`),
    disabled = false,
    className,
    children,
    onPress,
    ...props
}: ButtonProps) {
    const styles = button({ variant, color: buttonColorKey(color), size, shape, block });
    const loader = useResolveClassNames(styles.icon());
    const count = typeof badge === 'number' && badge > 0 ? badge : 0;
    // The visible counter is part of the name (WCAG 2.5.3); the label text comes from the children
    const badgeName = count ? badgeLabel(formatCount(count)) : badge === true ? badgeLabel(null) : undefined;
    // iOS/Android: the name with the badge; web: the name comes from the content (label and a hidden badge text), so
    // the visible counter is part of it (WCAG 2.5.3)
    const web = Platform.OS === 'web';
    const name =
        badgeName && !web && typeof children === 'string' && !props['aria-label']
            ? `${children} ${badgeName}`
            : props['aria-label'];

    return (
        <Pressable
            role="button"
            {...props}
            aria-label={name}
            className={styles.base({ class: className })}
            disabled={disabled}
            aria-disabled={disabled || loading || undefined}
            aria-busy={loading || undefined}
            onPress={loading ? undefined : onPress}
        >
            {loading ? (
                <ActivityIndicator
                    color={typeof loader.color === 'string' ? loader.color : undefined}
                    size={typeof loader.width === 'number' ? loader.width : 'small'}
                    aria-hidden
                />
            ) : (
                leadingIcon && <Icon icon={leadingIcon} className={styles.icon()} />
            )}
            {typeof children === 'string' ? <Text className={styles.label()}>{children}</Text> : children}
            {trailingIcon && <Icon icon={trailingIcon} className={styles.icon()} />}
            {count ? (
                <View className={styles.badge()} aria-hidden>
                    <Text className={styles.badgeLabel()}>{formatCount(count)}</Text>
                </View>
            ) : (
                badge === true && <View className={styles.dot()} aria-hidden />
            )}
            {web && badgeName && <Text className={visuallyHidden()}>{` ${badgeName}`}</Text>}
        </Pressable>
    );
}
