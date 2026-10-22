import { banner, type BannerPosition, type BannerVariant } from '@wirecore/wirelayer-recipes/native';
import { CircleAlert, CircleCheck, Info, Megaphone, TriangleAlert, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';

const icons = { info: Info, success: CircleCheck, warn: TriangleAlert, danger: CircleAlert, neutral: Megaphone };

export interface BannerProps extends ViewProps {
    variant?: BannerVariant;
    /** Bold text before the message */
    title?: string;
    /** `inline` (default) in the layout, `top`/`bottom` over that edge of the screen */
    position?: BannerPosition;
    /** Shows a close button */
    dismissible?: boolean;
    /** Controlled visibility */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** The close button was pressed – e.g. to remember the dismissal in the app's storage */
    onDismiss?: () => void;
    /** Own icon component instead of the one of the variant */
    icon?: IconComponent;
    hideIcon?: boolean;
    /** Accessible name of the close button (default "Dismiss notice") */
    dismissLabel?: string;
    /** Buttons after the message */
    actions?: ReactNode;
    className?: string;
    /** The message */
    children?: ReactNode;
}

/**
 * Notice across the screen or above the content, e.g. maintenance or a missing confirmation: the text is a live
 * region (danger: alert, else status). Without `storageKey` of the web – the app remembers the dismissal itself.
 */
export function Banner({
    variant = 'info',
    title,
    position,
    dismissible = false,
    open,
    onOpenChange,
    onDismiss,
    icon,
    hideIcon = false,
    dismissLabel,
    actions,
    className,
    children,
    ...props
}: BannerProps) {
    const translations = useTranslations();
    const [internal, setInternal] = useState(true);
    const styles = banner({ variant, position });
    if (!(open ?? internal)) return null;
    const dismiss = () => {
        setInternal(false);
        onOpenChange?.(false);
        onDismiss?.();
    };
    return (
        <View {...props} className={styles.base({ class: className })}>
            {!hideIcon && <Icon icon={icon ?? icons[variant]} className={styles.icon()} />}
            <View className={styles.content()}>
                <View role={variant === 'danger' ? 'alert' : 'status'}>
                    {title && <Text className={styles.title()}>{title}</Text>}
                    {typeof children === 'string' ? <Text className={styles.message()}>{children}</Text> : children}
                </View>
                {!!actions && <View className={styles.actions()}>{actions}</View>}
            </View>
            {dismissible && (
                <Pressable
                    role="button"
                    aria-label={dismissLabel ?? translations.banner.dismiss}
                    className={styles.dismiss()}
                    onPress={dismiss}
                >
                    <Icon icon={X} className={styles.dismissIcon()} />
                </Pressable>
            )}
        </View>
    );
}
