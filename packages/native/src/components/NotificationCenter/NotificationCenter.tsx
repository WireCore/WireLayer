import {
    createDataList,
    dayLabel,
    groupByDay,
    newestTime,
    newUnread,
    notificationCenter,
    notificationTime,
    toDate,
    visuallyHidden,
    type DataList,
    type DataListState,
    type DataSource,
} from '@wirecore/wirelayer-recipes/native';
import { Bell, Check } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocale } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { announce } from '../LiveAnnouncer/LiveAnnouncer.js';

export interface NotificationItem {
    id: string;
    title: string;
    description?: string;
    date: Date | string | number;
    read?: boolean;
    /** Destination, handed to onSelect */
    href?: string;
    icon?: IconComponent;
}

export interface NotificationCenterProps {
    /** The notifications – with `dataSource` the ones pushed in (e.g. live), shown before the loaded pages */
    items?: NotificationItem[];
    /** Loads the notifications page by page ("Load more") */
    dataSource?: DataSource<NotificationItem>;
    /** Notifications per page of the data source (default 20) */
    pageSize?: number;
    /** Count on the bell – default: the unread items */
    unreadCount?: number;
    /** More can be loaded ("Load more") – without dataSource */
    hasMore?: boolean;
    /** Older notifications are loading – without dataSource */
    loading?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Name of the bell and title of the sheet (default "Notifications") */
    label?: string;
    /** Reference time for "Today"/"Yesterday" (default now) */
    now?: Date | string;
    /** Text without notifications */
    emptyText?: string;
    onMarkRead?: (id: string) => void;
    onMarkAllRead?: () => void;
    /** "Load more" without dataSource */
    onLoadMore?: () => void;
    /** A tap on a notification */
    onSelect?: (item: NotificationItem) => void;
    /** Own buttons of a notification */
    renderActions?: (item: NotificationItem) => ReactNode;
}

const idle: DataListState<NotificationItem> = {
    status: 'idle',
    items: [],
    loadingMore: false,
    hasMore: false,
    search: '',
    tooShort: false,
};

/**
 * Bell with the unread count that opens the notifications in a sheet: grouped by day, unread marked (also as text),
 * "Mark as read" per entry and for all, "Load more". Newly arrived unread ones are announced.
 */
