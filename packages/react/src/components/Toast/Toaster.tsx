import { Toast, Toaster as ArkToaster } from '@ark-ui/react/toast';
import { isSwipeDismiss, toast as toastRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert, X } from 'lucide-react';
import { useState, type PointerEvent, type ReactNode } from 'react';
import { toaster as appToaster, type ToasterOptions } from './toaster.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ToasterProps {
    /** A toaster from createToaster() – without it the app-wide one of toast() */
    toaster?: typeof appToaster;
    /** Where the toasts appear (default bottom-end) – also for the app-wide toaster of toast() */
    placement?: ToasterOptions['placement'];
    /** Toasts shown at once (default 5); more wait in a queue */
    max?: number;
    /** Toasts lie on top of each other and fan out on hover or focus (instead of a list) */
    overlap?: boolean;
    /** Space between the toasts in px (default 12) */
    gap?: number;
    /** Accessible name of the notification region */
    label?: string;
    /** Accessible name of each toast's close button */
    closeLabel?: string;
    /** Thin bar at the bottom that shows the remaining time (decorative; stops while paused) */
    showProgress?: boolean;
    /** Toasts can be swiped away sideways (touch, pen and mouse); the close button stays */
    swipeToDismiss?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof toastRecipe>;
}

const icons = { success: CircleCheck, info: Info, warning: TriangleAlert, error: OctagonX };

/** Placement, max, overlap and gap go into the toaster before its region is created (Ark reads them from there) */
function configure(toaster: typeof appToaster, options: ToasterOptions) {
    for (const [key, value] of Object.entries(options))
        if (value !== undefined) Object.assign(toaster.attrs, { [key]: value });
}

/** Root of one toast; swiping: it follows the pointer sideways and closes when let go far enough */
function ToastRoot({
    className,
    swipeable,
    onDismiss,
    children,
}: {
    className: string;
    swipeable: boolean;
    onDismiss: () => void;
    children: ReactNode;
}) {
    const [swipe, setSwipe] = useState({ start: 0, distance: 0, active: false });
    const handlers = swipeable
        ? {
              style: swipe.distance
                  ? {
                        translate: `calc(var(--x) + ${swipe.distance}px) var(--y)`,
                        ...(swipe.active ? { transition: 'none' } : {}),
                    }
                  : undefined,
              onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
                  if (event.button !== 0 || (event.target as Element).closest('button')) return;
                  setSwipe({ start: event.clientX, distance: 0, active: true });
                  event.currentTarget.setPointerCapture?.(event.pointerId);
              },
              onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
                  if (swipe.active) setSwipe({ ...swipe, distance: event.clientX - swipe.start });
              },
              onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
                  if (!swipe.active) return;
                  const dismissed = isSwipeDismiss(swipe.distance, event.currentTarget.offsetWidth);
                  setSwipe({ ...swipe, active: false, distance: dismissed ? swipe.distance : 0 });
                  if (dismissed) onDismiss();
              },
              onPointerCancel: () => setSwipe({ start: 0, distance: 0, active: false }),
          }
        : {};
    return (
        <Toast.Root className={className} {...handlers}>
            {children}
        </Toast.Root>
    );
}

/** Place once in the app; show toasts with toast({ title, description, type, action }) */
export function Toaster({
    classes,
    toaster = appToaster,
    label,
    closeLabel,
    showProgress,
    swipeToDismiss,
    placement,
    max,
    overlap,
    gap,
}: ToasterProps) {
    configure(toaster, { placement, max, overlap, gap });
    const toast = useRecipe('toast', toastRecipe, classes);
    const styles = toast({ showProgress, swipeable: swipeToDismiss });
    const translations = useTranslations();
    return (
        // A new region when they change (the toasts stay)
        <ArkToaster key={`${placement}|${overlap}|${gap}`} toaster={toaster} label={label ?? translations.toast.label}>
            {(item) => {
                const Icon = item.type && item.type in icons ? icons[item.type as keyof typeof icons] : undefined;
                return (
                    <ToastRoot
                        className={styles.root()}
                        swipeable={!!swipeToDismiss && !!item.id}
                        onDismiss={() => toaster.dismiss(item.id)}
                    >
                        {item.type === 'loading' ? (
                            <LoaderCircle className={styles.spinner()} aria-hidden="true" />
                        ) : (
                            Icon && <Icon className={styles.icon()} aria-hidden="true" />
                        )}
                        <div className={styles.text()}>
                            <Toast.Title className={styles.title()}>{item.title}</Toast.Title>
                            {item.description && (
                                <Toast.Description className={styles.description()}>
                                    {item.description}
                                </Toast.Description>
                            )}
                        </div>
                        {item.action && (
                            <Toast.ActionTrigger className={styles.action()}>{item.action.label}</Toast.ActionTrigger>
                        )}
                        <Toast.CloseTrigger
                            className={styles.close()}
                            aria-label={closeLabel ?? translations.common.close}
                        >
                            <X className={styles.closeIcon()} aria-hidden="true" />
                        </Toast.CloseTrigger>
                        {showProgress && Number.isFinite(item.duration) && (
                            <span className={styles.progress()} aria-hidden="true" />
                        )}
                    </ToastRoot>
                );
            }}
        </ArkToaster>
    );
}
