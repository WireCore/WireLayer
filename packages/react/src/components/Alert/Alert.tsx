import {
    alert as alertRecipe,
    createPausableTimer,
    type AlertStatus,
    type AlertVariant,
    type PausableTimer,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { CircleCheck, Info, OctagonX, TriangleAlert, X } from 'lucide-react';
import { useEffect, useRef, type ComponentProps, type FocusEvent, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface AlertProps extends Omit<ComponentProps<'div'>, 'title'> {
    status?: AlertStatus;
    /** `box` (default) or `simple`: only icon and text in the status colour, e.g. for a field error */
    variant?: AlertVariant;
    size?: 'sm' | 'md';
    title?: ReactNode;
    /** Shows a close button that calls `onDismiss` */
    dismissible?: boolean;
    /** Accessible name of the close button */
    dismissLabel?: string;
    /**
     * Calls `onDismiss` after this many milliseconds. The time pauses while the pointer is over the alert or the
     * focus is in it (WCAG 2.2.1); prefer `dismissible` for messages people need to read
     */
    duration?: number;
    onDismiss?: () => void;
    /** Buttons in the message, e.g. "Unlock" or "Reconnect" – beside the text, below it when there is little room */
    actions?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof alertRecipe>;
}

const icons = { neutral: Info, success: CircleCheck, info: Info, warn: TriangleAlert, danger: OctagonX };

/** Message box with status colour, icon, title and text; role="alert" for errors and warnings, optionally dismissible */
export function Alert({
    classes,
    status = 'info',
    variant,
    size,
    title,
    dismissible = false,
    dismissLabel,
    duration,
    onDismiss,
    actions,
    className,
    children,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...props
}: AlertProps) {
    const alert = useRecipe('alert', alertRecipe, classes);
    const translations = useTranslations();
    const styles = alert({ status, variant, size, hasActions: !!actions });
    const Icon = icons[status];

    // Auto-dismiss: paused while hovered or focused
    const timer = useRef<PausableTimer | undefined>(undefined);
    const paused = useRef({ hovered: false, focused: false });
    const dismiss = useRef(onDismiss);
    useEffect(() => {
        dismiss.current = onDismiss;
    });
    useEffect(() => {
        if (!duration) return;
        const current = createPausableTimer(() => dismiss.current?.(), duration);
        if (paused.current.hovered || paused.current.focused) current.pause();
        timer.current = current;
        return () => current.clear();
    }, [duration]);
    const update = () =>
        paused.current.hovered || paused.current.focused ? timer.current?.pause() : timer.current?.resume();

    return (
        <div
            {...props}
            className={styles.base({ class: className })}
            role={status === 'danger' || status === 'warn' ? 'alert' : 'status'}
            onMouseEnter={(event) => {
                paused.current.hovered = true;
                update();
                onMouseEnter?.(event);
            }}
            onMouseLeave={(event) => {
                paused.current.hovered = false;
                update();
                onMouseLeave?.(event);
            }}
            onFocus={(event) => {
                paused.current.focused = true;
                update();
                onFocus?.(event);
            }}
            onBlur={(event: FocusEvent<HTMLDivElement>) => {
                paused.current.focused = event.currentTarget.contains(event.relatedTarget as Node | null);
                update();
                onBlur?.(event);
            }}
        >
            <span className={styles.iconBox()}>
                <Icon className={styles.icon()} aria-hidden="true" />
            </span>
            {actions ? (
                // With actions: the texts in their own column, the buttons beside them
                <div className={styles.content()}>
                    <div className={styles.text()}>
                        {title && <div className={styles.title()}>{title}</div>}
                        {children && <div className={styles.description()}>{children}</div>}
                    </div>
                    <div className={styles.actions()}>{actions}</div>
                </div>
            ) : (
                <div className={styles.content()}>
                    {title && <div className={styles.title()}>{title}</div>}
                    {children && <div className={styles.description()}>{children}</div>}
                </div>
            )}
            {dismissible && (
                <button
                    type="button"
                    className={styles.dismiss()}
                    aria-label={dismissLabel ?? translations.common.close}
                    onClick={onDismiss}
                >
                    <X className={styles.dismissIcon()} aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
