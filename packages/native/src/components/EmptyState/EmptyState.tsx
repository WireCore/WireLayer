import { emptyState } from '@wirecore/wirelayer-recipes/native';
import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';

export interface EmptyStateProps extends ViewProps {
    title: string;
    /** Text below the title */
    description?: ReactNode;
    /** Icon component above the title */
    icon?: IconComponent;
    /** `dashed`: dashed frame, e.g. an empty upload area */
    variant?: 'plain' | 'dashed';
    size?: 'sm' | 'md';
    /** The title becomes a heading of this level (without it plain text) */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Buttons for the next step */
    actions?: ReactNode;
    className?: string;
}

/** Placeholder for an empty list or search: icon, title, text and the next step */
export function EmptyState({
    title,
    description,
    icon,
    variant,
    size,
    headingLevel,
    actions,
    className,
    ...props
}: EmptyStateProps) {
    const styles = emptyState({ variant, size });
    return (
        <View {...props} className={styles.base({ class: className })}>
            {icon && (
                <View className={styles.iconBox()} aria-hidden>
                    <Icon icon={icon} className={styles.icon()} />
                </View>
            )}
            <Text
                {...(headingLevel ? { role: 'heading' as const, 'aria-level': headingLevel } : {})}
                className={styles.title()}
            >
                {title}
            </Text>
            {typeof description === 'string' ? (
                <Text className={styles.description()}>{description}</Text>
            ) : (
                description
            )}
            {!!actions && <View className={styles.actions()}>{actions}</View>}
        </View>
    );
}
