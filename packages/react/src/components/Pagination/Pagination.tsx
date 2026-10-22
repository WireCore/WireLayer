import { Pagination as ArkPagination } from '@ark-ui/react/pagination';
import { pageForSize, pagination as paginationRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { createElement, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { Input } from '../Input/Input.js';
import { Select } from '../Select/Select.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

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

export interface PaginationProps extends Omit<ComponentProps<'nav'>, 'dir'> {
    /** Total number of items */
    count: number;
    /** Items per page – controlled together with onPageSizeChange when `pageSizes` lets the user change it */
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    /** Current page (1-based) */
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    /** Pages shown on each side of the current page before an ellipsis */
    siblingCount?: number;
    /** Pages always shown at the start and the end (default 1) */
    boundaryCount?: number;
    /** Text like "1–4 of 12" before the page buttons */
    showSummary?: boolean;
    summary?: (range: PaginationRange) => string;
    /** Choice of rows per page, e.g. [10, 25, 50]; the current page keeps its first item in view */
    pageSizes?: number[];
    /** Field to go to a page by number */
    jumper?: boolean;
    /**
     * `full`: page buttons (default); `compact`: "Page 2 of 5" between the arrows; `auto`: compact when the
     * pagination is narrower than 28rem (container query)
     */
    variant?: 'full' | 'compact' | 'auto';
    /** Buttons to the first and the last page */
    withEdges?: boolean;
    /** Renders nothing when there is only one page */
    hideSinglePage?: boolean;
    /** Links instead of buttons (URL keeps the page, e.g. `?page=3`): the address of a page */
    getPageHref?: (page: number) => string;
    translations?: Partial<PaginationTranslations>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof paginationRecipe>;
}

/** Page navigation with previous/next, page buttons and a summary ("1–10 of 42") */
export function Pagination({
    classes,
    count,
    pageSize = 10,
    onPageSizeChange,
    page,
    defaultPage,
    onPageChange,
    siblingCount = 1,
    boundaryCount,
    showSummary = true,
    summary,
    pageSizes,
    jumper,
    variant = 'full',
    withEdges,
    hideSinglePage,
    getPageHref,
    translations,
    className,
    ...props
}: PaginationProps) {
    const pagination = useRecipe('pagination', paginationRecipe, classes);
    const styles = pagination({ responsive: variant === 'auto' });
    const texts = useTranslations();
    // The page size follows the prop and changes with the size choice
    const [size, setSize] = useState(pageSize);
    const [sizeProp, setSizeProp] = useState(pageSize);
    if (sizeProp !== pageSize) {
        setSizeProp(pageSize);
        setSize(pageSize);
    }
    const rangeOf = (current: number): PaginationRange => ({
        start: Math.min((current - 1) * size + 1, count),
        end: Math.min(current * size, count),
        count,
    });
    if (hideSinglePage && count <= size) return null;
    const tag = getPageHref ? 'a' : 'button';
    /** A link without href (no page before/after) keeps its label as a link and says it is disabled */
    const control = (className: string, children: ReactNode, disabled = false) =>
        createElement(
            tag,
            { className, ...(getPageHref && disabled ? { role: 'link', 'aria-disabled': 'true' } : {}) },
            children
        );

    type Api = { page: number; totalPages: number; setPage: (page: number) => void };
    const changeSize = (api: Api, value: number | null) => {
        if (!value || value === size) return;
        const next = pageForSize(api.page, size, value);
        setSize(value);
        onPageSizeChange?.(value);
        // After Ark knows the new number of pages
        requestAnimationFrame(() => api.setPage(next));
    };
    const jump = (event: KeyboardEvent<HTMLInputElement>, api: Api) => {
        if (event.key !== 'Enter') return;
        const field = event.currentTarget;
        const target = Number.parseInt(field.value, 10);
        if (Number.isNaN(target)) return;
        event.preventDefault();
        api.setPage(Math.min(Math.max(target, 1), api.totalPages));
        field.value = '';
    };

    return (
        <ArkPagination.Root
            {...props}
            className={styles.base({ class: className })}
            count={count}
            pageSize={size}
            page={page}
            defaultPage={defaultPage}
            onPageChange={(details) => onPageChange?.(details.page)}
            siblingCount={siblingCount}
            boundaryCount={boundaryCount}
            type={getPageHref ? 'link' : 'button'}
            getPageUrl={getPageHref ? (details) => getPageHref(details.page) : undefined}
            translations={{ ...texts.pagination, ...translations }}
        >
            <ArkPagination.Context>
                {(api) => (
                    <>
                        {showSummary && (
                            <span className={styles.summary()} aria-live="polite">
                                {(summary ?? texts.pagination.summary)(rangeOf(api.page))}
                            </span>
                        )}
                        {!!pageSizes?.length && (
                            <div className={styles.pageSize()}>
                                <span aria-hidden="true">{texts.pagination.pageSize}</span>
                                <Select
                                    className={styles.pageSizeSelect()}
                                    size="sm"
                                    items={pageSizes.map((value) => ({ value, label: String(value) }))}
                                    value={size}
                                    aria-label={texts.pagination.pageSize}
                                    onValueChange={(value) => changeSize(api, value)}
                                />
                            </div>
                        )}
                        <div className={styles.list()}>
                            {withEdges && (
                                <ArkPagination.FirstTrigger asChild>
                                    {control(
                                        styles.trigger(),
                                        <ChevronsLeft className={styles.triggerIcon()} aria-hidden="true" />,
                                        api.page === 1
                                    )}
                                </ArkPagination.FirstTrigger>
                            )}
                            <ArkPagination.PrevTrigger asChild>
                                {control(
                                    styles.trigger(),
                                    <ChevronLeft className={styles.triggerIcon()} aria-hidden="true" />,
                                    api.page === 1
                                )}
                            </ArkPagination.PrevTrigger>
                            {variant !== 'full' && (
                                <span className={styles.compact()}>
                                    {texts.pagination.compact(api.page, api.totalPages)}
                                </span>
                            )}
                            {variant !== 'compact' &&
                                api.pages.map((item, index) =>
                                    item.type === 'page' ? (
                                        <ArkPagination.Item key={index} {...item} asChild>
                                            {control(styles.item(), item.value)}
                                        </ArkPagination.Item>
                                    ) : (
                                        <ArkPagination.Ellipsis
                                            key={index}
                                            index={index}
                                            className={styles.ellipsis()}
                                            aria-hidden="true"
                                        >
                                            …
                                        </ArkPagination.Ellipsis>
                                    )
                                )}
                            <ArkPagination.NextTrigger asChild>
                                {control(
                                    styles.trigger(),
                                    <ChevronRight className={styles.triggerIcon()} aria-hidden="true" />,
                                    api.page === api.totalPages
                                )}
                            </ArkPagination.NextTrigger>
                            {withEdges && (
                                <ArkPagination.LastTrigger asChild>
                                    {control(
                                        styles.trigger(),
                                        <ChevronsRight className={styles.triggerIcon()} aria-hidden="true" />,
                                        api.page === api.totalPages
                                    )}
                                </ArkPagination.LastTrigger>
                            )}
                        </div>
                        {jumper && (
                            <div className={styles.jumper()}>
                                <span aria-hidden="true">{texts.pagination.jumper}</span>
                                <Input
                                    className={styles.jumperInput()}
                                    size="sm"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    aria-label={texts.pagination.jumper}
                                    onKeyDown={(event) => jump(event, api)}
                                />
                            </div>
                        )}
                    </>
                )}
            </ArkPagination.Context>
        </ArkPagination.Root>
    );
}
