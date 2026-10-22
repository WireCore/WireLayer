import { actionBar } from '@wirecore/wirelayer-recipes/native';
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';

export interface ActionBarProps extends ViewProps {
    /** Number of selected items – the bar shows while it is above 0 */
    count: number;
    /** Shows the bar independently of `count` */
    open?: boolean;
    /** Accessible name of the toolbar (default "Actions for the selection") */
    label?: string;
    /** Accessible name of the clear button (default "Clear selection") */
    clearLabel?: string;
    /** `fixed` (default) floats above the bottom of the screen, `inline` stays in the layout */
    placement?: 'fixed' | 'inline';
    /** Clears the selection – shows the clear button */
    onClear?: () => void;
    className?: string;
    /** The actions, e.g. Buttons or IconButtons */
    children?: ReactNode;
}

/** Bar with the actions for selected items (e.g. in a list): the count is announced when it changes */
export function ActionBar({
    count,
    open,
    label,
    clearLabel,
    placement,
    onClear,
    className,
    children,
    ...props
}: ActionBarProps) {
    const translations = useTranslations();
    const styles = actionBar({ placement });
    if (!(open ?? count > 0)) return null;
    return (
        <View
            role="toolbar"
            aria-label={label ?? translations.actionBar.label}
            {...props}
            className={styles.base({ class: className })}
        >
            <Text role="status" className={styles.count()}>
                {translations.common.selectedCount(count)}
            </Text>
            <View className={styles.actions()}>{children}</View>
            {onClear && (
                <>
                    <View className={styles.separator()} aria-hidden />
                    <Pressable
                        role="button"
                        aria-label={clearLabel ?? translations.actionBar.clear}
                        className={styles.clear()}
                        onPress={onClear}
                    >
                        <Icon icon={X} className={styles.clearIcon()} />
                    </Pressable>
                </>
            )}
        </View>
    );
}
