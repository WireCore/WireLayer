import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Web: Escape closes while open – also during the opening animation, when react-native-web does not listen yet
 * and the focus is not inside the modal.
 */
export function useEscape(open: boolean, close: () => void) {
    useEffect(() => {
        if (!open || Platform.OS !== 'web') return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };
        // Capture: react-native-web's TextInput stops the keydown from bubbling (Escape in a field of the modal)
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [open, close]);
}
