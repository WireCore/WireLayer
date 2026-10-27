import { Dialog as ArkDialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import {
    drawer as drawerRecipe,
    type DrawerPlacement,
    type OverlaySize,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import { useContext, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { DialogRootContext } from '../Dialog/Dialog.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface DrawerProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** `false`: non-modal – no backdrop, no focus trap, the page stays usable next to the panel */
    modal?: boolean;
    /** Escape closes the drawer */
    closeOnEscape?: boolean;
    /** A click outside closes the drawer – by default for modal drawers */
    closeOnInteractOutside?: boolean;
    children: ReactNode;
}

/** Modal panel at the edge of the screen – a dialog: focus trap, Escape, scroll lock, focus returns */
export function Drawer({
    open,
    defaultOpen,
    onOpenChange,
    modal = true,
    closeOnEscape = true,
    closeOnInteractOutside,
    children,
}: DrawerProps) {
    return (
        <DialogRootContext.Provider value={{ modal }}>
            <ArkDialog.Root
                open={open}
                defaultOpen={defaultOpen}
                onOpenChange={(details) => onOpenChange?.(details.open)}
                modal={modal}
                closeOnEscape={closeOnEscape}
                closeOnInteractOutside={closeOnInteractOutside}
                lazyMount
                unmountOnExit
            >
                {children}
            </ArkDialog.Root>
        </DialogRootContext.Provider>
    );
}

/** Opens the surrounding Drawer (wraps your own button) */
export function DrawerTrigger({ children }: { children: ReactElement }) {
    return <ArkDialog.Trigger asChild>{children}</ArkDialog.Trigger>;
}

/** Closes the surrounding Drawer (wraps your own button) */
export function DrawerClose({ children }: { children: ReactElement }) {
    return <ArkDialog.CloseTrigger asChild>{children}</ArkDialog.CloseTrigger>;
}

export interface DrawerContentProps extends Omit<ComponentProps<'div'>, 'title'> {
    title: string;
    /** The title only for screen readers – it still names the drawer (e.g. a video in a dialog) */
    hideTitle?: boolean;
    description?: string;
    placement?: DrawerPlacement;
    /**
     * Width (left/right: sm 320px, md 420px, lg 560px, xl 720px) or height (top/bottom: 30–85 % of the screen);
     * `full` covers the whole screen. Without it 420px wide or as high as the content
     */
    size?: OverlaySize;
    /** Floats with a gap to the screen edge and rounded corners */
    offset?: boolean;
    /** Shows the close button in the header */
    closable?: boolean;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Action buttons at the bottom */
    footer?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof drawerRecipe>;
}

/** The panel of a Drawer, sliding in from a side; title, focus trap, Escape closes */
export function DrawerContent({
    classes,
    title,
    hideTitle,
    description,
    placement,
    size,
    offset,
    closable = true,
    closeLabel,
    footer,
    className,
    children,
    ...props
}: DrawerContentProps) {
    const drawer = useRecipe('drawer', drawerRecipe, classes);
    const translations = useTranslations();
    const { modal } = useContext(DialogRootContext);
    const styles = drawer({ placement, size, offset, hideTitle });

    return (
        <Portal>
            {modal && <ArkDialog.Backdrop className={styles.backdrop()} />}
            <ArkDialog.Positioner className={styles.positioner()}>
                <ArkDialog.Content {...props} className={styles.content({ class: className })}>
                    <div className={styles.header()}>
                        <div className={styles.text()}>
                            <ArkDialog.Title className={styles.title()}>{title}</ArkDialog.Title>
                            {description && (
                                <ArkDialog.Description className={styles.description()}>
                                    {description}
                                </ArkDialog.Description>
                            )}
                        </div>
                        {closable && (
                            <ArkDialog.CloseTrigger
                                className={styles.close()}
                                aria-label={closeLabel ?? translations.common.close}
                            >
                                <X className={styles.closeIcon()} aria-hidden="true" />
                            </ArkDialog.CloseTrigger>
                        )}
                    </div>
                    <div className={styles.body()}>{children}</div>
                    {footer && <div className={styles.footer()}>{footer}</div>}
                </ArkDialog.Content>
            </ArkDialog.Positioner>
        </Portal>
    );
}
