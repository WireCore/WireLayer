import { badge, type BadgeVariant } from '@wirecore/wirelayer-recipes/native';
import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';

export interface BadgeProps extends ViewProps {
    variant?: BadgeVariant;
    /** Icon component rendered before the text */
    icon?: IconComponent;
    /** Round shape for a count or a single character (grows into a pill for longer content) */
    circle?: boolean;
    children?: ReactNode;
}

/** Small label for a state or count, optionally with an icon or round (`circle`) */
export function Badge({ variant, icon, circle, className, children, ...props }: BadgeProps) {
    const styles = badge({ variant, circle });

    return (
        <View {...props} className={styles.base({ class: className })}>
            {icon && <Icon icon={icon} className={styles.icon()} />}
            {typeof children === 'string' ? <Text className={styles.label()}>{children}</Text> : children}
        </View>
    );
}
