import { nativeThemeName, type Mode } from '@wirecore/wirelayer-tokens';
import { Appearance } from 'react-native';
import { Uniwind, type ThemeName } from 'uniwind';

export type ColorMode = Mode | 'system';

let subscription: { remove(): void } | undefined;

/**
 * Switches the colour theme and light/dark mode – the counterpart of `data-theme` / `data-mode` on the web.
 * Custom themes have to be registered as `extraThemes` (see `nativeExtraThemes()` from @wirecore/wirelayer-tokens).
 * `system` follows the device setting, also for themes other than the default one.
 */
export function setAppearance({ theme = 'wirecore', mode = 'system' }: { theme?: string; mode?: ColorMode }) {
    subscription?.remove();
    subscription = undefined;
    if (mode !== 'system') {
        Uniwind.setTheme(nativeThemeName(theme, mode) as ThemeName);
        return;
    }
    if (theme === 'wirecore') {
        Uniwind.setTheme('system' as ThemeName);
        return;
    }
    const apply = () =>
        Uniwind.setTheme(
            nativeThemeName(theme, Appearance.getColorScheme() === 'dark' ? 'dark' : 'light') as ThemeName
        );
    apply();
    subscription = Appearance.addChangeListener(apply);
}
