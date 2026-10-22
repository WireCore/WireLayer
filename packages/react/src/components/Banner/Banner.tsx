import {
    banner as bannerRecipe,
    writeStored,
    type BannerPosition,
    type BannerVariant,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { CircleAlert, CircleCheck, Info, Megaphone, TriangleAlert, X } from 'lucide-react';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { parseStored, useStoredText } from '../../storage.js';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface BannerProps extends Omit<ComponentProps<'div'>, 'title'> {
    /** info (default), success, warn, danger or neutral */
    variant?: BannerVariant;
    /** Bold text before the message */
    title?: string;
    /** `inline` (default): in the flow; `top`/`bottom`: fixed to that edge of the window */
    position?: BannerPosition;
    /** Shows a close button */
    dismissible?: boolean;
    /** Controlled visibility */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** The close button was pressed */
    onDismiss?: () => void;
    /** Remembers the dismissal in localStorage under this key – the banner stays hidden on the next visit */
    storageKey?: string;
    /** Own icon instead of the one for the variant */
    icon?: IconComponent;
    hideIcon?: boolean;
    /** Name of the close button (default "Dismiss notice") */
    dismissLabel?: string;
    /** Buttons or links after the message */
    actions?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof bannerRecipe>;
}

const icons: Record<BannerVariant, IconComponent> = {
    info: Info,
    success: CircleCheck,
    warn: TriangleAlert,
    danger: CircleAlert,
    neutral: Megaphone,
};

/**
 * Page-wide notice: message in a live region (role="alert" for danger, else "status"), actions and an optional close
 * button; a dismissal can be remembered (storageKey)
 */
export function Banner({
    classes,
    variant,
    title,
    position,
    dismissible,
    open,
    onOpenChange,
    onDismiss,
    storageKey,
    icon,
    hideIcon,
    dismissLabel,
    actions,
    className,
    children,
    ...props
}: BannerProps) {
    const banner = useRecipe('banner', bannerRecipe, classes);
    const styles = banner({ variant, position });
    const translations = useTranslations();
    const [internal, setInternal] = useState(true);
    // A remembered dismissal is only known in the browser (after the server-rendered first paint)
    const remembered = parseStored(useStoredText(storageKey)) === 'dismissed';
    if (!(open ?? (internal && !remembered))) return null;
    const Icon = icon ?? icons[variant ?? 'info'];
    const dismiss = () => {
        setInternal(false);
        writeStored(storageKey, 'dismissed');
        onOpenChange?.(false);
        onDismiss?.();
    };
    return (
        <div {...props} className={styles.base({ class: className })}>
            {!hideIcon && <Icon className={styles.icon()} aria-hidden="true" />}
            {/* Urgent problems interrupt (alert), everything else is announced politely (status) */}
            <div role={variant === 'danger' ? 'alert' : 'status'} className={styles.content()}>
                {title && <span className={styles.title()}>{title}</span>}
                {children && <span className={styles.message()}>{children}</span>}
            </div>
            {actions && <div className={styles.actions()}>{actions}</div>}
            {dismissible && (
                <button
                    type="button"
                    className={styles.dismiss()}
                    aria-label={dismissLabel ?? translations.banner.dismiss}
                    onClick={dismiss}
                >
                    <X className={styles.dismissIcon()} aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
