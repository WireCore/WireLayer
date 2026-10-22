import { timeline, visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { Circle } from 'lucide-react-native';
import { useId, type ReactNode } from 'react';
import { Platform, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { Button } from '../Button/Button.js';

export interface TimelineItem {
    /** Shown above the title */
    time: string;
    /** Machine-readable time (kept for the web API) */
    datetime?: string;
    title: string;
    description?: string;
    /** Icon component in the marker */
    icon?: IconComponent;
    status?: 'neutral' | 'success' | 'info' | 'warn' | 'danger';
    /** Text on the other side of the marker */
    opposite?: string;
}

export interface TimelineProps extends ViewProps {
    items: TimelineItem[];
    /** Accessible name of the list */
    label: string;
    /** Content beside the rail: `start` (default), `end` or `alternate` (every second on the other side) */
    align?: 'start' | 'end' | 'alternate';
    /** Current event: filled marker, read as current */
    activeIndex?: number;
    /** Replaces time, title and description */
    renderContent?: (item: TimelineItem, index: number) => ReactNode;
    /** Content on the other side of the marker */
    renderOpposite?: (item: TimelineItem, index: number) => ReactNode;
    /** Content of the marker instead of the icon */
    renderMarker?: (item: TimelineItem, index: number) => ReactNode;
    /** A feed (role feed, articles) that grows with older entries */
    feed?: boolean;
    /** Shows "Load older entries" */
    hasMore?: boolean;
    /** Older entries are loading (busy) */
    loading?: boolean;
    /** Number of all entries (default: unknown while there are more) */
    setSize?: number;
    onLoadMore?: () => void;
    className?: string;
}

/** Events in time along a rail – optionally on both sides, as a feed that loads older entries */
export function Timeline({
    items,
    label,
    align = 'start',
    activeIndex,
    renderContent,
    renderOpposite,
    renderMarker,
    feed = false,
    hasMore = false,
    loading = false,
    setSize,
    onLoadMore,
    className,
    ...props
}: TimelineProps) {
    const translations = useTranslations();
    const styles = timeline();
    const id = useId();
    const web = Platform.OS === 'web';
    const withOpposite = align === 'alternate' || !!renderOpposite || items.some((item) => !!item.opposite);
    const size = setSize ?? (hasMore ? -1 : items.length);

    return (
        <View {...props} className={styles.base({ class: className })}>
            <View role={feed ? 'feed' : 'list'} aria-label={label} {...(feed ? { 'aria-busy': loading } : {})}>
                {items.map((item, index) => {
                    const active = index === activeIndex;
                    const reversed = align === 'end' || (align === 'alternate' && index % 2 === 1);
                    const itemStyles = timeline({ status: item.status, active, reversed });
                    const titleId = `${id}-${index}`;
                    const last = index === items.length - 1 && !hasMore;
                    const opposite =
                        renderOpposite?.(item, index) ??
                        (item.opposite ? <Text className={itemStyles.oppositeText()}>{item.opposite}</Text> : null);
                    return (
                        <View
                            key={index}
                            role={feed ? 'article' : 'listitem'}
                            {...(feed
                                ? {
                                      'aria-labelledby': renderContent ? undefined : titleId,
                                      'aria-label': renderContent ? item.title : undefined,
                                      ...(web ? { 'aria-posinset': index + 1, 'aria-setsize': size, tabIndex: 0 } : {}),
                                  }
                                : {})}
                            {...(active
                                ? web
                                    ? { 'aria-current': 'step' }
                                    : { accessibilityState: { selected: true } }
                                : {})}
                            className={itemStyles.item()}
                        >
                            {withOpposite && <View className={itemStyles.opposite()}>{opposite}</View>}
                            <View className={itemStyles.rail()} aria-hidden>
                                <View className={itemStyles.marker()}>
                                    {renderMarker ? (
                                        renderMarker(item, index)
                                    ) : (
                                        <Icon
                                            icon={item.icon ?? Circle}
                                            filled={!item.icon}
                                            className={itemStyles.markerIcon()}
                                        />
                                    )}
                                </View>
                                {!last && <View className={itemStyles.line()} />}
                            </View>
                            <View className={itemStyles.content()}>
                                {renderContent ? (
                                    renderContent(item, index)
                                ) : (
                                    <>
                                        <Text className={itemStyles.time()}>{item.time}</Text>
                                        <Text nativeID={titleId} className={itemStyles.title()}>
                                            {item.title}
                                        </Text>
                                        {!!item.description && (
                                            <Text className={itemStyles.description()}>{item.description}</Text>
                                        )}
                                    </>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
            {feed && (
                <Text role="status" className={visuallyHidden()}>
                    {loading ? translations.timeline.loading : ''}
                </Text>
            )}
            {(hasMore || loading) && (
                <View className={styles.more()}>
                    <Button variant="outline" size="sm" loading={loading} onPress={() => onLoadMore?.()}>
                        {loading ? translations.timeline.loading : translations.timeline.loadMore}
                    </Button>
                </View>
            )}
        </View>
    );
}
