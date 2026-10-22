import { ark } from '@ark-ui/react/factory';
import { Popover as ArkPopover, usePopoverContext } from '@ark-ui/react/popover';
import { Portal } from '@ark-ui/react/portal';
import { popover as popoverRecipe, type OverlayHandle, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import {
    createContext,
    useContext,
    useId,
    type ComponentProps,
    type ReactElement,
    type ReactNode,
    type Ref,
} from 'react';
import { useAnchoredOverlay, type AnchorProp } from '../../overlay.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right' | `${'top' | 'bottom'}-${'start' | 'end'}`;

/** Settings of the surrounding Popover that its content needs */
const PopoverRootContext = createContext<{ overlay?: boolean; width?: 'trigger' }>({});

export interface PopoverProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    placement?: PopoverPlacement;
    /**
     * Element, ref or point to open at instead of the trigger – e.g. a table cell; open with `open` or
     * `ref.current.open(anchor)`
     */
    anchor?: AnchorProp;
    /** `trigger`: as wide as the trigger or anchor */
    width?: 'trigger';
    /** Keeps the focus inside the panel and makes the page behind inert (modal popover) */
    trapFocus?: boolean;
    /** Dims the page behind the panel */
    overlay?: boolean;
    /** open(anchor), close(), toggle(anchor) – to open the popover at any element or pointer position */
    ref?: Ref<OverlayHandle>;
    children: ReactNode;
}

/** Non-modal panel next to its trigger; Escape and clicking outside close it, focus returns to the trigger */
export function Popover({
    open,
    defaultOpen,
    onOpenChange,
    placement = 'bottom',
    anchor,
    width,
    trapFocus,
    overlay,
    ref,
    children,
}: PopoverProps) {
    const state = useAnchoredOverlay({ open, defaultOpen, anchor, onOpenChange, ref });
    return (
        <PopoverRootContext.Provider value={{ overlay, width }}>
            <ArkPopover.Root
                open={state.isOpen}
                onOpenChange={(details) => state.onOpenChange(details.open)}
                positioning={state.positioning({ placement, gutter: 10, sameWidth: width === 'trigger' })}
                modal={trapFocus}
                finalFocusEl={state.finalFocusEl}
                lazyMount
                unmountOnExit
            >
                {children}
            </ArkPopover.Root>
        </PopoverRootContext.Provider>
    );
}

/** Opens the surrounding Popover (wraps your own button) */
export function PopoverTrigger({ children }: { children: ReactElement }) {
    return <ArkPopover.Trigger asChild>{children}</ArkPopover.Trigger>;
}

/**
 * Closes the popover from your own button. Not Ark's CloseTrigger: that labels its element "close" and would
 * replace the visible text as the accessible name.
 */
export function PopoverClose({ children }: { children: ReactElement }) {
    const popover = usePopoverContext();
    return (
        <ark.button asChild onClick={() => popover.setOpen(false)}>
            {children}
        </ark.button>
    );
}

export interface PopoverContentProps extends Omit<ComponentProps<'div'>, 'title'> {
    /** Accessible name of the panel (role="dialog") */
    title: string;
    description?: string;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof popoverRecipe>;
}

/** The panel of a Popover (role="dialog") with title and close button */
export function PopoverContent({
    classes,
    title,
    description,
    closeLabel,
    className,
    children,
    ...props
}: PopoverContentProps) {
    const popover = useRecipe('popover', popoverRecipe, classes);
    const root = useContext(PopoverRootContext);
    const context = usePopoverContext();
    const styles = popover({ width: root.width });
    const translations = useTranslations();
    // Ark only links title/description that exist when the popover is created – with lazy mounting they don't
    const titleId = useId();
    const descriptionId = useId();

    return (
        <Portal>
            {root.overlay && context.open && <div className={styles.backdrop()} data-state="open" aria-hidden="true" />}
            <ArkPopover.Positioner>
                <ArkPopover.Content
                    aria-labelledby={titleId}
                    aria-describedby={description ? descriptionId : undefined}
                    {...props}
                    className={styles.content({ class: className })}
                >
                    <ArkPopover.Arrow className={styles.arrow()}>
                        <ArkPopover.ArrowTip className={styles.arrowTip()} />
                    </ArkPopover.Arrow>
                    <ArkPopover.Title id={titleId} className={styles.title()}>
                        {title}
                    </ArkPopover.Title>
                    {description && (
                        <ArkPopover.Description id={descriptionId} className={styles.description()}>
                            {description}
                        </ArkPopover.Description>
                    )}
                    {children && <div className={styles.body()}>{children}</div>}
                    <ArkPopover.CloseTrigger
                        className={styles.close()}
                        aria-label={closeLabel ?? translations.common.close}
                    >
                        <X className={styles.closeIcon()} aria-hidden="true" />
                    </ArkPopover.CloseTrigger>
                </ArkPopover.Content>
            </ArkPopover.Positioner>
        </Portal>
    );
}
