import {
    columnVariables,
    masonry as masonryRecipe,
    masonrySpan,
    type RecipeClasses,
    type ResponsiveColumns,
} from '@wirecore/wirelayer-recipes';
import { useLayoutEffect, useRef, type ComponentProps, type CSSProperties } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface MasonryProps extends ComponentProps<'div'> {
    /** Columns: a number or per breakpoint, e.g. { base: 1, sm: 2, lg: 3 } (default 2) */
    columns?: ResponsiveColumns;
    /** Space between the cards: sm (8px), md (16px, default), lg (24px) */
    gap?: 'sm' | 'md' | 'lg';
    /**
     * `columns` (default): CSS columns, filled top to bottom – no JavaScript. `rows`: measured grid rows, filled left
     * to right like reading. Both keep the order of the children for screen readers and the keyboard.
     */
    mode?: 'columns' | 'rows';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof masonryRecipe>;
}

const gapPx = { sm: 8, md: 16, lg: 24 };
// No layout effects on the server
const useClientLayoutEffect = typeof document === 'undefined' ? () => undefined : useLayoutEffect;

/** Cards of different heights in columns; the order of the children stays the reading order */
export function Masonry({
    classes,
    columns = 2,
    gap,
    mode = 'columns',
    className,
    style,
    children,
    ...props
}: MasonryProps) {
    const masonry = useRecipe('masonry', masonryRecipe, classes);
    const element = useRef<HTMLDivElement>(null);
    // rows: every child spans as many 4px rows as it is high (plus the gap); runs after every render (new children)
    useClientLayoutEffect(() => {
        const root = element.current;
        if (!root) return;
        const items = [...root.children] as HTMLElement[];
        if (mode !== 'rows') {
            for (const item of items) item.style.removeProperty('grid-row-end');
            return;
        }
        const layout = () => {
            for (const item of items) {
                item.style.gridRowEnd = `span ${masonrySpan(item.getBoundingClientRect().height, 4, gapPx[gap ?? 'md'])}`;
            }
        };
        const observer = new ResizeObserver(layout);
        for (const item of items) observer.observe(item);
        layout();
        return () => observer.disconnect();
    });
    return (
        <div
            {...props}
            ref={element}
            className={masonry({ gap, measured: mode === 'rows', class: className })}
            style={{ ...columnVariables(columns), ...style } as CSSProperties}
        >
            {children}
        </div>
    );
}
