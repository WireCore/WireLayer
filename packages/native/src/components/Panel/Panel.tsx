import { panel } from '@wirecore/wirelayer-recipes/native';
import { ChevronDown } from 'lucide-react-native';
import { useId, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';

export interface PanelProps extends ViewProps {
    title: string;
    /** Level of the heading (default 3) */
    headingLevel?: 2 | 3 | 4;
    /** The heading opens and closes the content */
    toggleable?: boolean;
    open?: boolean;
    /** Open at the start (default true) */
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Buttons in the header, beside the heading */
    actions?: ReactNode;
    /** Bar at the bottom */
    footer?: ReactNode;
    className?: string;
    children?: ReactNode;
}

/** Framed section with a heading, actions and footer; with `toggleable` the heading opens and closes it */
export function Panel({
    title,
    headingLevel = 3,
    toggleable = false,
    open: openProp,
    defaultOpen = true,
    onOpenChange,
    actions,
    footer,
    className,
    children,
    ...props
}: PanelProps) {
    const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
    const shown = !toggleable || open;
    const styles = panel({ open: shown });
    const contentId = `${useId()}content`;
    return (
        <View {...props} className={styles.base({ class: className })}>
            <View className={styles.header()}>
                <View
                    role="heading"
                    aria-level={headingLevel}
                    className={toggleable ? styles.toggle() : styles.title()}
                >
                    {toggleable ? (
                        <Pressable
                            role="button"
                            aria-expanded={open}
                            {...({ 'aria-controls': open ? contentId : undefined } as object)}
                            className={styles.toggle()}
                            onPress={() => setOpen(!open)}
                        >
                            <Icon icon={ChevronDown} className={styles.chevron()} />
                            <Text className={styles.title()}>{title}</Text>
                        </Pressable>
                    ) : (
                        <Text className={styles.title()}>{title}</Text>
                    )}
                </View>
                {!!actions && <View className={styles.actions()}>{actions}</View>}
            </View>
            {shown && (
                <>
                    <View nativeID={contentId} className={styles.body()}>
                        {children}
                    </View>
                    {!!footer && <View className={styles.footer()}>{footer}</View>}
                </>
            )}
        </View>
    );
}
