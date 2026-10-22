import { timeline as timelineRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useId, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { Button } from '../Button/Button.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { LoadMore } from '../Select/list.js';

export interface TimelineItem {
    /** Shown above the title, e.g. "10/20/2026, 2:30 PM" */
    time: string;
    /** Machine-readable time for <time datetime>, e.g. "2026-10-20T14:30" */
    datetime?: string;
    title: string;
    description?: string;
    icon?: IconComponent;
    status?: 'neutral' | 'success' | 'info' | 'warn' | 'danger';
    /** Text on the other side of the marker (or renderOpposite), e.g. the author */
    opposite?: string;
}

export interface TimelineProps {
    items: TimelineItem[];
    /** Accessible name of the list, e.g. "History" */
    label: string;
    /** Marker at the start (default), at the end, or in the middle with the content alternating sides (vertical only) */
    align?: 'start' | 'end' | 'alternate';
    /** Events side by side with a horizontal line */
    orientation?: 'vertical' | 'horizontal';
    /** Index of the current event: filled marker and aria-current="step" */
    activeIndex?: number;
    /** Replaces time, title and description of an event */
    renderContent?: (item: TimelineItem, index: number) => ReactNode;
    /** Content on the other side of the marker */
    renderOpposite?: (item: TimelineItem, index: number) => ReactNode;
    /** Content of the marker (instead of the icon) */
    renderMarker?: (item: TimelineItem, index: number) => ReactNode;
    /**
     * A feed (role="feed"): each event is an article that takes the focus, Page Up/Down move between them; with
     * `hasMore` older events are loaded at the end
     */
    feed?: boolean;
    /** Older events can be loaded: the button "Load older entries" (and `autoLoad`) calls onLoadMore */
    hasMore?: boolean;
    /** Older events are loading (aria-busy on the feed) */
    loading?: boolean;
    /** Loads older events when the end of the feed scrolls into view (the button stays as fallback) */
    autoLoad?: boolean;
    /** Number of all events (aria-setsize); -1 when unknown (default: the number of items, or -1 with hasMore) */
    setSize?: number;
    /** The feed wants older events (hasMore) */
    onLoadMore?: () => void;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof timelineRecipe>;
}

/** Events in order (ordered list); the markers are decoration, the status colour is not the only cue */
export function Timeline({
    classes,
    items,
    label,
    align: alignProp = 'start',
    orientation = 'vertical',
    activeIndex,
    renderContent,
    renderOpposite,
    renderMarker,
    feed = false,
    hasMore = false,
    loading = false,
    autoLoad = false,
    setSize,
    onLoadMore,
    className,
    style,
}: TimelineProps) {
    const translations = useTranslations();
    const id = useId();
    const size = setSize ?? (hasMore ? -1 : items.length);
    // Feed keyboard (APG): Page Down/Up move to the next/previous article
    const onFeedKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'PageDown' && event.key !== 'PageUp') return;
        const articles = [...event.currentTarget.querySelectorAll<HTMLElement>(':scope > article')];
        const current = articles.findIndex((article) => article.contains(event.target as Node));
        const next = articles[current + (event.key === 'PageDown' ? 1 : -1)];
        if (!next) return;
        event.preventDefault();
        next.focus();
    };
    const timeline = useRecipe('timeline', timelineRecipe, classes);
    const horizontal = orientation === 'horizontal';
    const align = horizontal ? 'start' : alignProp;
    const withOpposite = align === 'alternate' || !!renderOpposite || items.some((item) => item.opposite);
    const look = (item?: TimelineItem, index?: number) =>
        timeline({
            status: item?.status,
            active: index !== undefined && index === activeIndex,
            align,
            horizontal,
            withOpposite,
        });
    const styles = look();
    const List = feed ? 'div' : 'ol';
    const Item = feed ? 'article' : 'li';
    const list = (
        <List
            aria-label={label}
            className={styles.base({ class: className })}
            style={style}
            {...(feed ? { role: 'feed', 'aria-busy': loading || undefined, onKeyDown: onFeedKeyDown } : {})}
        >
            {items.map((item, index) => {
                const Icon = item.icon;
                const own = look(item, index);
                return (
                    <Item
                        key={index}
                        className={styles.item({ class: feed ? styles.article() : undefined })}
                        aria-current={index === activeIndex ? 'step' : undefined}
                        {...(feed
                            ? {
                                  tabIndex: 0,
                                  'aria-posinset': index + 1,
                                  'aria-setsize': size,
                                  ...(renderContent
                                      ? { 'aria-label': item.title }
                                      : { 'aria-labelledby': `${id}-${index}` }),
                              }
                            : {})}
                    >
                        <span className={styles.rail()} aria-hidden="true" />
                        {withOpposite && (
                            <div className={styles.opposite()}>
                                {renderOpposite ? renderOpposite(item, index) : item.opposite}
                            </div>
                        )}
                        <span className={own.marker()} aria-hidden="true">
                            {renderMarker
                                ? renderMarker(item, index)
                                : Icon && <Icon className={styles.markerIcon()} />}
                        </span>
                        <div className={own.content()}>
                            {renderContent ? (
                                renderContent(item, index)
                            ) : (
                                <>
                                    <time dateTime={item.datetime} className={styles.time()}>
                                        {item.time}
                                    </time>
                                    <span id={feed ? `${id}-${index}` : undefined} className={own.title()}>
                                        {item.title}
                                    </span>
                                    {item.description && (
                                        <span className={styles.description()}>{item.description}</span>
                                    )}
                                </>
                            )}
                        </div>
                    </Item>
                );
            })}
        </List>
    );
    if (!feed) return list;
    return (
        <>
            {list}
            {hasMore && (
                <div className={styles.more()}>
                    <Button variant="outline" size="sm" loading={loading} onClick={onLoadMore}>
                        {loading ? translations.timeline.loading : translations.timeline.loadMore}
                    </Button>
                    {autoLoad && (
                        <LoadMore
                            className={styles.sentinel()}
                            active={!loading}
                            count={items.length}
                            onLoad={() => onLoadMore?.()}
                        />
                    )}
                </div>
            )}
            <p role="status" className={styles.status()}>
                {loading ? translations.timeline.loading : ''}
            </p>
        </>
    );
}
