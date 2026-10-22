import { chatDetails } from '@wirecore/wirelayer-recipes/native';
import { CircleCheck, CircleX, Wrench } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { ChatDetails } from './ChatDetails.js';

export interface ChatToolCallProps extends Omit<ViewProps, 'children'> {
    /** Name of the tool, e.g. "Get weather" */
    name: string;
    /** running, done or error – shown as icon and text */
    status?: 'running' | 'done' | 'error';
    /** Arguments of the call (objects are shown as JSON) */
    input?: unknown;
    /** Result of the call (objects are shown as JSON) */
    output?: unknown;
    /** Open at first */
    defaultOpen?: boolean;
    /** More content inside */
    children?: ReactNode;
    className?: string;
}

const icons = { running: Wrench, done: CircleCheck, error: CircleX };
const show = (value: unknown) =>
    typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? String(value));

/** A tool call of an assistant: name and status on the button (aria-expanded), arguments and result inside */
export function ChatToolCall({
    name,
    status = 'done',
    input,
    output,
    defaultOpen,
    children,
    ...props
}: ChatToolCallProps) {
    const t = useTranslations().chatToolCall;
    const styles = chatDetails();
    const block = (label: string, value: unknown) => (
        <>
            <Text className={styles.label()}>{label}</Text>
            <View className={styles.pre()}>
                <Text selectable className={styles.preText()}>
                    {show(value)}
                </Text>
            </View>
        </>
    );
    const content =
        input !== undefined || output !== undefined || !!children ? (
            <>
                {input !== undefined && block(t.input, input)}
                {output !== undefined && block(t.output, output)}
                {children}
            </>
        ) : undefined;
    return (
        <ChatDetails
            {...props}
            title={t.title(name)}
            icon={icons[status]}
            running={status === 'running'}
            status={status}
            badge={t.status[status]}
            defaultOpen={defaultOpen}
        >
            {content}
        </ChatDetails>
    );
}
