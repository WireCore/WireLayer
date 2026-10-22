import { result, type ResultStatus } from '@wirecore/wirelayer-recipes/native';
import { CircleCheck, CircleX, Info, SearchX, ServerCrash, ShieldX, TriangleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';

const icons = {
    success: CircleCheck,
    info: Info,
    warn: TriangleAlert,
    error: CircleX,
    '403': ShieldX,
    '404': SearchX,
    '500': ServerCrash,
};

export interface ResultProps extends ViewProps {
    /** success, info, warn, error or an HTTP status (403, 404, 500) */
    status?: ResultStatus;
    /** Default: the text of the status ("Done", "Page not found" …) */
    title?: string;
    /** 403, 404 and 500 bring a default */
    description?: string;
    /** Own icon component */
    icon?: IconComponent;
    /** Level of the title (default 2) */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    /** Buttons for the next step */
    actions?: ReactNode;
    className?: string;
    /** Extra content below, e.g. details */
    children?: ReactNode;
}

/** Outcome of a process or an error screen: icon, heading, text and the next steps */
export function Result({
    status = 'info',
    title,
    description,
    icon,
    headingLevel = 2,
    actions,
    className,
    children,
    ...props
}: ResultProps) {
    const translations = useTranslations();
    const styles = result({ status });
    const texts = translations.result;
    const defaultDescription =
        status === '403'
            ? texts.description403
            : status === '404'
              ? texts.description404
              : status === '500'
                ? texts.description500
                : undefined;
    const text = description ?? defaultDescription;
    return (
        <View {...props} className={styles.base({ class: className })}>
            <View className={styles.iconBox()} aria-hidden>
                <Icon icon={icon ?? icons[status]} className={styles.icon()} />
            </View>
            {/^\d+$/.test(status) && <Text className={styles.code()}>{status}</Text>}
            <Text role="heading" aria-level={headingLevel} className={styles.title()}>
                {title ?? texts[status]}
            </Text>
            {!!text && <Text className={styles.description()}>{text}</Text>}
            {!!actions && <View className={styles.actions()}>{actions}</View>}
            {!!children && <View className={styles.extra()}>{children}</View>}
        </View>
    );
}
