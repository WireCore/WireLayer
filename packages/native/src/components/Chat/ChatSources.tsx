import { chatDetails, sourceHost } from '@wirecore/wirelayer-recipes/native';
import { Link } from 'lucide-react-native';
import { Linking, Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { ChatDetails } from './ChatDetails.js';

/** A source of an answer */
export interface ChatSource {
    title: string;
    href: string;
    /** Short excerpt or description */
    description?: string;
}

export interface ChatSourcesProps extends Omit<ViewProps, 'children'> {
    sources: ChatSource[];
    /** Text of the button (default "3 sources") */
    title?: string;
    /** Open at first */
    defaultOpen?: boolean;
    /** A tap on a source (default: Linking.openURL) */
    onLinkPress?: (href: string) => void;
    className?: string;
}

/** Sources of an answer: a button (aria-expanded) that shows a list of links with their host names */
export function ChatSources({
    sources,
    title,
    defaultOpen,
    onLinkPress = (href) => void Linking.openURL(href),
    ...props
}: ChatSourcesProps) {
    const translations = useTranslations();
    const styles = chatDetails();
    return (
        <ChatDetails
            {...props}
            title={title ?? translations.chatSources.title(sources.length)}
            icon={Link}
            defaultOpen={defaultOpen}
        >
            {sources.length > 0 && (
                <View role="list" className={styles.list()}>
                    {sources.map((source) => (
                        <View key={source.href} role="listitem">
                            <Pressable role="link" className={styles.link()} onPress={() => onLinkPress(source.href)}>
                                <Text className={styles.linkText()}>{source.title}</Text>
                                <Text className={styles.host()}>{sourceHost(source.href)}</Text>
                            </Pressable>
                            {!!source.description && <Text className={styles.description()}>{source.description}</Text>}
                        </View>
                    ))}
                </View>
            )}
        </ChatDetails>
    );
}
