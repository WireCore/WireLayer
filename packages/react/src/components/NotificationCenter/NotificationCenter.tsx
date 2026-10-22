import {
    dayLabel,
    groupByDay,
    newestTime,
    newUnread,
    notificationCenter as notificationCenterRecipe,
    notificationTime,
    type DataSource,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Bell, Check } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { Button } from '../Button/Button.js';
import { Drawer, DrawerContent } from '../Drawer/Drawer.js';
import { IconButton } from '../IconButton/IconButton.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useDataSource } from '../../utils/data-source.js';

export interface NotificationItem {
    id: string;
    title: string;
    description?: string;
    /** When it happened – grouped into today, yesterday and older */
    date: Date | string | number;
    read?: boolean;
    /** The title becomes a link */
    href?: string;
    icon?: IconComponent;
}

export interface NotificationCenterProps extends Omit<ComponentProps<'div'>, 'onSelect'> {
    /** The notifications (with `dataSource`: new ones pushed by the app, before the loaded pages) */
    items?: NotificationItem[];
    /**
     * Notifications from a server, page by page (newest first): the first page is loaded at the start, "Load more"
     * loads the next; items marked as read are kept as read here (report them with onMarkRead/onMarkAllRead)
     */
    dataSource?: DataSource<NotificationItem>;
    /** Notifications per page of the data source (default 20) */
    pageSize?: number;
    /** Unread count on the bell when not all items are loaded (default: the unread items) */
    unreadCount?: number;
    /** Shows "Load more" below the list (onLoadMore) */
    hasMore?: boolean;
    /** The next page is loading (the button stays focusable, aria-busy) */
    loading?: boolean;
    /** popover (default) next to the bell, or drawer from the side */
    display?: 'popover' | 'drawer';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Name of the bell and title of the panel (default "Notifications") */
    label?: string;
    /** Reference time for "Today"/"Yesterday" (default: now) */
    now?: Date | string;
    /** Text without notifications (default "No notifications") */
    emptyText?: string;
    /** Mark one item as read */
    onMarkRead?: (id: string) => void;
    onMarkAllRead?: () => void;
    /** Load the next page (hasMore) */
    onLoadMore?: () => void;
    /** The title link of an item was clicked */
    onSelect?: (item: NotificationItem, event: MouseEvent<HTMLAnchorElement>) => void;
    /** Own buttons per item (before "mark as read") */
    renderActions?: (item: NotificationItem) => ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof notificationCenterRecipe>;
}

type ListProps = Pick<
    NotificationCenterProps,
    | 'items'
    | 'hasMore'
    | 'loading'
    | 'now'
    | 'emptyText'
    | 'onMarkRead'
    | 'onMarkAllRead'
    | 'onLoadMore'
    | 'onSelect'
    | 'renderActions'
    | 'classes'
> & { items: NotificationItem[]; unread: number };

