import {
    getPreferredMode,
    setMode,
    type ColorMode,
    type IconButtonVariant,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { IconButton, useTranslations } from '@wirecore/wirelayer-react';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';

export interface ModeToggleProps {
    /** localStorage key for the choice */
    storageKey?: string;
    /** Accessible name while dark is active */
    lightLabel?: string;
    /** Accessible name while light is active */
    darkLabel?: string;
    variant?: IconButtonVariant;
    size?: Size;
}

// The document's data-mode is the single source of truth – every toggle on the page stays in sync
const subscribe = (onChange: () => void) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
    return () => observer.disconnect();
};
const getSnapshot = (): ColorMode => (document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light');
const getServerSnapshot = (): ColorMode => 'light';

export function ModeToggle({
    storageKey = 'wirecore-mode',
    lightLabel,
    darkLabel,
    variant = 'text',
    size,
}: ModeToggleProps) {
    const translations = useTranslations();
    const mode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
        // Keep a mode set before hydration (e.g. by an inline script against flashing), else stored/system
        if (!document.documentElement.dataset.mode) setMode(getPreferredMode(storageKey), storageKey);
    }, [storageKey]);

    return (
        <IconButton
            icon={mode === 'dark' ? Sun : Moon}
            label={
                mode === 'dark'
                    ? (lightLabel ?? translations.modeToggle.light)
                    : (darkLabel ?? translations.modeToggle.dark)
            }
            variant={variant}
            size={size}
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark', storageKey)}
        />
    );
}
