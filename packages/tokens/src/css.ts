import type { ColorSet, Theme } from './tokens.js';

/** `--wc-*` declarations for a (partial) colour set. */
export const colorDeclarations = (set: Partial<ColorSet>) =>
    Object.entries(set)
        .map(([token, value]) => `    --wc-${token}: ${value};`)
        .join('\n');

/**
 * CSS for a theme: its overrides apply with `data-theme="<name>"`, combined with `data-mode` on the same
 * element or nested in either direction. Dark rules are more specific, so they win over the light ones.
 * Without `data-mode` on the root the system setting decides, like for the base colours.
 * Use it to generate CSS for a custom theme, e.g. in a build script.
 */
export function themeToCss(theme: Theme): string {
    const t = `[data-theme=${theme.name}]`;
    return `${t},
${t} [data-mode=light] {
${colorDeclarations(theme.colors.light)}
}

${t}[data-mode=dark],
${t} [data-mode=dark],
[data-mode=dark] ${t} {
${colorDeclarations(theme.colors.dark)}
}

@media (prefers-color-scheme: dark) {
    :root:not([data-mode])${t},
    :root:not([data-mode]) ${t}:not([data-mode], [data-mode=light] *) {
${colorDeclarations(theme.colors.dark).replace(/^/gm, '    ')}
    }
}`;
}
