import { HoverCard as ArkHoverCard } from '@ark-ui/react/hover-card';
import { Portal } from '@ark-ui/react/portal';
import { hoverCard as hoverCardRecipe, type OverlayHandle, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ReactElement, ReactNode, Ref } from 'react';
import { useAnchoredOverlay, type AnchorProp } from '../../overlay.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface HoverCardProps {
    /** Delay before opening (ms) */
    openDelay?: number;
    /** Delay before closing (ms) – time to move the pointer onto the card */
    closeDelay?: number;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Element, ref or point to open at instead of the trigger; open with `open` or `ref.current.open(anchor)` */
    anchor?: AnchorProp;
    /** open(anchor), close(), toggle(anchor) – to open the card at any element or pointer position */
    ref?: Ref<OverlayHandle>;
    /** The card */
    content: ReactNode;
    /** The trigger, e.g. a link – optional with `anchor` or `open(anchor)` */
    children?: ReactElement;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof hoverCardRecipe>;
}

/**
 * Extra information on hover or keyboard focus of the trigger (WCAG 1.4.13: stays while hovered, Escape closes).
 * Only additional content – everything essential must be reachable without it.
 */
export function HoverCard({
    classes,
    openDelay = 500,
    closeDelay = 300,
    open,
    defaultOpen,
    onOpenChange,
    anchor,
    ref,
    content,
    children,
}: HoverCardProps) {
    const hoverCard = useRecipe('hoverCard', hoverCardRecipe, classes);
    const styles = hoverCard();
    const state = useAnchoredOverlay({ open, defaultOpen, anchor, onOpenChange, ref });
    return (
        <ArkHoverCard.Root
            open={state.isOpen}
            onOpenChange={(details) => state.onOpenChange(details.open)}
            openDelay={openDelay}
            closeDelay={closeDelay}
            positioning={state.positioning({})}
            lazyMount
            unmountOnExit
        >
            {children && <ArkHoverCard.Trigger asChild>{children}</ArkHoverCard.Trigger>}
            <Portal>
                <ArkHoverCard.Positioner>
                    <ArkHoverCard.Content className={styles.content()}>
                        <ArkHoverCard.Arrow className={styles.arrow()}>
                            <ArkHoverCard.ArrowTip className={styles.arrowTip()} />
                        </ArkHoverCard.Arrow>
                        {content}
                    </ArkHoverCard.Content>
                </ArkHoverCard.Positioner>
            </Portal>
        </ArkHoverCard.Root>
    );
}
