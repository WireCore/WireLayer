// Bundlers replace `process.env.NODE_ENV` (Vite, webpack, Next); without one the check fails and nothing warns
declare const process: { env: Record<string, string | undefined> };

/** True in development builds (`process.env.NODE_ENV` is not "production"); false where nothing sets it */
export const isDevelopment = () => {
    try {
        return process.env.NODE_ENV !== 'production';
    } catch {
        return false;
    }
};

const warned = new Set<string>();

/** Logs `[WireLayer] <message>` once per message, only in development (misuse hints for app developers) */
export function warnInDevelopment(message: string) {
    if (!isDevelopment() || warned.has(message)) return;
    warned.add(message);
    console.warn(`[WireLayer] ${message}`);
}

const checkedSources = new Set<string>();

/**
 * With styles-core.css (classes per component instead of all), warns once in development when the classes of a
 * recipe are missing: styles-core.css sets --wc-recipe-sources, every sources/<recipe>.css --wc-recipe-<recipe>.
 * Checked once per recipe – with styles.css (or before any CSS has loaded) neither is set and nothing warns.
 */
export function checkRecipeSources(name: string) {
    if (checkedSources.has(name) || typeof document === 'undefined' || !isDevelopment()) return;
    checkedSources.add(name);
    const style = getComputedStyle(document.documentElement);
    if (!style.getPropertyValue('--wc-recipe-sources') || style.getPropertyValue(`--wc-recipe-${name}`)) return;
    warnInDevelopment(
        `The classes of the recipe "${name}" are missing from the CSS – import the sources file of the component ` +
            `(e.g. @wirecore/wirelayer-vue/sources/Button.css) or @wirecore/wirelayer-recipes/sources/${name}.css.`
    );
}