function NotificationList({
    items,
    unread,
    hasMore,
    loading,
    now,
    emptyText,
    onMarkRead,
    onMarkAllRead,
    onLoadMore,
    onSelect,
    renderActions,
    classes,
}: ListProps) {
    const notificationCenter = useRecipe('notificationCenter', notificationCenterRecipe, classes);
    const styles = notificationCenter();
    const translations = useTranslations();
    const texts = translations.notificationCenter;
    const { locale } = useLocale();
    const id = useId();
    const groups = groupByDay(items, now === undefined ? new Date() : new Date(now));
    return (
        <>
            <div className={styles.header()}>
                <span>{texts.unreadCount(unread)}</span>
                <button type="button" className={styles.markAll()} disabled={unread === 0} onClick={onMarkAllRead}>
                    {texts.markAllRead}
                </button>
            </div>
            <div className={styles.scroll()}>
                {items.length === 0 && <p className={styles.empty()}>{emptyText ?? texts.empty}</p>}
                {groups.map((group) => (
                    <div key={group.day} className={styles.group()}>
                        <p id={`${id}-${group.day}`} className={styles.groupTitle()}>
                            {dayLabel(group.day, locale, texts.older)}
                        </p>
                        <ul className={styles.list()} aria-labelledby={`${id}-${group.day}`}>
                            {group.items.map((item) => {
                                const itemStyles = notificationCenter({ unread: !item.read });
                                const Icon = item.icon;
                                const title = (
                                    <>
                                        {!item.read && <span className={styles.srOnly()}>{`${texts.unread}:`}</span>}{' '}
                                        {item.title}
                                    </>
                                );
                                return (
                                    <li key={item.id} className={itemStyles.item()}>
                                        <span
                                            className={item.read ? styles.dotPlaceholder() : styles.dot()}
                                            aria-hidden="true"
                                        />
                                        {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
                                        <div className={styles.body()}>
                                            {item.href ? (
                                                <a
                                                    href={item.href}
                                                    className={itemStyles.title({ class: styles.titleLink() })}
                                                    onClick={(event) => onSelect?.(item, event)}
                                                >
                                                    {title}
                                                </a>
                                            ) : (
                                                <span className={itemStyles.title()}>{title}</span>
                                            )}
                                            {item.description && (
                                                <p className={styles.description()}>{item.description}</p>
                                            )}
                                            <time
                                                dateTime={new Date(item.date).toISOString()}
                                                className={styles.time()}
                                            >
                                                {notificationTime(item.date, group.day, locale)}
                                            </time>
                                        </div>
                                        <div className={styles.actions()}>
                                            {renderActions?.(item)}
                                            {!item.read && (
                                                <IconButton
                                                    icon={Check}
                                                    label={`${texts.markRead}: ${item.title}`}
                                                    variant="text"
                                                    size="xs"
                                                    onClick={() => onMarkRead?.(item.id)}
                                                />
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
                {hasMore && (
                    <div className={styles.more()}>
                        <Button size="sm" variant="text" loading={loading} onClick={onLoadMore}>
                            {texts.loadMore}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

const NO_ITEMS: NotificationItem[] = [];

/**
 * Bell with the unread count (part of its name) that opens the notifications in a popover (role="dialog") or a
 * drawer: grouped by day, unread marked with text, actions per item, "mark all as read", loading more; new
 * notifications are announced politely
 */
export function NotificationCenter({
    classes,
    items: itemsProp = NO_ITEMS,
    dataSource,
    pageSize = 20,
    unreadCount,
    hasMore: hasMoreProp,
    loading: loadingProp,
    display = 'popover',
    open,
    onOpenChange,
    label,
    now,
    emptyText,
    onMarkRead,
    onMarkAllRead,
    onLoadMore,
    onSelect,
    renderActions,
    className,
    ...props
}: NotificationCenterProps) {
    const notificationCenter = useRecipe('notificationCenter', notificationCenterRecipe, classes);
    const styles = notificationCenter();
    const translations = useTranslations();
    const name = label ?? translations.notificationCenter.label;
    // Pages from a data source after the given items; read marks are kept here until the next load
    const source = useDataSource<NotificationItem>({ source: dataSource, pageSize });
    const openSource = useRef(source.open);
    useEffect(() => {
        openSource.current = source.open;
    });
    useEffect(() => {
        if (dataSource) openSource.current();
    }, [dataSource]);
    const [readIds, setReadIds] = useState<ReadonlySet<string>>(() => new Set());
    const loaded = source.active
        ? [...itemsProp, ...source.state.items.filter((item) => !itemsProp.some((own) => own.id === item.id))]
        : itemsProp;
    const all = readIds.size ? loaded.map((item) => (readIds.has(item.id) ? { ...item, read: true } : item)) : loaded;
    const hasMore = source.active ? source.state.hasMore : hasMoreProp;
    const loading = !!loadingProp || (source.active && source.state.status === 'loading');
    const markRead = (id: string) => {
        if (source.active) setReadIds((old) => new Set([...old, id]));
        onMarkRead?.(id);
    };
    const markAllRead = () => {
        if (source.active) setReadIds(new Set(all.map((item) => item.id)));
        onMarkAllRead?.();
    };
    const items = itemsProp;
    const unread = unreadCount ?? all.filter((item) => !item.read).length;
    const [internal, setInternal] = useState(false);
    const isOpen = open ?? internal;
    const setOpen = (next: boolean) => {
        setInternal(next);
        onOpenChange?.(next);
    };
    const badgeLabel = (count: string | null) => translations.notificationCenter.unreadCount(count ?? '');

    // New unread notifications are announced politely (not the ones present at the start or loaded as older pages)
    const [announcement, setAnnouncement] = useState('');
    const seen = useRef<{ known: Set<string>; newest: number } | null>(null);
    useEffect(() => {
        if (!seen.current) {
            seen.current = { known: new Set(items.map((item) => item.id)), newest: newestTime(items) };
            return;
        }
        const fresh = newUnread(seen.current.known, items, seen.current.newest);
        for (const item of items) seen.current.known.add(item.id);
        seen.current.newest = Math.max(seen.current.newest, newestTime(items));
        if (fresh.length) setAnnouncement(translations.notificationCenter.announce(fresh.length, fresh[0]!.title));
    }, [items, translations]);

    const list = (
        <NotificationList
            items={all}
            unread={unread}
            hasMore={hasMore}
            loading={loading}
            now={now}
            emptyText={emptyText}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            onLoadMore={source.active ? source.loadMore : onLoadMore}
            onSelect={onSelect}
            renderActions={renderActions}
            classes={classes}
        />
    );
    const bell = (extra: Pick<ComponentProps<'button'>, 'aria-haspopup' | 'aria-expanded' | 'onClick'> = {}) => (
        <IconButton {...extra} icon={Bell} label={name} variant="text" badge={unread} badgeLabel={badgeLabel} />
    );
    return (
        <div {...props} className={styles.base({ class: className })}>
            {display === 'popover' ? (
                <Popover open={isOpen} onOpenChange={setOpen} placement="bottom-end">
                    <PopoverTrigger>{bell()}</PopoverTrigger>
                    <PopoverContent
                        title={name}
                        classes={{ content: styles.panel(), title: styles.panelTitle(), body: styles.panelBody() }}
                    >
                        {list}
                    </PopoverContent>
                </Popover>
            ) : (
                <>
                    {bell({ 'aria-haspopup': 'dialog', 'aria-expanded': isOpen, onClick: () => setOpen(true) })}
                    <Drawer open={isOpen} onOpenChange={setOpen}>
                        <DrawerContent title={name} placement="right">
                            {list}
                        </DrawerContent>
                    </Drawer>
                </>
            )}
            <span role="status" className={styles.status()}>
                {announcement}
            </span>
        </div>
    );
}
