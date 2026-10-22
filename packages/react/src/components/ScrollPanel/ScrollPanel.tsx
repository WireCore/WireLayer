import { ScrollArea } from '@ark-ui/react/scroll-area';
import { scrollPanel as scrollPanelRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useRef, type CSSProperties, type ReactNode, type UIEvent } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ScrollPanelProps {
    /** Names the scrollable region – it is focusable, so keyboard users can scroll it */
    label: string;
    children: ReactNode;
    /** When the scrollbars show: `auto` (on overflow, default), `hover`, `always` or `hidden` */
    scrollbars?: 'auto' | 'hover' | 'always' | 'hidden';
    /** Fades the top and bottom edge while there is more to scroll in that direction */
    fade?: boolean;
    /** Distance in pixels from the start/end at which onReachStart/onReachEnd fire (default 0) */
    reachThreshold?: number;
    /** Scrolled back to the top */
    onReachStart?: () => void;
    /** Scrolled to the bottom, e.g. to load more */
    onReachEnd?: () => void;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof scrollPanelRecipe>;
}

/** Native scrolling with slim scrollbars; the viewport is a named, focusable region (arrow keys scroll) */
export function ScrollPanel({
    classes,
    label,
    children,
    scrollbars,
    fade,
    reachThreshold = 0,
    onReachStart,
    onReachEnd,
    className,
    style,
}: ScrollPanelProps) {
    const scrollPanel = useRecipe('scrollPanel', scrollPanelRecipe, classes);
    const styles = scrollPanel({ scrollbars, fade });
    // Fires once when the start or end is reached (vertically)
    const reached = useRef({ start: true, end: false });
    const onScroll = (event: UIEvent<HTMLDivElement>) => {
        const viewport = event.currentTarget;
        const start = viewport.scrollTop <= reachThreshold;
        const end = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - reachThreshold - 1;
        if (start && !reached.current.start) onReachStart?.();
        if (end && !reached.current.end) onReachEnd?.();
        reached.current = { start, end };
    };
    return (
        <ScrollArea.Root className={styles.base({ class: className })} style={style}>
            <ScrollArea.Viewport
                className={styles.viewport()}
                tabIndex={0}
                role="region"
                aria-label={label}
                onScroll={onScroll}
            >
                <ScrollArea.Content className={styles.content()}>{children}</ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="vertical" className={styles.scrollbar()}>
                <ScrollArea.Thumb className={styles.thumb()} />
            </ScrollArea.Scrollbar>
            <ScrollArea.Scrollbar orientation="horizontal" className={styles.scrollbar()}>
                <ScrollArea.Thumb className={styles.thumb()} />
            </ScrollArea.Scrollbar>
        </ScrollArea.Root>
    );
}
