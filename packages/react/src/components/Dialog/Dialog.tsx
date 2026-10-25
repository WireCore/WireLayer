import { Dialog as ArkDialog, useDialogContext } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import {
    clampDialogOffset,
    dialog as dialogRecipe,
    dialogMoveForKey,
    dialogMoveKeys,
    type DialogPosition,
    type DialogStatus,
    type OverlaySize,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Maximize2, Minimize2, X } from 'lucide-react';
import {
    createContext,
    useContext,
    useRef,
    useState,
    type ComponentProps,
    type KeyboardEvent,
    type PointerEvent,
    type ReactElement,
    type ReactNode,
} from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** Settings of the surrounding Dialog/Drawer that its content needs (no backdrop when non-modal) */
export const DialogRootContext = createContext<{ modal: boolean }>({ modal: true });

export interface DialogProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** "alertdialog" for confirmations that interrupt the user */
    role?: 'dialog' | 'alertdialog';
    /**
     * `false`: non-modal – no backdrop, no focus trap, no scroll lock; the page stays usable next to the dialog
     * (role="dialog" with aria-modal="false")
     */
    modal?: boolean;
    /** Escape closes the dialog */
    closeOnEscape?: boolean;
    /** A click outside closes the dialog – by default for modal dialogs, not for alertdialogs and non-modal ones */
    closeOnInteractOutside?: boolean;
    children: ReactNode;
}

/** Ark handles focus trap, aria-modal, Escape, scroll lock and returning focus to the trigger */
export function Dialog({
    open,
    defaultOpen,
    onOpenChange,
    role = 'dialog',
    modal = true,
    closeOnEscape = true,
    closeOnInteractOutside,
    children,
}: DialogProps) {
    return (
        <DialogRootContext.Provider value={{ modal }}>
            <ArkDialog.Root
                open={open}
                defaultOpen={defaultOpen}
                onOpenChange={(details) => onOpenChange?.(details.open)}
                role={role}
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

/** Opens the surrounding Dialog (wraps your own button) */
export function DialogTrigger({ children }: { children: ReactElement }) {
    return <ArkDialog.Trigger asChild>{children}</ArkDialog.Trigger>;
}

/** Closes the surrounding Dialog (wraps your own button) */
export function DialogClose({ children }: { children: ReactElement }) {
    return <ArkDialog.CloseTrigger asChild>{children}</ArkDialog.CloseTrigger>;
}

/**
 * Moves a dialog by dragging its header (pointer) or with Alt + arrow keys anywhere inside it (keyboard).
 * The offset is a `translate` on the content; it stays on screen and resets when the dialog closes.
 */
function useDialogDrag(enabled: boolean, open: boolean) {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const drag = useRef<{
        id: number;
        x: number;
        y: number;
        origin: { x: number; y: number };
        content: HTMLElement;
    } | null>(null);
    // A reopened dialog starts in its place again
    const [wasOpen, setWasOpen] = useState(open);
    if (wasOpen !== open) {
        setWasOpen(open);
        if (!open) setOffset({ x: 0, y: 0 });
    }

    const moveTo = (next: { x: number; y: number }, content: HTMLElement, current: { x: number; y: number }) => {
        const rect = content.getBoundingClientRect();
        const base = { x: rect.x - current.x, y: rect.y - current.y, width: rect.width, height: rect.height };
        setOffset(clampDialogOffset(next, base, { width: innerWidth, height: innerHeight }));
    };
    const header = {
        onPointerDown(event: PointerEvent<HTMLElement>) {
            // Buttons in the header (close, maximize) keep working
            if (!enabled || event.button !== 0 || (event.target as Element).closest('button, a, input')) return;
            const content = event.currentTarget.closest<HTMLElement>('[data-part=content]');
            if (!content) return;
            drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, origin: offset, content };
            event.currentTarget.setPointerCapture?.(event.pointerId);
            event.preventDefault();
        },
        onPointerMove(event: PointerEvent<HTMLElement>) {
            const current = drag.current;
            if (!current || event.pointerId !== current.id) return;
            moveTo(
                { x: current.origin.x + event.clientX - current.x, y: current.origin.y + event.clientY - current.y },
                current.content,
                offset
            );
        },
        onPointerUp() {
            drag.current = null;
        },
        onPointerCancel() {
            drag.current = null;
        },
    };
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!enabled) return;
        const move = dialogMoveForKey(event);
        if (!move) return;
        event.preventDefault();
        moveTo({ x: offset.x + move.x, y: offset.y + move.y }, event.currentTarget, offset);
    };
    /** Only set once moved, so an unmoved dialog has no style attribute */
    const style = enabled && (offset.x || offset.y) ? { translate: `${offset.x}px ${offset.y}px` } : undefined;
    return { header, onKeyDown, style };
}

