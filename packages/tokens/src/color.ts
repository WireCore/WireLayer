// Colour maths for WCAG contrast checks: parses the token formats (hex, rgba, oklch),
// composites translucent colours like the browser (in gamma-encoded sRGB) and computes
// relative luminance / contrast ratios as defined by WCAG 2.2.

export interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const encode = (linear: number) =>
    clamp(linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055);
const decode = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4));

function oklchToRgb(l: number, c: number, h: number): Rgba {
    const a = c * Math.cos((h * Math.PI) / 180);
    const b = c * Math.sin((h * Math.PI) / 180);
    const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return {
        r: encode(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
        g: encode(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
        b: encode(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
        a: 1,
    };
}

export function parse(color: string): Rgba {
    const hex = color.match(/^#([0-9a-f]{6})$/i)?.[1];
    if (hex) {
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
        return { r, g, b, a: 1 };
    }
    const rgba = color.match(/^rgba?\(([^)]+)\)$/)?.[1];
    if (rgba) {
        const [r = 0, g = 0, b = 0, a = 1] = rgba.split(',').map(Number);
        return { r: r / 255, g: g / 255, b: b / 255, a };
    }
    const oklch = color.match(/^oklch\(([^)]+)\)$/)?.[1];
    if (oklch) {
        const [l = 0, c = 0, h = 0] = oklch.trim().split(/\s+/).map(Number);
        return oklchToRgb(l, c, h);
    }
    throw new Error(`Unsupported colour: ${color}`);
}

/** Paints `top` (optionally with extra opacity, like Tailwind's `/14`) over an opaque `bottom`. */
export function over(top: Rgba, bottom: Rgba, opacity = 1): Rgba {
    const alpha = top.a * opacity;
    const mix = (t: number, b: number) => t * alpha + b * (1 - alpha);
    return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a: 1 };
}

export function luminance({ r, g, b }: Rgba): number {
    return 0.2126 * decode(r) + 0.7152 * decode(g) + 0.0722 * decode(b);
}

export function contrast(a: Rgba, b: Rgba): number {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (light + 0.05) / (dark + 0.05);
}
