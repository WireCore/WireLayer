import { breadcrumb, visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { ChevronRight, Ellipsis } from 'lucide-react-native';
import { useRef, type ComponentRef } from 'react';
import { Platform, Pressable, ScrollView, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { Menu } from '../Menu/Menu.js';

export interface BreadcrumbEntry {
    label: string;
    /** Destination, handed to `onNavigate` */
    href?: string;
    icon?: IconComponent;
    /** Only the icon is visible, the label stays the accessible name */
    iconOnly?: boolean;
    /** The current page – plain text, marked as current */
    current?: boolean;
}

export interface BreadcrumbProps extends ViewProps {
    items: BreadcrumbEntry[];
    /** Accessible name (default "Breadcrumb") */
    label?: string;
    /** A tap on an entry with href (also the hidden ones in the "…" menu) */
    onNavigate?: (item: BreadcrumbEntry) => void;
    /** At most this many entries – the middle ones go into a "…" menu */
    maxItems?: number;
    /** Entries before the "…" (default 1) */
    itemsBeforeCollapse?: number;
    /** Entries after the "…" (default 1) */
    itemsAfterCollapse?: number;
    /** Accessible name of the "…" button (default "Ausgeblendete Ebenen") */
    moreLabel?: string;
    className?: string;
}

/** Path to the current screen: scrolls sideways (to its end) when it is too long, the middle can collapse into a menu */
export function Breadcrumb({
    items,
    label,
    onNavigate,
    maxItems,
    itemsBeforeCollapse = 1,
    itemsAfterCollapse = 1,
    moreLabel,
    className,
    ...props
}: BreadcrumbProps) {
    const translations = useTranslations();
    const styles = breadcrumb();
    const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
    const before = Math.max(1, itemsBeforeCollapse);
    const after = Math.max(1, itemsAfterCollapse);
    const collapsed = !!maxItems && items.length > maxItems && before + after < items.length;
    const hidden = collapsed ? items.slice(before, items.length - after) : [];
    const shown: (BreadcrumbEntry | 'more')[] = collapsed
        ? [...items.slice(0, before), 'more', ...items.slice(items.length - after)]
        : items;

    return (
        <View role="navigation" aria-label={label ?? translations.breadcrumb.label} {...props}>
            <ScrollView
                ref={scroller}
                horizontal
                showsHorizontalScrollIndicator={false}
                className={styles.base({ class: className })}
                onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
            >
                <View role="list" className={styles.list()}>
                    {shown.map((entry, index) => (
                        <View
                            key={entry === 'more' ? 'more' : `${index}${entry.label}`}
                            role="listitem"
                            className={styles.item()}
                        >
                            {index > 0 && <Icon icon={ChevronRight} className={styles.separator()} />}
                            {entry === 'more' ? (
                                <Menu
                                    items={hidden.map((item, position) => ({
                                        value: String(position),
                                        label: item.label,
                                        icon: item.icon,
                                    }))}
                                    title={moreLabel ?? translations.breadcrumb.more}
                                    onSelect={(value) => {
                                        const item = hidden[Number(value)];
                                        if (item) onNavigate?.(item);
                                    }}
                                >
                                    <Pressable
                                        role="button"
                                        aria-label={moreLabel ?? translations.breadcrumb.more}
                                        className={styles.more()}
                                    >
                                        <Icon icon={Ellipsis} className={styles.moreIcon()} />
                                    </Pressable>
                                </Menu>
                            ) : (
                                <Entry item={entry} last={index === shown.length - 1} onNavigate={onNavigate} />
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

function Entry({
    item,
    last,
    onNavigate,
}: {
    item: BreadcrumbEntry;
    last: boolean;
    onNavigate?: (item: BreadcrumbEntry) => void;
}) {
    const styles = breadcrumb();
    const current = item.current ?? (last && !item.href);
    const content = (labelClass: string) => (
        <>
            {item.icon && <Icon icon={item.icon} className={styles.icon()} />}
            <Text className={item.iconOnly ? visuallyHidden() : labelClass}>{item.label}</Text>
        </>
    );
    if (current || !item.href)
        return (
            <View
                className={styles.current()}
                {...(current && Platform.OS === 'web' ? { 'aria-current': 'page' } : {})}
            >
                {content(styles.currentLabel())}
            </View>
        );
    return (
        <Pressable role="link" className={styles.link()} onPress={() => onNavigate?.(item)}>
            {content(styles.linkLabel())}
        </Pressable>
    );
}