export interface DialogContentProps extends Omit<ComponentProps<'div'>, 'title'> {
    title: string;
    description?: string;
    /** Icon component in the coloured box at the top */
    icon?: IconComponent;
    status?: DialogStatus;
    /**
     * Maximum width: sm 320px (20rem), md 400px (25rem, default), lg 560px (35rem), xl 800px (50rem), full (screen
     * width minus the margin). Another width: leave out `size` and set the CSS variable, e.g.
     * style="--wc-dialog-w: 36rem"
     */
    size?: OverlaySize;
    /** Where the dialog sits: centred (default), at the top/bottom or the start/end edge */
    position?: DialogPosition;
    /** Covers the whole screen */
    fullscreen?: boolean;
    /** Button in the header that switches between the normal size and the whole screen */
    maximizable?: boolean;
    /** Maximized state of a maximizable dialog (controlled) */
    maximized?: boolean;
    defaultMaximized?: boolean;
    onMaximizedChange?: (maximized: boolean) => void;
    /** Moved by dragging the header; the keyboard moves it with Alt + arrow keys (Shift: larger steps) */
    draggable?: boolean;
    /** Shows the close button in the header */
    closable?: boolean;
    /** `inside`: only the body scrolls, header and footer stay in place; `outside` (default): the whole dialog scrolls */
    scrollBehavior?: 'inside' | 'outside';
    /** Full width on small screens (below 640px) */
    responsive?: boolean;
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Accessible names of the maximize button: maximize / restore */
    maximizeLabel?: string;
    restoreLabel?: string;
    /** Action buttons at the bottom */
    footer?: ReactNode;
    /** Element the dialog is rendered into (default: the page body) – e.g. an element in full-screen mode */
    portalTarget?: HTMLElement | null;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dialogRecipe>;
}

/** The modal window of a Dialog: title, description, focus trap, Escape closes */
export function DialogContent({
    classes,
    title,
    description,
    icon: Icon,
    status,
    size,
    position,
    fullscreen,
    maximizable,
    maximized,
    defaultMaximized,
    onMaximizedChange,
    draggable,
    closable = true,
    scrollBehavior,
    responsive = true,
    closeLabel,
    maximizeLabel,
    restoreLabel,
    footer,
    portalTarget,
    className,
    style,
    onKeyDown,
    children,
    ...props
}: DialogContentProps) {
    const dialog = useRecipe('dialog', dialogRecipe, classes);
    const translations = useTranslations();
    const { modal } = useContext(DialogRootContext);
    const context = useDialogContext();
    const [internalMaximized, setInternalMaximized] = useState(defaultMaximized ?? false);
    const isMaximized = maximized ?? internalMaximized;
    const toggleMaximized = () => {
        setInternalMaximized(!isMaximized);
        onMaximizedChange?.(!isMaximized);
    };
    const canDrag = !!draggable && !isMaximized && !fullscreen;
    const drag = useDialogDrag(canDrag, context.open);
    const styles = dialog({
        status,
        size,
        position,
        scrollBehavior,
        fullscreen: fullscreen || isMaximized,
        responsive,
        draggable: draggable && !isMaximized,
        maximizable,
    });
    const MaximizeIcon = isMaximized ? Minimize2 : Maximize2;

    return (
        <Portal {...(portalTarget ? { container: { current: portalTarget } } : {})}>
            {modal && <ArkDialog.Backdrop className={styles.backdrop()} />}
            <ArkDialog.Positioner className={styles.positioner()}>
                <ArkDialog.Content
                    {...props}
                    {...(draggable ? { 'aria-keyshortcuts': dialogMoveKeys } : {})}
                    className={styles.content({ class: className })}
                    style={drag.style ? { ...style, ...drag.style } : style}
                    onKeyDown={(event) => {
                        onKeyDown?.(event);
                        if (draggable) drag.onKeyDown(event);
                    }}
                >
                    <div className={styles.header()} {...(draggable ? drag.header : {})}>
                        {Icon && (
                            <span className={styles.iconBox()}>
                                <Icon className={styles.icon()} aria-hidden="true" />
                            </span>
                        )}
                        {maximizable && (
                            <button
                                type="button"
                                className={styles.maximize()}
                                aria-label={
                                    isMaximized
                                        ? (restoreLabel ?? translations.dialog.restore)
                                        : (maximizeLabel ?? translations.dialog.maximize)
                                }
                                onClick={toggleMaximized}
                            >
                                <MaximizeIcon className={styles.maximizeIcon()} aria-hidden="true" />
                            </button>
                        )}
                        {closable && (
                            <ArkDialog.CloseTrigger
                                className={styles.close()}
                                aria-label={closeLabel ?? translations.common.close}
                            >
                                <X className={styles.closeIcon()} aria-hidden="true" />
                            </ArkDialog.CloseTrigger>
                        )}
                    </div>
                    <div className={styles.body()}>
                        <ArkDialog.Title className={styles.title()}>{title}</ArkDialog.Title>
                        {description && (
                            <ArkDialog.Description className={styles.description()}>
                                {description}
                            </ArkDialog.Description>
                        )}
                        {children}
                    </div>
                    {footer && <div className={styles.footer()}>{footer}</div>}
                </ArkDialog.Content>
            </ArkDialog.Positioner>
        </Portal>
    );
}
