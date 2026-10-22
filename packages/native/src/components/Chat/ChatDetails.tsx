import { chatDetails } from '@wirecore/wirelayer-recipes/native';
import { ChevronRight, LoaderCircle } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { Loader } from '../../utils/Loader.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';

interface ChatDetailsProps extends Omit<ViewProps, 'children'> {
    title: string;
    icon: IconComponent;
    /** Shows a spinner instead of the icon (a still icon with reduced motion) */
    running?: boolean;
    status?: 'none' | 'running' | 'done' | 'error';
    /** Short text after the title, e.g. the status */
    badge?: string;
    defaultOpen?: boolean;
    /** Content inside – the button only toggles when there is some */
    children?: ReactNode;
    className?: string;
}

/**
 * The disclosure of ChatSources, ChatToolCall and ChatThinking: a button with aria-expanded and the content below
 * (the web uses <details>).
 */
export function ChatDetails({
    title,
    icon,
    running = false,
    status = 'none',
    badge,
    defaultOpen = false,
    children,
    className,
    ...props
}: ChatDetailsProps) {
    const [open, setOpen] = useState(defaultOpen);
    const reducedMotion = useReducedMotion();
    const styles = chatDetails({ open, status });
    return (
        <View {...props} className={styles.base({ class: className })}>
            <Pressable role="button" aria-expanded={open} className={styles.summary()} onPress={() => setOpen(!open)}>
                <Icon icon={ChevronRight} className={styles.chevron()} />
                {running && !reducedMotion ? (
                    <Loader className={styles.icon()} />
                ) : (
                    <Icon icon={running ? LoaderCircle : icon} className={styles.icon()} />
                )}
                <Text className={styles.title()}>{title}</Text>
                {!!badge && <Text className={styles.badge()}>{badge}</Text>}
            </Pressable>
            {open && !!children && <View className={styles.content()}>{children}</View>}
        </View>
    );
}
