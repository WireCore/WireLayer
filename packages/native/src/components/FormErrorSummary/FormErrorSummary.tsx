import { formErrorSummary } from '@wirecore/wirelayer-recipes/native';
import { CircleAlert } from 'lucide-react-native';
import { useEffect, useRef, type ComponentRef } from 'react';
import { AccessibilityInfo, Platform, Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { focusControl, focusElement } from '../../utils/focus-registry.js';
import { Icon } from '../../utils/Icon.js';

export interface FormErrorSummaryItem {
    /** Error text, e.g. "Please enter a valid email address" */
    message: string;
    /** Id of the field's control (Field / FormField `id`) – the message leads there */
    id?: string;
}

export interface FormErrorSummaryProps extends ViewProps {
    /** The current errors; nothing is rendered without any */
    errors: FormErrorSummaryItem[];
    /** Heading (default "Please correct 2 entries") */
    title?: string;
    /** Moves the (screen reader) focus to the summary when errors appear and announces it (WCAG 3.3.1) */
    autoFocus?: boolean;
    /** Focuses the summary again whenever this changes while there are errors, e.g. the number of submit attempts */
    focusKey?: unknown;
}

/**
 * List of the form's errors after submitting: it takes the screen reader focus (VoiceOver/TalkBack) and is announced;
 * each message is a button that moves the focus to its field.
 */
export function FormErrorSummary({
    errors,
    title,
    autoFocus = true,
    focusKey,
    className,
    ...props
}: FormErrorSummaryProps) {
    const translations = useTranslations();
    const styles = formErrorSummary();
    // The heading takes the focus – a focusable container would hide the links inside it from VoiceOver
    const heading = useRef<ComponentRef<typeof Text>>(null);
    const count = errors.length;
    const headingText = title ?? translations.formErrorSummary.title(count);
    // Focus and announce when errors appear and whenever focusKey changes while there are errors
    useEffect(() => {
        if (!autoFocus || !count) return;
        // After the layout of the summary, so iOS/Android can focus it
        const timer = setTimeout(() => {
            focusElement(heading.current);
            if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(headingText);
        }, 50);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autoFocus and the text are read when errors appear
    }, [count > 0, focusKey]);

    if (!count) return null;
    return (
        <View role="alert" {...props} className={styles.base({ class: className })}>
            <View className={styles.titleRow()}>
                <Icon icon={CircleAlert} className={styles.icon()} />
                <Text ref={heading} role="heading" {...({ tabIndex: -1 } as object)} className={styles.title()}>
                    {headingText}
                </Text>
            </View>
            <View role="list" className={styles.list()}>
                {errors.map((error, index) => (
                    <View key={error.id ?? index} role="listitem">
                        {error.id ? (
                            <Pressable role="link" className={styles.link()} onPress={() => focusControl(error.id!)}>
                                <Text className={styles.linkText()}>{error.message}</Text>
                            </Pressable>
                        ) : (
                            <Text className={styles.message()}>{error.message}</Text>
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
}
