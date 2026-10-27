import { Portal } from '@ark-ui/react/portal';
import { Tooltip as ArkTooltip } from '@ark-ui/react/tooltip';
import { createLongPress, tooltip as tooltipRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { createContext, useContext, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** Shared delays of the tooltips in a TooltipGroup */
const TooltipGroupContext = createContext<{
    openDelay: number;
    closeDelay: number;
    /** Shortly after a tooltip of the group closed, the next one opens without delay */
    instant: boolean;
    closed: () => void;
} | null>(null);

export interface TooltipGroupProps {
    /** Delay before the first tooltip of the group opens (ms) */
    openDelay?: number;
    /** Delay before a tooltip closes (ms) */
    closeDelay?: number;
    /** How long after a tooltip closed the next one opens without delay (ms) – moving along a toolbar */
    skipDelay?: number;
    children: ReactNode;
}

/** Groups tooltips (e.g. of a toolbar): after the first one, the next opens without waiting. No element of its own */
export function TooltipGroup({ openDelay = 400, closeDelay = 150, skipDelay = 300, children }: TooltipGroupProps) {
    const [instant, setInstant] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    const closed = () => {
        setInstant(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setInstant(false), skipDelay);
    };
    return (
        <TooltipGroupContext.Provider value={{ openDelay, closeDelay, instant, closed }}>
            {children}
        </TooltipGroupContext.Provider>
    );
}

export interface TooltipProps {
    /** Tooltip text – becomes the trigger's description (aria-describedby) */
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    /** Delay before opening (ms); default 400 or that of the TooltipGroup */
    openDelay?: number;
    /** Delay before closing (ms); default 150 or that of the TooltipGroup */
    closeDelay?: number;
    /** The pointer can move onto the tooltip without it closing (WCAG 1.4.13) */
    interactive?: boolean;
    /** Follows the mouse pointer over the trigger */
    followCursor?: boolean;
    /** Closes when the page (or a container around the trigger) scrolls – false keeps it open while scrolling */
    closeOnScroll?: boolean;
    /** Never opens (e.g. Truncate while the text fits) – the trigger stays the same element */
    disabled?: boolean;
    /**
     * The trigger element – no wrapper of its own. A disabled button gets no pointer or focus events: wrap it in a
     * focusable element (`<span tabIndex={0}>`) or use aria-disabled
     */
    children: ReactElement;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tooltipRecipe>;
}

export function Tooltip({
    classes,
    content,
    placement = 'top',
    openDelay,
    closeDelay,
    interactive = true,
    closeOnScroll = true,
    followCursor,
    disabled,
    children,
}: TooltipProps) {
    const tooltip = useRecipe('tooltip', tooltipRecipe, classes);
    const styles = tooltip();
    const group = useContext(TooltipGroupContext);

    // Touch has no hover: a long press opens the tooltip, the next tap anywhere else closes it
    const [touchOpen, setTouchOpen] = useState(false);
    const trigger = useRef<Element | null>(null);
    const [longPress] = useState(() => createLongPress(() => setTouchOpen(true)));
    useEffect(() => longPress.cancel, [longPress]);
    useEffect(() => {
        if (!touchOpen) return;
        const closeOnTap = (event: PointerEvent) => {
            if (!trigger.current?.contains(event.target as Node)) setTouchOpen(false);
        };
        document.addEventListener('pointerdown', closeOnTap, true);
        return () => document.removeEventListener('pointerdown', closeOnTap, true);
    }, [touchOpen]);

    // followCursor: the anchor is the pointer position, read on every frame
    const pointer = useRef<{ x: number; y: number } | null>(null);
    const positioning = followCursor
        ? {
              placement,
              gutter: 12,
              getAnchorRect: () => (pointer.current ? { ...pointer.current, width: 0, height: 0 } : null),
              listeners: { animationFrame: true },
          }
        : { placement, gutter: 8 };

    return (
        <ArkTooltip.Root
            open={touchOpen || undefined}
            onOpenChange={(details) => {
                if (details.open) return;
                setTouchOpen(false);
                group?.closed();
            }}
            openDelay={group?.instant ? 0 : (openDelay ?? group?.openDelay ?? 400)}
            closeDelay={closeDelay ?? group?.closeDelay ?? 150}
            positioning={positioning}
            interactive={interactive}
            closeOnScroll={closeOnScroll}
            disabled={disabled}
            lazyMount
            unmountOnExit
        >
            <ArkTooltip.Trigger
                asChild
                onPointerDown={(event) => {
                    trigger.current = event.currentTarget;
                    longPress.down(event);
                }}
                onPointerMove={(event) => {
                    longPress.move(event);
                    pointer.current = { x: event.clientX, y: event.clientY };
                }}
                onPointerUp={() => longPress.cancel()}
                onPointerCancel={() => longPress.cancel()}
                // The click that ends a long press must not also press the trigger
                onClickCapture={(event) => {
                    if (!longPress.consumeClick()) return;
                    event.preventDefault();
                    event.stopPropagation();
                }}
            >
                {children}
            </ArkTooltip.Trigger>
            <Portal>
                <ArkTooltip.Positioner>
                    <ArkTooltip.Content className={styles.content()}>
                        <ArkTooltip.Arrow className={styles.arrow()}>
                            <ArkTooltip.ArrowTip />
                        </ArkTooltip.Arrow>
                        {content}
                    </ArkTooltip.Content>
                </ArkTooltip.Positioner>
            </Portal>
        </ArkTooltip.Root>
    );
}