export function NotificationCenter({
    items = [],
    dataSource,
    pageSize = 20,
    unreadCount,
    hasMore: hasMoreProp = false,
    loading: loadingProp = false,
    open: openProp,
    onOpenChange,
    label,
    now,
    emptyText,
    onMarkRead,
    onMarkAllRead,
    onLoadMore,
    onSelect,
    renderActions,
}: NotificationCenterProps) {
    const { translations, locale } = useLocale();
    const t = translations.notificationCenter;
    const styles = notificationCenter();
    const [open, setOpen] = useControllable(openProp, false, onOpenChange);
    const [state, setState] = useState(idle);
    const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
    const list = useRef<DataList<NotificationItem> | undefined>(undefined);

    // The data source: the first page on mount, more on "Load more"
    useEffect(() => {
        if (!dataSource) return;
        const created = createDataList<NotificationItem>({ source: dataSource, pageSize, onChange: setState });
        list.current = created;
        void created.open();
        return () => {
            created.dispose();
            list.current = undefined;
        };
    }, [dataSource, pageSize]);

    const all = useMemo(() => {
        const loaded = dataSource ? state.items : [];
        const pushed = new Set(items.map((item) => item.id));
        return [...items, ...loaded.filter((item) => !pushed.has(item.id))].map((item) =>
            readIds.has(item.id) ? { ...item, read: true } : item
        );
    }, [items, state.items, dataSource, readIds]);
    const unread = unreadCount ?? all.filter((item) => !item.read).length;
    const hasMore = dataSource ? state.hasMore : hasMoreProp;
    const loading = dataSource ? state.loadingMore || state.status === 'loading' : loadingProp;

    // Announce unread ones that arrive later (not the first ones, not older pages)
    const known = useRef<{ ids: Set<string>; newest: number } | null>(null);
    useEffect(() => {
        if (!known.current) {
            known.current = { ids: new Set(all.map((item) => item.id)), newest: newestTime(all) };
            return;
        }
        const fresh = newUnread(known.current.ids, all, known.current.newest);
        for (const item of all) known.current.ids.add(item.id);
        known.current.newest = Math.max(known.current.newest, newestTime(all));
        if (fresh.length) announce(t.announce(fresh.length, fresh[0]!.title));
    }, [all, t]);

    const markRead = (id: string) => {
        if (dataSource) setReadIds((current) => new Set(current).add(id));
        onMarkRead?.(id);
    };
    const markAll = () => {
        if (dataSource) setReadIds(new Set(all.map((item) => item.id)));
        onMarkAllRead?.();
    };
    const reference = now ? toDate(now) : new Date();
    const name = label ?? t.label;

    return (
        <>
            <IconButton
                icon={Bell}
                label={name}
                badge={unread}
                badgeLabel={(count) => (count ? t.unreadCount(count) : '')}
                aria-expanded={open}
                {...({ 'aria-haspopup': 'dialog' } as object)}
                className={styles.trigger()}
                onPress={() => setOpen(true)}
            />
            <Sheet
                open={open}
                onClose={() => setOpen(false)}
                title={name}
                closeLabel={translations.common.close}
                focusClose
                before={
                    <View className={styles.toolbar()}>
                        <Text className={styles.count()}>{t.unreadCount(unread)}</Text>
                        {unread > 0 && (
                            <Pressable role="button" className={styles.markAll()} onPress={markAll}>
                                <Text className={styles.markAllLabel()}>{t.markAllRead}</Text>
                            </Pressable>
                        )}
                    </View>
                }
            >
                {all.length === 0 && !loading && <Text className={styles.empty()}>{emptyText ?? t.empty}</Text>}
                {groupByDay(all, reference).map((group) => (
                    <View key={group.day}>
                        <Text role="heading" aria-level={3} className={styles.day()}>
                            {dayLabel(group.day, locale, t.older)}
                        </Text>
                        <View role="list">
                            {group.items.map((item) => {
                                const itemStyles = notificationCenter({ unread: !item.read });
                                const body = (
                                    <>
                                        {item.icon && (
                                            <View className={itemStyles.iconBox()} aria-hidden>
                                                <Icon icon={item.icon} className={itemStyles.icon()} />
                                            </View>
                                        )}
                                        <View className={itemStyles.body()}>
                                            <Text className={itemStyles.title()}>
                                                {!item.read && <Text className={visuallyHidden()}>{t.unread}: </Text>}
                                                {item.title}
                                            </Text>
                                            {!!item.description && (
                                                <Text className={itemStyles.description()}>{item.description}</Text>
                                            )}
                                            <Text className={itemStyles.time()}>
                                                {notificationTime(item.date, group.day, locale)}
                                            </Text>
                                        </View>
                                    </>
                                );
                                return (
                                    <View key={item.id} role="listitem" className={itemStyles.item()}>
                                        {onSelect ? (
                                            <Pressable
                                                role="button"
                                                className={itemStyles.itemButton()}
                                                onPress={() => {
                                                    setOpen(false);
                                                    onSelect(item);
                                                }}
                                            >
                                                {body}
                                            </Pressable>
                                        ) : (
                                            body
                                        )}
                                        {renderActions?.(item)}
                                        {!item.read && (
                                            <Pressable
                                                role="button"
                                                aria-label={`${t.markRead}: ${item.title}`}
                                                className={itemStyles.markRead()}
                                                onPress={() => markRead(item.id)}
                                            >
                                                <Icon icon={Check} className={itemStyles.markReadIcon()} />
                                            </Pressable>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}
                {(hasMore || loading) && (
                    <View className={styles.more()}>
                        <Button
                            variant="outline"
                            size="sm"
                            block
                            loading={loading}
                            onPress={() => (dataSource ? void list.current?.loadMore() : onLoadMore?.())}
                        >
                            {t.loadMore}
                        </Button>
                    </View>
                )}
            </Sheet>
        </>
    );
}
