import { visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';

/**
 * Live announcements: iOS and Android read the text through AccessibilityInfo; react-native-web has no
 * announceForAccessibility, so the web gets a hidden polite live region – render `region` once in the component.
 */
export function useAnnouncer() {
    const [message, setMessage] = useState('');
    const announce = useCallback((text: string) => {
        if (!text) return;
        if (Platform.OS === 'web') {
            // The same text twice in a row is a change, too
            setMessage((current) => (current === text ? `${text}\u00a0` : text));
        } else {
            AccessibilityInfo.announceForAccessibility(text);
        }
    }, []);
    const region =
        Platform.OS === 'web' ? (
            <Text role="status" aria-live="polite" className={visuallyHidden()}>
                {message}
            </Text>
        ) : null;
    return { announce, region };
}
