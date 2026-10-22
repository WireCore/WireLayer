import { pageHeader, type BadgeVariant } from '@wirecore/wirelayer-recipes/native';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { Badge } from '../Badge/Badge.js';

export interface PageHeaderProps extends ViewProps {
    title: string;
    /** Level of the heading (default 1) */
    headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
    subtitle?: string;
    /** Shows a back button above the title */
    onBack?: () => void;
    /** Text of the back button (default "Back") */
    backLabel?: string;
    /** Status as a badge next to the title */
    status?: string;
    statusVariant?: BadgeVariant;
    /** `sm` for dialogs and panels */
    size?: 'sm' | 'md';
    /** Line below */
    divided?: boolean;
    /** Breadcrumb above the title */
    breadcrumb?: ReactNode;
    /** Facts below the title, e.g. date and owner */
    meta?: ReactNode;
    /** Buttons next to the title */
    actions?: ReactNode;
    /** Tabs below */
    tabs?: ReactNode;
    className?: string;
}

/** Heading of a screen with back button, status, facts, actions and tabs */
export function PageHeader({
    title,
    headingLevel = 1,
    subtitle,
    onBack,
    backLabel,
    status,
    statusVariant,
    size,
    divided,
    breadcrumb,
    meta,
    actions,
    tabs,
    className,
    ...props
}: PageHeaderProps) {
    const translations = useTranslations();
    const styles = pageHeader({ size, divided });
    return (
        <View {...props} className={styles.base({ class: className })}>
            {breadcrumb}
            {onBack && (
                <Pressable role="button" className={styles.back()} onPress={onBack}>
                    <Icon icon={ChevronLeft} className={styles.backIcon()} />
                    <Text className={styles.backLabel()}>{backLabel ?? translations.pageHeader.back}</Text>
                </Pressable>
            )}
            <View className={styles.row()}>
                <View className={styles.headings()}>
                    <View className={styles.titleRow()}>
                        <Text role="heading" aria-level={headingLevel} className={styles.title()}>
                            {title}
                        </Text>
                        {!!status && <Badge variant={statusVariant}>{status}</Badge>}
                    </View>
                    {!!subtitle && <Text className={styles.subtitle()}>{subtitle}</Text>}
                </View>
                {!!actions && <View className={styles.actions()}>{actions}</View>}
            </View>
            {!!meta && <View className={styles.meta()}>{meta}</View>}
            {!!tabs && <View className={styles.tabs()}>{tabs}</View>}
        </View>
    );
}
