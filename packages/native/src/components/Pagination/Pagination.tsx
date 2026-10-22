import { pageForSize, pagination, paginationItems } from '@wirecore/wirelayer-recipes/native';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react-native';
import { useWindowDimensions, Platform, Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { announce } from '../LiveAnnouncer/LiveAnnouncer.js';
import { Select } from '../Select/Select.js';

export interface PaginationRange {
    start: number;
    end: number;
    count: number;
}

export interface PaginationTranslations {
    rootLabel: string;
    prevTriggerLabel: string;
    nextTriggerLabel: string;
    firstTriggerLabel?: string;
    lastTriggerLabel?: string;
    itemLabel: (details: { page: number; totalPages: number }) => string;
}

export interface PaginationProps extends ViewProps {
    /** Total number of items */
    count: number;
    /** Items per page (default 10) */
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    /** Current page, from 1 */
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    /** Pages beside the current one (default 1) */
    siblingCount?: number;
    /** Pages at both ends (default 1) */
    boundaryCount?: number;
    /** Shows "1–10 of 240" (default true) */
    showSummary?: boolean;
    /** Own text of the summary */
    summary?: (range: PaginationRange) => string;
    /** Choice of the page size, e.g. [10, 25, 50] – a select in a sheet */
    pageSizes?: number[];
    /** `full` (default): page buttons, `compact`: "Page 2 of 9" between the arrows, `auto`: compact below 448 pt */
    variant?: 'full' | 'compact' | 'auto';
    /** Buttons for the first and last page */
    withEdges?: boolean;
    /** Nothing when everything fits on one page */
    hideSinglePage?: boolean;
    translations?: Partial<PaginationTranslations>;
    className?: string;
}

/**
 * Page navigation for lists and tables: page buttons 44 pt (or compact), the summary as a live region – iOS and
 * Android announce the new page.
 */
export function Pagination({
    count,
    pageSize = 10,
    onPageSizeChange,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    siblingCount = 1,
    boundaryCount = 1,
    showSummary = true,
    summary,
    pageSizes,
    variant = 'full',
    withEdges = false,
    hideSinglePage = false,
    translations: texts,
    className,
    ...props
}: PaginationProps) {
    const translations = useTranslations();
    const t = { ...translations.pagination, ...texts };
    const styles = pagination();
    const { width } = useWindowDimensions();
    const [page, setPage] = useControllable(pageProp, defaultPage, onPageChange);
    const totalPages = Math.max(1, Math.ceil(count / pageSize));
    const current = Math.min(Math.max(1, page), totalPages);
    if (hideSinglePage && count <= pageSize) return null;

    const compact = variant === 'compact' || (variant === 'auto' && width < 448);
    const range = {
        start: Math.min((current - 1) * pageSize + 1, count),
        end: Math.min(current * pageSize, count),
        count,
    };
    const go = (next: number) => {
        const target = Math.min(Math.max(1, next), totalPages);
        if (target === current) return;
        setPage(target);
        // The web reads the summary (live region); iOS and Android get the new page announced
        if (Platform.OS !== 'web') announce(translations.pagination.compact(target, totalPages));
    };

    const arrow = (icon: IconComponent, label: string, target: number, disabled: boolean) => {
        const arrowStyles = pagination({ disabled });
        return (
            <Pressable
                role="button"
                aria-label={label}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                className={arrowStyles.item()}
                onPress={() => go(target)}
            >
                <Icon icon={icon} className={arrowStyles.icon()} />
            </Pressable>
        );
    };

    return (
        <View role="navigation" aria-label={t.rootLabel} {...props} className={styles.base({ class: className })}>
            <View className={styles.row()}>
                {withEdges && arrow(ChevronsLeft, t.firstTriggerLabel ?? '', 1, current === 1)}
                {arrow(ChevronLeft, t.prevTriggerLabel, current - 1, current === 1)}
                {compact ? (
                    <View className={styles.compact()}>
                        <Text className={styles.compactLabel()}>
                            {translations.pagination.compact(current, totalPages)}
                        </Text>
                    </View>
                ) : (
                    paginationItems(current, totalPages, siblingCount, boundaryCount).map((item, index) => {
                        if (item === 'ellipsis')
                            return (
                                <View key={`e${index}`} className={styles.ellipsis()} aria-hidden>
                                    <Text className={styles.ellipsisLabel()}>…</Text>
                                </View>
                            );
                        const selected = item === current;
                        const itemStyles = pagination({ selected });
                        return (
                            <Pressable
                                key={item}
                                role="button"
                                aria-label={t.itemLabel({ page: item, totalPages })}
                                {...(Platform.OS === 'web'
                                    ? { 'aria-current': selected ? 'page' : undefined }
                                    : { accessibilityState: { selected } })}
                                className={itemStyles.item()}
                                onPress={() => go(item)}
                            >
                                <Text className={itemStyles.itemLabel()}>{item}</Text>
                            </Pressable>
                        );
                    })
                )}
                {arrow(ChevronRight, t.nextTriggerLabel, current + 1, current === totalPages)}
                {withEdges && arrow(ChevronsRight, t.lastTriggerLabel ?? '', totalPages, current === totalPages)}
            </View>
            {(showSummary || !!pageSizes?.length) && (
                <View className={styles.footer()}>
                    {showSummary && (
                        <Text className={styles.summary()} aria-live="polite">
                            {(summary ?? translations.pagination.summary)(range)}
                        </Text>
                    )}
                    {!!pageSizes?.length && (
                        <View className={styles.pageSize()}>
                            <Select
                                aria-label={translations.pagination.pageSize}
                                size="sm"
                                items={pageSizes.map((size) => ({ value: String(size), label: String(size) }))}
                                value={String(pageSize)}
                                onValueChange={(value) => {
                                    if (!value) return;
                                    const next = Number(value);
                                    onPageSizeChange?.(next);
                                    setPage(
                                        Math.min(pageForSize(current, pageSize, next), Math.ceil(count / next) || 1)
                                    );
                                }}
                            />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
