import { toggletip } from '@wirecore/wirelayer-recipes/native';
import { Info } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, Text, View, type AccessibilityActionEvent, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { useEscape } from '../../utils/useEscape.js';
import { announce } from '../LiveAnnouncer/LiveAnnouncer.js';

export interface ToggletipProps extends ViewProps {
    /** The explanation (or children) */
    content?: ReactNode;
    /** What it explains – the button is then named "More information about <label>" */
    label?: string;
    /** Own accessible name of the button (instead of the one from `label`) */
    triggerLabel?: string;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Icon component of the button (default Info) */
    icon?: IconComponent;
    className?: string;
    children?: ReactNode;
}

/**
 * Info button that shows an explanation below it on a tap (a tooltip for touch): the explanation sits in a live
 * region and is read when it appears, the focus stays on the button. Another tap, Escape (web) or the screen
 * reader's escape gesture close it.
 */
export function Toggletip({
    content,
    label,
    triggerLabel,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    icon = Info,
    className,
    children,
    ...props
}: ToggletipProps) {
    const translations = useTranslations();
    const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
    const styles = toggletip({ open });
    const body = content ?? children;
    useEscape(open, () => setOpen(false));

    return (
        <View {...props} className={styles.base({ class: className })}>
            <Pressable
                role="button"
                aria-label={
                    triggerLabel ?? (label ? translations.toggletip.labelFor(label) : translations.toggletip.label)
                }
                aria-expanded={open}
                hitSlop={10}
                className={styles.trigger()}
                onPress={() => {
                    // The web reads the live region; iOS and Android get the text announced
                    if (!open && typeof body === 'string' && Platform.OS !== 'web') announce(body);
                    setOpen(!open);
                }}
                accessibilityActions={[{ name: 'escape' }]}
                onAccessibilityAction={(event: AccessibilityActionEvent) => {
                    if (event.nativeEvent.actionName === 'escape') setOpen(false);
                }}
            >
                <Icon icon={icon} className={styles.icon()} />
            </Pressable>
            {/* Always present, so the explanation is announced when it is inserted */}
            <View role="status" className={styles.anchor()} pointerEvents="box-none">
                {open && (
                    <View className={styles.bubble()}>
                        {typeof body === 'string' ? <Text className={styles.text()}>{body}</Text> : body}
                    </View>
                )}
            </View>
        </View>
    );
}
