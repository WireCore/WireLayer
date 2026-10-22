// Colour conversion for the colour picker: hex ↔ RGB, HSL, HSB and OKLCH, formatted as CSS text.
// Ark's colour picker knows RGB, HSL and HSB; OKLCH (perceptually even, used by the WireLayer tokens) is computed here.

/** Channels 0–255 and alpha 0–1 */
export interface RgbColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

/** Lightness 0–1, chroma (about 0–0.4), hue 0–360 */
export interface OklchColor {
    l: number;
    c: number;
    h: number;
}

/** Output formats of the colour picker */
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsb' | 'oklch';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 0) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};
const hex2 = (value: number) =>
    Math.round(clamp(value, 0, 255))
        .toString(16)
        .padStart(2, '0');

/** "#1e66f5", "#1e66f580", "#fff" → channels; null for anything else */
export function parseHex(text: string): RgbColor | null {
    let hex = text.trim().replace(/^#/, '');
    if (!/^([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(hex)) return null;
    if (hex.length <= 4) hex = [...hex].map((char) => char + char).join('');
    const channel = (index: number) => parseInt(hex.slice(index, index + 2), 16);
    return { r: channel(0), g: channel(2), b: channel(4), a: hex.length === 8 ? round(channel(6) / 255, 3) : 1 };
}

/** Channels → "#rrggbb" ("#rrggbbaa" when not opaque) */
export function toHex({ r, g, b, a }: RgbColor): string {
    return `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`;
}

/** Hue 0–360, saturation and lightness 0–100 */
export function rgbToHsl({ r, g, b }: RgbColor): { h: number; s: number; l: number } {
    const [red, green, blue] = [r / 255, g / 255, b / 255];
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h: hueOf(red, green, blue, max, d), s: s * 100, l: l * 100 };
}

/** Hue 0–360, saturation and brightness 0–100 */
export function rgbToHsb({ r, g, b }: RgbColor): { h: number; s: number; b: number } {
    const [red, green, blue] = [r / 255, g / 255, b / 255];
    const max = Math.max(red, green, blue);
    const d = max - Math.min(red, green, blue);
    return { h: hueOf(red, green, blue, max, d), s: max === 0 ? 0 : (d / max) * 100, b: max * 100 };
}

function hueOf(red: number, green: number, blue: number, max: number, d: number): number {
    if (d === 0) return 0;
    const h = max === red ? ((green - blue) / d) % 6 : max === green ? (blue - red) / d + 2 : (red - green) / d + 4;
    return (h * 60 + 360) % 360;
}

/** HSL (0–360, 0–100, 0–100) → channels */
export function hslToRgb(h: number, s: number, l: number, a = 1): RgbColor {
    const sat = clamp(s, 0, 100) / 100;
    const light = clamp(l, 0, 100) / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const f = (n: number) => light - sat * Math.min(light, 1 - light) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a };
}

/** HSB (0–360, 0–100, 0–100) → channels */
export function hsbToRgb(h: number, s: number, b: number, a = 1): RgbColor {
    const sat = clamp(s, 0, 100) / 100;
    const bright = clamp(b, 0, 100) / 100;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => bright * (1 - sat * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255, a };
}

const toLinear = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (value: number) => (value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055) * 255;

/** sRGB → OKLCH (Björn Ottosson's OKLab) */
export function rgbToOklch({ r, g, b }: RgbColor): OklchColor {
    const [red, green, blue] = [toLinear(r), toLinear(g), toLinear(b)];
    const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
    const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
    const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    const c = Math.hypot(A, B);
    // Greys have no hue
    return { l: L, c: c < 1e-4 ? 0 : c, h: c < 1e-4 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
}

function oklchToLinear({ l, c, h }: OklchColor): [number, number, number] {
    const A = c * Math.cos((h * Math.PI) / 180);
    const B = c * Math.sin((h * Math.PI) / 180);
    const l1 = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m1 = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s1 = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
    return [
        4.0767416621 * l1 - 3.3077115913 * m1 + 0.2309699292 * s1,
        -1.2684380046 * l1 + 2.6097574011 * m1 - 0.3413193965 * s1,
        -0.0041960863 * l1 - 0.7034186147 * m1 + 1.707614701 * s1,
    ];
}

const inGamut = (channels: number[]) => channels.every((value) => value >= -1e-6 && value <= 1 + 1e-6);

/**
 * OKLCH → sRGB. A colour outside sRGB keeps lightness and hue and loses chroma until it fits (like the browser's
 * gamut mapping, simplified).
 */
export function oklchToRgb(color: OklchColor, a = 1): RgbColor {
    const lightness = clamp(color.l, 0, 1);
    let linear = oklchToLinear({ ...color, l: lightness });
    if (!inGamut(linear)) {
        let low = 0;
        let high = color.c;
        for (let step = 0; step < 24; step++) {
            const mid = (low + high) / 2;
            if (inGamut(oklchToLinear({ l: lightness, c: mid, h: color.h }))) low = mid;
            else high = mid;
        }
        linear = oklchToLinear({ l: lightness, c: low, h: color.h });
    }
    const [r, g, b] = linear.map((value) => fromLinear(clamp(value, 0, 1))) as [number, number, number];
    return { r, g, b, a };
}

const alphaPart = (a: number) => (a < 1 ? ` / ${round(a * 100)}%` : '');

/** Hex colour as CSS text: hex, rgb(), hsl(), hsb() (not CSS, for display) or oklch() */
export function formatColor(hex: string, format: ColorFormat): string {
    const rgb = parseHex(hex);
    if (!rgb) return hex;
    switch (format) {
        case 'rgb':
            return `rgb(${Math.round(rgb.r)} ${Math.round(rgb.g)} ${Math.round(rgb.b)}${alphaPart(rgb.a)})`;
        case 'hsl': {
            const { h, s, l } = rgbToHsl(rgb);
            return `hsl(${round(h)} ${round(s)}% ${round(l)}%${alphaPart(rgb.a)})`;
        }
        case 'hsb': {
            const { h, s, b } = rgbToHsb(rgb);
            return `hsb(${round(h)} ${round(s)}% ${round(b)}%${alphaPart(rgb.a)})`;
        }
        case 'oklch': {
            const { l, c, h } = rgbToOklch(rgb);
            return `oklch(${round(l * 100, 1)}% ${round(c, 3)} ${round(h, 1)}${alphaPart(rgb.a)})`;
        }
        default:
            return toHex(rgb);
    }
}

const numberPattern = String.raw`(-?[\d.]+)(%?)`;
const functionPattern = new RegExp(
    String.raw`^(rgba?|hsla?|hsba?|oklch)\(\s*${numberPattern}[\s,]+${numberPattern}[\s,]+${numberPattern}(?:\s*[/,]\s*${numberPattern})?\s*\)$`,
    'i'
);

/** Reads hex, rgb(), hsl(), hsb() or oklch() text → "#rrggbb(aa)"; null when it is none of these */
export function parseColorText(text: string): string | null {
    const hex = parseHex(text);
    if (hex) return toHex(hex);
    const match = functionPattern.exec(text.trim());
    if (!match) return null;
    const [, name, ...parts] = match;
    const value = (index: number, percentScale: number) => {
        const number = Number(parts[index * 2]);
        return parts[index * 2 + 1] ? (number / 100) * percentScale : number;
    };
    const alpha = parts[6] === undefined ? 1 : clamp(parts[7] ? Number(parts[6]) / 100 : Number(parts[6]), 0, 1);
    const kind = name!.toLowerCase().replace(/a$/, '');
    const rgb =
        kind === 'rgb'
            ? { r: value(0, 255), g: value(1, 255), b: value(2, 255), a: alpha }
            : kind === 'hsl'
              ? hslToRgb(value(0, 360), value(1, 100), value(2, 100), alpha)
              : kind === 'hsb'
                ? hsbToRgb(value(0, 360), value(1, 100), value(2, 100), alpha)
                : oklchToRgb(
                      { l: parts[1] ? value(0, 1) : Number(parts[0]), c: value(1, 0.4), h: value(2, 360) },
                      alpha
                  );
    if ([rgb.r, rgb.g, rgb.b].some((channel) => Number.isNaN(channel))) return null;
    return toHex(rgb);
}

/** Channel values shown in the picker's number fields for a format (rounded) */
export function colorChannels(hex: string, format: Exclude<ColorFormat, 'hex'>): number[] {
    const rgb = parseHex(hex) ?? { r: 0, g: 0, b: 0, a: 1 };
    switch (format) {
        case 'rgb':
            return [rgb.r, rgb.g, rgb.b].map((value) => Math.round(value));
        case 'hsl': {
            const { h, s, l } = rgbToHsl(rgb);
            return [round(h), round(s), round(l)];
        }
        case 'hsb': {
            const { h, s, b } = rgbToHsb(rgb);
            return [round(h), round(s), round(b)];
        }
        default: {
            const { l, c, h } = rgbToOklch(rgb);
            return [round(l * 100, 1), round(c, 3), round(h, 1)];
        }
    }
}

/** Hex colour from channel values of a format (the picker's number fields); keeps the alpha of `base` */
export function colorFromChannels(format: Exclude<ColorFormat, 'hex'>, channels: number[], base = '#000000'): string {
    const alpha = parseHex(base)?.a ?? 1;
    const [x = 0, y = 0, z = 0] = channels;
    const rgb =
        format === 'rgb'
            ? { r: clamp(x, 0, 255), g: clamp(y, 0, 255), b: clamp(z, 0, 255), a: alpha }
            : format === 'hsl'
              ? hslToRgb(x, y, z, alpha)
              : format === 'hsb'
                ? hsbToRgb(x, y, z, alpha)
                : oklchToRgb({ l: x / 100, c: Math.max(0, y), h: z }, alpha);
    return toHex(rgb);
}

/** Ranges and steps of the channel fields per format */
export const colorChannelRanges: Record<Exclude<ColorFormat, 'hex'>, { max: number; step: number }[]> = {
    rgb: [
        { max: 255, step: 1 },
        { max: 255, step: 1 },
        { max: 255, step: 1 },
    ],
    hsl: [
        { max: 360, step: 1 },
        { max: 100, step: 1 },
        { max: 100, step: 1 },
    ],
    hsb: [
        { max: 360, step: 1 },
        { max: 100, step: 1 },
        { max: 100, step: 1 },
    ],
    oklch: [
        { max: 100, step: 0.1 },
        { max: 0.4, step: 0.001 },
        { max: 360, step: 0.1 },
    ],
};
