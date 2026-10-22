import { chatDetails } from '@wirecore/wirelayer-recipes/native';
import { Brain } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { ChatDetails } from './ChatDetails.js';

export interface ChatThinkingProps extends Omit<ViewProps, 'children'> {
    /** Still thinking: "Thinking …" with a spinner, aria-busy */
    active?: boolean;
    /** The reasoning (plain text; children replace it) */
    text?: string;
    /** Seconds it took – shown when done */
    duration?: number;
    /** Open at first */
    defaultOpen?: boolean;
    children?: ReactNode;
    className?: string;
}

/** The reasoning of an answer: collapsed by default, "Thinking …" while it is being written */
export function ChatThinking({ active = false, text, duration, defaultOpen, children, ...props }: ChatThinkingProps) {
    const t = useTranslations().chatThinking;
    const styles = chatDetails();
    return (
        <ChatDetails
            {...props}
            aria-busy={active || undefined}
            title={active ? t.active : t.done}
            icon={Brain}
            running={active}
            status={active ? 'running' : 'none'}
            badge={!active && duration !== undefined ? t.duration(duration) : undefined}
            defaultOpen={defaultOpen}
        >
            {children ?? (text ? <Text className={styles.text()}>{text}</Text> : undefined)}
        </ChatDetails>
    );
}
