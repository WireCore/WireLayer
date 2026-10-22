import { announcer, visuallyHidden, type AnnounceOptions } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Text, View } from 'react-native';

export type { AnnounceOptions, Politeness } from '@wirecore/wirelayer-recipes/native';

/**
 * Reads a text to screen reader users, e.g. "3 entries deleted": iOS and Android through AccessibilityInfo
 * (assertive interrupts the current speech on iOS), the web through a live region – the one of <LiveAnnouncer>,
 * else one at the end of the page.
 */
export function announce(text: string, options: AnnounceOptions = {}) {
    if (!text) return;
    if (Platform.OS === 'web') {
        announcer.announce(text, options);
        return;
    }
    if (Platform.OS === 'ios')
        AccessibilityInfo.announceForAccessibilityWithOptions(text, { queue: options.politeness !== 'assertive' });
    else AccessibilityInfo.announceForAccessibility(text);
}

// Only react-native-web knows aria-atomic
const atomic = { 'aria-atomic': true } as object;

export interface LiveAnnouncerProps {
    children?: ReactNode;
}

/**
 * Optional, around the app: on the web the live regions of `announce()` sit inside the app (polite and assertive);
 * iOS and Android announce without it.
 */
export function LiveAnnouncer({ children }: LiveAnnouncerProps) {
    const polite = useRef<ComponentRef<typeof Text>>(null);
    const assertive = useRef<ComponentRef<typeof Text>>(null);
    useEffect(() => {
        if (Platform.OS !== 'web' || !polite.current || !assertive.current) return;
        // react-native-web renders host components as DOM elements
        return announcer.attach({
            polite: polite.current as unknown as HTMLElement,
            assertive: assertive.current as unknown as HTMLElement,
        });
    }, []);
    return (
        <>
            {children}
            {Platform.OS === 'web' && (
                <View className={visuallyHidden()}>
                    <Text ref={polite} role="status" aria-live="polite" {...atomic} />
                    <Text ref={assertive} role="alert" aria-live="assertive" {...atomic} />
                </View>
            )}
        </>
    );
}
