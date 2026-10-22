/** Colour schemes, switched with `data-mode` (`:root` = light). */
export const modes = ['light', 'dark'] as const;
export type Mode = (typeof modes)[number];

export const colorTokens = [
    'bg',
    'bg-2',
    'card',
    'fg',
    'muted',
    'line',
    'line-2',
    'line-strong',
    'glow',
    'success',
    'warn',
    'danger',
    'info',
    'on-success',
    'on-danger',
    'on-info',
    'on-warn',
    'primary',
    'on-primary',
] as const;
export type ColorToken = (typeof colorTokens)[number];

export type ColorSet = Record<ColorToken, string>;

/**
 * Base colours (theme "wirecore") per mode. Every text/UI pair meets WCAG 2.2 AA – see contrast.ts,
 * enforced for every theme by test/contrast.test.ts. `primary` drives primary buttons and all selected
 * states; in the WireLayer theme it equals `fg`, so the default look stays monochrome.
 */
export const colors: Record<Mode, ColorSet> = {
    light: {
        bg: '#FFFFFF',
        'bg-2': '#F6F6F6',
        card: '#FFFFFF',
        fg: '#0A0A0A',
        muted: '#666666',
        line: 'rgba(0, 0, 0, 0.08)',
        'line-2': 'rgba(0, 0, 0, 0.16)',
        'line-strong': 'rgba(0, 0, 0, 0.43)',
        glow: 'rgba(0, 0, 0, 0.045)',
        success: 'oklch(0.47 0.13 155)',
        warn: 'oklch(0.505 0.14 70)',
        danger: 'oklch(0.515 0.19 25)',
        info: 'oklch(0.50 0.12 245)',
        'on-success': '#FFFFFF',
        'on-danger': '#FFFFFF',
        'on-info': '#FFFFFF',
        'on-warn': '#FFFFFF',
        primary: '#0A0A0A',
        'on-primary': '#FFFFFF',
    },
    dark: {
        bg: '#050505',
        'bg-2': '#0A0A0A',
        card: '#0C0C0C',
        fg: '#F4F4F4',
        muted: '#8F8F8F',
        line: 'rgba(255, 255, 255, 0.09)',
        'line-2': 'rgba(255, 255, 255, 0.18)',
        'line-strong': 'rgba(255, 255, 255, 0.35)',
        glow: 'rgba(255, 255, 255, 0.07)',
        success: 'oklch(0.78 0.14 155)',
        warn: 'oklch(0.84 0.14 80)',
        danger: 'oklch(0.70 0.18 25)',
        info: 'oklch(0.76 0.11 245)',
        'on-success': '#050505',
        'on-danger': '#050505',
        'on-info': '#050505',
        'on-warn': '#050505',
        primary: '#F4F4F4',
        'on-primary': '#050505',
    },
};

/**
 * A theme overrides any base colours per mode – typically `primary` and `on-primary`.
 * It is switched with `data-theme="<name>"` and combines with `data-mode`.
 */
export interface Theme {
    name: string;
    label: string;
    colors: Record<Mode, Partial<ColorSet>>;
}

/** Identity helper for typing custom themes: `defineTheme({ name: 'brand', … })`. */
export const defineTheme = (theme: Theme): Theme => theme;

/** Built-in themes. All of them pass the WCAG AA contrast checks in both modes. */
export const themes: Theme[] = [
    { name: 'wirecore', label: 'WireLayer', colors: { light: {}, dark: {} } },
    {
        name: 'ocean',
        label: 'Ocean',
        colors: {
            light: { primary: 'oklch(0.48 0.17 255)', 'on-primary': '#FFFFFF' },
            dark: { primary: 'oklch(0.72 0.13 250)', 'on-primary': '#050505' },
        },
    },
    {
        name: 'violet',
        label: 'Violet',
        colors: {
            light: { primary: 'oklch(0.49 0.2 295)', 'on-primary': '#FFFFFF' },
            dark: { primary: 'oklch(0.74 0.15 295)', 'on-primary': '#050505' },
        },
    },
    {
        name: 'teal',
        label: 'Teal',
        colors: {
            light: { primary: 'oklch(0.45 0.1 190)', 'on-primary': '#FFFFFF' },
            dark: { primary: 'oklch(0.76 0.11 190)', 'on-primary': '#050505' },
        },
    },
];

/** Base colours with the theme's overrides applied. */
export const resolveColors = (theme: Theme, mode: Mode): ColorSet => ({ ...colors[mode], ...theme.colors[mode] });

export const fonts = {
    sans: ['"Schibsted Grotesk Variable"', '"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
};

/** Custom radii on top of the Tailwind defaults (md 6px, lg 8px, xl 12px, full). */
export const radius = {
    card: '20px',
    panel: '28px',
};

export const tracking = {
    display: '-0.05em',
    heading: '-0.045em',
    label: '0.08em',
};

export const sizes = ['sm', 'md', 'lg'] as const;
export type Size = (typeof sizes)[number];

/** Control size grid shared by buttons and inputs (px). */
export const controlSizes: Record<Size, { height: number; fontSize: number; iconSize: number }> = {
    sm: { height: 32, fontSize: 13, iconSize: 14 },
    md: { height: 40, fontSize: 14, iconSize: 16 },
    lg: { height: 48, fontSize: 15, iconSize: 18 },
};
