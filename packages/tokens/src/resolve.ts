// The colour tokens as fixed values at runtime – for canvas libraries (xterm.js, charts) that cannot read CSS
// variables. Browser only.
import { parse, toHex } from './color.js';
import { colorTokens, type ColorSet } from './tokens.js';

/**
 * The colours of the tokens as they apply to `element` right now (mode, theme and own overrides included): hex,
 * `#rrggbbaa` for translucent ones (line, glow). A value the browser cannot paint stays as written.
 */
export function resolveTokens(element: Element = document.documentElement): ColorSet {
    const style = getComputedStyle(element);
    return Object.fromEntries(
        colorTokens.map((token) => [token, toFixedColor(style.getPropertyValue(`--wc-${token}`).trim())])
    ) as ColorSet;
}

/**
 * Calls `onChange` whenever the token colours may have changed: another mode or theme on the page (`data-mode`,
 * `data-theme`, `class`, `style` of <html> and <body>) or another system colour scheme. Returns the function that
 * stops it. Browser only.
 */
export function watchTokens(onChange: () => void): () => void {
    const observer = new MutationObserver(onChange);
    const attributeFilter = ['data-mode', 'data-theme', 'class', 'style'];
    observer.observe(document.documentElement, { attributes: true, attributeFilter });
    if (document.body) observer.observe(document.body, { attributes: true, attributeFilter });
    const scheme = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : undefined;
    scheme?.addEventListener?.('change', onChange);
    return () => {
        observer.disconnect();
        scheme?.removeEventListener?.('change', onChange);
    };
}

function toFixedColor(value: string): string {
    if (!value) return value;
    try {
        const color = parse(value);
        const alpha = Math.round(color.a * 255);
        return alpha < 255 ? `${toHex(color)}${alpha.toString(16).padStart(2, '0')}` : toHex(color);
    } catch {
        return paintedColor(value) ?? value;
    }
}

let canvas: CanvasRenderingContext2D | null | undefined;

/** Other notations (hsl, color-mix …): painted onto a pixel and read back */
function paintedColor(value: string): string | undefined {
    if (typeof CSS === 'undefined' || !CSS.supports?.('color', value)) return undefined;
    canvas ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    if (!canvas) return undefined;
    canvas.clearRect(0, 0, 1, 1);
    canvas.fillStyle = value;
    canvas.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = canvas.getImageData(0, 0, 1, 1).data;
    const hex = (channel: number) => channel.toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}${a < 255 ? hex(a) : ''}`;
}
