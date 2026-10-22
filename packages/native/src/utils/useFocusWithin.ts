import { useEffect, useRef, useState } from 'react';

/**
 * Focus state of a text field with suggestions below it: leaving the field waits a moment, so a tap on a suggestion
 * (which takes the focus on the web, or dismisses the keyboard) still reaches it before the list closes.
 */
export function useFocusWithin(delay = 250) {
    const [focused, setFocused] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    return {
        focused,
        onFocus: () => {
            clearTimeout(timer.current);
            setFocused(true);
        },
        onBlur: () => {
            clearTimeout(timer.current);
            timer.current = setTimeout(() => setFocused(false), delay);
        },
    };
}
