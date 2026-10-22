import { strokeColor } from '@wirecore/wirelayer-recipes/native';
import { useResolveClassNames } from 'uniwind';

export type PaletteColor = 'primary' | 'info' | 'success' | 'warn' | 'danger' | 'muted' | 'neutral' | 'track';

/** The order segments without a colour take (as on the web) */
export const segmentPalette = ['primary', 'info', 'success', 'warn', 'danger', 'muted'] as const;

const colorOf = (style: { color?: unknown }) => (typeof style.color === 'string' ? style.color : undefined);

/**
 * Colour values of the theme for SVG strokes (react-native-svg takes colours, not classes) – follows theme and
 * mode like the classes do
 */
export function usePalette(): Record<PaletteColor, string | undefined> {
    return {
        primary: colorOf(useResolveClassNames(strokeColor({ color: 'primary' }))),
        info: colorOf(useResolveClassNames(strokeColor({ color: 'info' }))),
        success: colorOf(useResolveClassNames(strokeColor({ color: 'success' }))),
        warn: colorOf(useResolveClassNames(strokeColor({ color: 'warn' }))),
        danger: colorOf(useResolveClassNames(strokeColor({ color: 'danger' }))),
        muted: colorOf(useResolveClassNames(strokeColor({ color: 'muted' }))),
        neutral: colorOf(useResolveClassNames(strokeColor({ color: 'neutral' }))),
        track: colorOf(useResolveClassNames(strokeColor({ color: 'track' }))),
    };
}
