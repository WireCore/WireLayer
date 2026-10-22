import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Follows the system setting "Reduce motion" (iOS, Android, prefers-reduced-motion on the web). */
export function useReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        let active = true;
        void AccessibilityInfo.isReduceMotionEnabled().then((value) => active && setReduced(value));
        const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
        return () => {
            active = false;
            subscription.remove();
        };
    }, []);
    return reduced;
}
