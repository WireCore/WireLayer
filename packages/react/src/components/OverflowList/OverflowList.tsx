import {
    overflowList as overflowListRecipe,
    overflowVisibleCount,
    visuallyHidden,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useCallback, useEffect, useLayoutEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover/Popover.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface OverflowListProps<T> extends Omit<ComponentProps<'ul'>, 'children'> {
    /** The items, e.g. tags, buttons or people */
    items: readonly T[];
    /** One item – in the row and in the popover */
    renderItem: (item: T, index: number) => ReactNode;
    /** Own content of the popover (default: the hidden items) */
    renderOverflow?: (items: T[]) => ReactNode;
    /** Show at most this many (the rest goes behind "+N" even if there is room) */
    maxVisible?: number;
    /** Rows the items may wrap into before the rest is hidden (default 1) */
    maxRows?: number;
    /** Which items hide first: from the end (default) or from the start (the "+N" button comes first) */
    collapseFrom?: 'end' | 'start';
    /** Accessible name of the list */
    label?: string;
    /** Title of the popover with the hidden items (default "More items") */
    overflowTitle?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof overflowListRecipe>;
}

// Layout effects only run in the browser; on the server a plain effect (that never runs) avoids React's warning
const useBrowserLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/** Items in a row; the ones that do not fit are hidden and listed in a popover behind the "+N" button */
export function OverflowList<T>({
    classes,
    items,
    renderItem,
    renderOverflow,
    maxVisible,
    maxRows = 1,
    collapseFrom = 'end',
    label,
    overflowTitle,
    className,
    ...props
}: OverflowListProps<T>) {
    const overflowList = useRecipe('overflowList', overflowListRecipe, classes);
    const translations = useTranslations();
    const capped = Math.min(items.length, maxVisible ?? Infinity);
    // Without layout (server, before measuring): everything up to maxVisible
    const [measured, setMeasured] = useState<number | null>(null);
    const visible = Math.min(measured ?? capped, items.length);
    const hiddenCount = items.length - visible;
    const isHidden = (index: number) => (collapseFrom === 'start' ? index < hiddenCount : index >= visible);
    const styles = overflowList({ wrap: maxRows > 1 ? 'rows' : 'single' });
    const [list, setList] = useState<HTMLUListElement | null>(null);

    const measure = useCallback(() => {
        if (!list) return;
        const entries = [...list.children] as HTMLElement[];
        const style = getComputedStyle(list);
        setMeasured(
            overflowVisibleCount({
                widths: entries.filter((entry) => entry.dataset.index !== undefined).map((item) => item.offsetWidth),
                available:
                    list.clientWidth - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0'),
                moreWidth: entries.find((entry) => entry.dataset.more !== undefined)?.offsetWidth || 48,
                gap: parseFloat(style.columnGap) || 0,
                maxVisible,
                maxRows,
                collapseFrom,
            })
        );
    }, [list, maxVisible, maxRows, collapseFrom]);
    useBrowserLayoutEffect(() => {
        if (!list) return;
        const frame = requestAnimationFrame(measure);
        if (typeof ResizeObserver === 'undefined') return () => cancelAnimationFrame(frame);
        const observer = new ResizeObserver(measure);
        observer.observe(list);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [list, measure, items]);

    const hiddenEntries = items.map((item, index) => ({ item, index })).filter((entry) => isHidden(entry.index));
    const more = hiddenCount > 0 && (
        <li key="more" className={styles.item()} data-more="">
            <Popover placement={collapseFrom === 'start' ? 'bottom-start' : 'bottom-end'}>
                <PopoverTrigger>
                    <button type="button" className={styles.more()}>
                        {`+${hiddenCount} `}
                        <span className={visuallyHidden()}>{translations.overflowList.more}</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent title={overflowTitle ?? translations.overflowList.title}>
                    {renderOverflow ? (
                        renderOverflow(hiddenEntries.map((entry) => entry.item))
                    ) : (
                        <ul className={styles.rest()}>
                            {hiddenEntries.map((entry) => (
                                <li key={entry.index} className={styles.restItem()}>
                                    {renderItem(entry.item, entry.index)}
                                </li>
                            ))}
                        </ul>
                    )}
                </PopoverContent>
            </Popover>
        </li>
    );
    return (
        <ul {...props} ref={setList} className={styles.base({ class: className })} aria-label={label}>
            {collapseFrom === 'start' && more}
            {items.map((item, index) => (
                <li
                    key={index}
                    className={styles.item({ overflowed: isHidden(index) })}
                    data-index={index}
                    aria-hidden={isHidden(index) || undefined}
                    inert={isHidden(index) || undefined}
                >
                    {renderItem(item, index)}
                </li>
            ))}
            {collapseFrom === 'end' && more}
        </ul>
    );
}
