import { formatCount, isCurrentLink, navList, visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { ChevronDown } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';

export interface SidebarNavItem {
    label: string;
    /** Destination – a route name or path */
    href?: string;
    icon?: IconComponent;
    current?: boolean;
    /** Entries of a group that opens and closes (open at the start when it holds the current entry) */
    children?: SidebarNavItem[];
    /** Count (99+) or short text after the label – part of the accessible name */
    badge?: number | string;
}

export interface SidebarNavProps extends ViewProps {
    items: SidebarNavItem[];
    /** Accessible name of the navigation */
    label: string;
    /** A tap on an entry with href – navigate with the app's router (e.g. and close the drawer) */
    onNavigate?: (item: SidebarNavItem) => void;
    /** href of the current screen (instead of `current` on the items) */
    currentHref?: string;
    isCurrent?: (item: SidebarNavItem) => boolean;
    /** Content above the entries, e.g. the logo or the account */
    header?: ReactNode;
    /** Content below the entries */
    footer?: ReactNode;
    className?: string;
}

/** Navigation as a list of links and groups – on a phone inside a Drawer (placement left) or the AppShell navbar */
export function SidebarNav({
    items,
    label,
    onNavigate,
    currentHref,
    isCurrent,
    header,
    footer,
    className,
    ...props
}: SidebarNavProps) {
    const styles = navList();
    const check = (item: SidebarNavItem) => isCurrentLink(item, currentHref, isCurrent);
    return (
        <View role="navigation" aria-label={label} {...props} className={styles.base({ class: className })}>
            {!!header && <View className={styles.header()}>{header}</View>}
            {items.map((item, index) => (
                <Entry key={`${index}${item.label}`} item={item} check={check} onNavigate={onNavigate} />
            ))}
            {!!footer && <View className={styles.footer()}>{footer}</View>}
        </View>
    );
}

const holdsCurrent = (item: SidebarNavItem, check: (item: SidebarNavItem) => boolean): boolean =>
    check(item) || !!item.children?.some((child) => holdsCurrent(child, check));

function Entry({
    item,
    check,
    onNavigate,
}: {
    item: SidebarNavItem;
    check: (item: SidebarNavItem) => boolean;
    onNavigate?: (item: SidebarNavItem) => void;
}) {
    const [open, setOpen] = useState(() => holdsCurrent(item, check));
    const badge = typeof item.badge === 'number' ? (item.badge > 0 ? formatCount(item.badge) : '') : (item.badge ?? '');
    if (item.children?.length) {
        const styles = navList({ open });
        return (
            <View>
                <Pressable role="button" aria-expanded={open} className={styles.group()} onPress={() => setOpen(!open)}>
                    {item.icon && <Icon icon={item.icon} className={styles.icon()} />}
                    <Text className={styles.groupLabel()}>{item.label}</Text>
                    <Icon icon={ChevronDown} className={styles.chevron()} />
                </Pressable>
                {open && (
                    <View className={styles.children()}>
                        {item.children.map((child, index) => (
                            <Entry key={`${index}${child.label}`} item={child} check={check} onNavigate={onNavigate} />
                        ))}
                    </View>
                )}
            </View>
        );
    }
    const current = check(item);
    return <NavLink item={item} current={current} badge={badge} onPress={() => onNavigate?.(item)} />;
}

/** One link row of SidebarNav and NavigationMenu */
export function NavLink({
    item,
    current,
    badge = '',
    description,
    onPress,
}: {
    item: { label: string; icon?: IconComponent };
    current: boolean;
    badge?: string;
    description?: string;
    onPress: () => void;
}) {
    const styles = navList({ current });
    return (
        <Pressable
            role="link"
            // iOS/Android: the name with the badge; web: from the content (label and a hidden badge text)
            {...(Platform.OS !== 'web' && badge ? { 'aria-label': `${item.label} ${badge}` } : {})}
            {...(Platform.OS === 'web'
                ? { 'aria-current': current ? 'page' : undefined }
                : { accessibilityState: { selected: current } })}
            className={styles.link()}
            onPress={onPress}
        >
            {item.icon && <Icon icon={item.icon} className={styles.icon()} />}
            <View className={styles.text()}>
                <Text className={styles.label()}>
                    {item.label}
                    {Platform.OS === 'web' && !!badge && <Text className={visuallyHidden()}>{` ${badge}`}</Text>}
                </Text>
                {!!description && <Text className={styles.description()}>{description}</Text>}
            </View>
            {!!badge && (
                <View className={styles.badge()} aria-hidden>
                    <Text className={styles.badgeLabel()}>{badge}</Text>
                </View>
            )}
        </Pressable>
    );
}
