import { modes, resolveColors, themes, type Mode, type Theme } from './tokens.js';

// React Native (Uniwind) knows only flat themes, so every theme × mode pair becomes one Uniwind theme.
// The default theme keeps Uniwind's built-in `light`/`dark` (and with it the system setting).

/** Uniwind theme name of a theme in a mode, e.g. `dark` or `ocean-dark`. */
export const nativeThemeName = (theme: string, mode: Mode) => (theme === 'wirecore' ? mode : `${theme}-${mode}`);

/** Themes to register in the Metro/Vite config (`extraThemes`) – everything except `light`/`dark`. */
export const nativeExtraThemes = (list: Theme[] = themes) =>
    list
        .flatMap((theme) => modes.map((mode) => nativeThemeName(theme.name, mode)))
        .filter((name) => !modes.includes(name as Mode));

/**
 * Font families in React Native: one family per weight, named like the font files of
 * `@expo-google-fonts/*` (RN cannot pick the weight of a custom font by itself).
 */
export const nativeFonts = {
    sans: 'SchibstedGrotesk_400Regular',
    'sans-medium': 'SchibstedGrotesk_500Medium',
    'sans-semibold': 'SchibstedGrotesk_600SemiBold',
    'sans-bold': 'SchibstedGrotesk_700Bold',
    mono: 'JetBrainsMono_400Regular',
} as const;

/** `@variant` blocks with all colours of a theme, for `@layer theme { :root { … } }` in a Uniwind CSS file. */
export const themeToNativeCss = (theme: Theme) =>
    modes
        .map((mode) => {
            const declarations = Object.entries(resolveColors(theme, mode))
                .map(([token, value]) => `            --color-${token}: ${value};`)
                .join('\n');
            return `        @variant ${nativeThemeName(theme.name, mode)} {\n${declarations}\n        }`;
        })
        .join('\n');
