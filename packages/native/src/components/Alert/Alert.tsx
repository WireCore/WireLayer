import { alert, type AlertStatus, type AlertVariant } from '@wirecore/wirelayer-recipes/native';
import { CircleCheck, Info, OctagonX, TriangleAlert, X } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon } from '../../utils/Icon.js';
import { useTranslations } from '../../locale.js';

export interface AlertProps extends ViewProps {
    status?: AlertStatus;
    /** `box` (default) or `simple`: only icon and text in the status colour, e.g. for a field error */
    variant?: AlertVariant;
    size?: 'sm' | 'md';
    title?: ReactNode;
    /** Shows a close button that calls `onDismiss` */
    dismissible?: boolean;
    /** Accessible name of the close button */
    dismissLabel?: string;
    onDismiss?: () => void;
    /** Calls `onDismiss` after this many milliseconds */
    duration?: number;
    /** Buttons in the message, e.g. "Unlock" or "Reconnect" – below the text */
    actions?: ReactNode;
    children?: ReactNode;
}

const icons = { neutral: Info, success: CircleCheck, info: Info, warn: TriangleAlert, danger: OctagonX };

/** Message box with status icon and colour, title and text; announced when it appears (alert for warn/danger, status otherwise) */
export function Alert({
    status = 'info',
    variant,
    size,
    title,
    dismissible = false,
    dismissLabel,
    onDismiss,
    duration,
    actions,
    className,
    children,
    ...props
}: AlertProps) {
    const translations = useTranslations();
    const styles = alert({ status, variant, size });
    useEffect(() => {
        if (!duration || !onDismiss) return;
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [duration, onDismiss]);
    const urgent = status === 'danger' || status === 'warn';

    // Announced when it appears: assertive for warnings and errors, polite otherwise
    return (
        <View
            {...props}
            className={styles.base({ class: className })}
            role={urgent ? 'alert' : 'status'}
            aria-live={urgent ? 'assertive' : 'polite'}
        >
            <View className={styles.iconBox()}>
                <Icon icon={icons[status]} className={styles.icon()} />
            </View>
            <View className={styles.content()}>
                {title && <Text className={styles.title()}>{title}</Text>}
                {children &&
                    (typeof children === 'string' ? (
                        <Text className={styles.description()}>{children}</Text>
                    ) : (
                        children
                    ))}
                {actions && <View className={styles.actions()}>{actions}</View>}
            </View>
            {dismissible && (
                <Pressable
                    role="button"
                    className={styles.dismiss()}
                    aria-label={dismissLabel ?? translations.common.close}
                    onPress={onDismiss}
                >
                    <Icon icon={X} className={styles.dismissIcon()} />
                </Pressable>
            )}
        </View>
    );
}
