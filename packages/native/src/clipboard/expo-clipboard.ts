// useClipboard on expo-clipboard (optional peer dependency) – React Native has no clipboard of its own
import { setStringAsync } from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copies text to the clipboard: `const { copy, copied, error, reset } = useClipboard()` – `copied` is true for
 * `timeout` ms (default 2000), the same API as the web hook.
 */
export function useClipboard(options: { timeout?: number } = {}) {
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => () => clearTimeout(timer.current), []);
    const reset = useCallback(() => {
        clearTimeout(timer.current);
        setCopied(false);
        setError(null);
    }, []);
    const { timeout = 2000 } = options;
    const copy = useCallback(
        async (text: string) => {
            reset();
            try {
                await setStringAsync(text);
                setCopied(true);
                timer.current = setTimeout(() => setCopied(false), timeout);
            } catch (reason) {
                setError(reason instanceof Error ? reason : new Error(String(reason)));
            }
        },
        [reset, timeout]
    );
    return { copy, copied, error, reset };
}
