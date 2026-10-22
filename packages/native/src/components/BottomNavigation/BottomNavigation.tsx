import { bottomNavigation, formatCount, isCurrentLink, visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { Platform, Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';

export interface BottomNavigationItem {
    label: string;
    /** Destination – a route name or path, compared with `currentHref` */
    href: string;
    icon: IconComponent;
    /** Number (99+) or short text; 0 or nothing hides it – part of the accessible name */
    badge?: number | string;
    /** Marks the current destination (instead of `currentHref`) */
    current?: boolean;
}

export interface BottomNavigationProps extends ViewProps {
    /** 3–5 destinations */
    items: BottomNavigationItem[];
    /** Accessible name of the tab bar (default "Navigation") */
    label?: string;
    /** href of the current screen */
    currentHref?: string;
    /** Own check for the current item, e.g. with the router's state */
    isCurrent?: (item: BottomNavigationItem) => boolean;
    /** A tap on a destination – navigate with the app's router */
    onNavigate?: (item: BottomNavigationItem) => void;
    /** In the layout instead of docked to the bottom of the screen */
    inline?: boolean;
    /** Space below the items for the home indicator, e.g. `useSafeAreaInsets().bottom` */
    bottomInset?: number;
    className?: string;
}

/**
 * Tab bar at the bottom of the screen for the main destinations of an app: screen readers hear tabs with the
 * selected one ("Tab, 2 of 4"), badges are part of the name. No router dependency – `onNavigate` navigates.
 */
export function BottomNavigation({
    items,
    label,
    currentHref,
    isCurrent,
    onNavigate,
    inline = false,
    bottomInset = 0,
    className,
    style,
    ...props
}: BottomNavigationProps) {
    const translations = useTranslations();
    const base = bottomNavigation({ inline });
    return (
        <View
            role="tablist"
            aria-label={label ?? translations.bottomNavigation.label}
            {...props}
            className={base.base({ class: className })}
            style={[{ paddingBottom: bottomInset }, style]}
        >
            {items.map((item) => {
                const current = isCurrentLink(item, currentHref, isCurrent);
                const styles = bottomNavigation({ current, inline });
                const badge =
                    typeof item.badge === 'number'
                        ? item.badge > 0
                            ? formatCount(item.badge)
                            : ''
                        : (item.badge ?? '');
                return (
                    <Pressable
                        key={item.href}
                        role="tab"
                        aria-selected={current}
                        // iOS/Android: the name with the badge; web: from the content (label and a hidden badge text)
                        {...(Platform.OS !== 'web' && badge ? { 'aria-label': `${item.label} ${badge}` } : {})}
                        {...(Platform.OS === 'web' && current ? { 'aria-current': 'page' } : {})}
                        className={styles.item()}
                        onPress={() => onNavigate?.(item)}
                    >
                        {current && <View className={styles.indicator()} aria-hidden />}
                        <Icon icon={item.icon} className={styles.icon()} />
                        <Text className={styles.label()} numberOfLines={1}>
                            {item.label}
                        </Text>
                        {Platform.OS === 'web' && !!badge && <Text className={visuallyHidden()}>{` ${badge}`}</Text>}
                        {!!badge && (
                            <View className={styles.badge()} aria-hidden>
                                <Text className={styles.badgeLabel()}>{badge}</Text>
                            </View>
                        )}
                    </Pressable>
                );
            })}
        </View>
    );
}
