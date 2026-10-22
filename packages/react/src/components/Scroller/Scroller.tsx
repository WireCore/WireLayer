import { scrollEdges, scroller as scrollerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ScrollerProps extends ComponentProps<'div'> {
    /** Name of the scrollable row – it is focusable, so keyboard users scroll it with the arrow keys */
    label: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof scrollerRecipe>;
}

/**
 * A row that scrolls sideways: the row is a focusable region (arrow keys scroll it); the arrow buttons are for the
 * pointer only and show while there is more in that direction, the edges fade.
 */
export function Scroller({ classes, label, className, children, ...props }: ScrollerProps) {
    const scroller = useRecipe('scroller', scrollerRecipe, classes);
    const styles = scroller();
    const viewport = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ start: false, end: false });
    const update = () => viewport.current && setEdges(scrollEdges(viewport.current));
    useEffect(() => {
        if (!viewport.current) return;
        update();
        const observer = new ResizeObserver(update);
        observer.observe(viewport.current);
        return () => observer.disconnect();
    }, []);
    const scroll = (towardsEnd: boolean) => {
        const element = viewport.current;
        if (!element) return;
        const rtl = getComputedStyle(element).direction === 'rtl';
        const distance = element.clientWidth * 0.8 * (towardsEnd ? 1 : -1) * (rtl ? -1 : 1);
        const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
        element.scrollBy({ left: distance, behavior: smooth ? 'smooth' : 'auto' });
    };
    return (
        <div {...props} className={styles.base({ class: className })}>
            {edges.start && (
                <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    data-side="start"
                    className={styles.button()}
                    onClick={() => scroll(false)}
                >
                    <ChevronLeft className={styles.buttonIcon()} />
                </button>
            )}
            <div
                ref={viewport}
                role="region"
                aria-label={label}
                tabIndex={0}
                className={styles.viewport()}
                data-more-start={edges.start ? '' : undefined}
                data-more-end={edges.end ? '' : undefined}
                onScroll={update}
            >
                {children}
            </div>
            {edges.end && (
                <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    data-side="end"
                    className={styles.button()}
                    onClick={() => scroll(true)}
                >
                    <ChevronRight className={styles.buttonIcon()} />
                </button>
            )}
        </div>
    );
}
