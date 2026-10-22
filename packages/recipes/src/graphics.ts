import { escapeXml } from './xlsx.js';

// Small SVG helpers: the repeated watermark tile, the parts of a ring (RingProgress) and a typed signature.

/** An SVG as data URL (for CSS backgrounds and <img>) */
export const svgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export interface WatermarkOptions {
    /** Text, one line per entry */
    text?: string | string[];
    /** Image URL (drawn instead of the text) */
    image?: string;
    /** Size of the image in px */
    imageWidth?: number;
    imageHeight?: number;
    /** Rotation in degrees (default -22) */
    rotate?: number;
    /** Space between the tiles in px: [horizontal, vertical] (default [96, 72]) */
    gap?: [number, number];
    /** Font size in px (default 16) */
    fontSize?: number;
    /** Text colour – a real colour, CSS variables do not work in the image (default a mid grey) */
    color?: string;
    /** 0–1 (default 0.15) */
    opacity?: number;
}

/** Size of one watermark tile and its content (the text lines, or the image) – shared by web and React Native */
export function watermarkTile(options: WatermarkOptions) {
    const { gap = [96, 72], fontSize = 16 } = options;
    const lines = options.text === undefined ? [] : Array.isArray(options.text) ? options.text : [options.text];
    const lineHeight = fontSize * 1.4;
    const contentWidth = options.image
        ? (options.imageWidth ?? 120)
        : Math.max(1, ...lines.map((line) => line.length)) * fontSize * 0.6;
    const contentHeight = options.image ? (options.imageHeight ?? 64) : Math.max(1, lines.length) * lineHeight;
    return {
        width: Math.ceil(contentWidth + gap[0]),
        height: Math.ceil(contentHeight + gap[1]),
        contentWidth,
        contentHeight,
        lines,
        lineHeight,
    };
}

/** CSS background (image and size) of a watermark tile, repeated over the content */
export function watermarkBackground(options: WatermarkOptions): { backgroundImage: string; backgroundSize: string } {
    const { rotate = -22, fontSize = 16, color = '#808080', opacity = 0.15 } = options;
    const { width, height, contentWidth, contentHeight, lines, lineHeight } = watermarkTile(options);
    const content = options.image
        ? `<image href="${escapeXml(options.image)}" x="${(width - contentWidth) / 2}" y="${(height - contentHeight) / 2}" width="${contentWidth}" height="${contentHeight}"/>`
        : `<text x="${width / 2}" y="${(height - contentHeight) / 2 + fontSize}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" fill="${escapeXml(color)}">${lines
              .map(
                  (line, index) =>
                      `<tspan x="${width / 2}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
              )
              .join('')}</text>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g opacity="${opacity}" transform="rotate(${rotate} ${width / 2} ${height / 2})">${content}</g></svg>`;
    return { backgroundImage: `url("${svgDataUrl(svg)}")`, backgroundSize: `${width}px ${height}px` };
}

/**
 * SVG path of the dark modules of a QR code matrix (`true` = dark), one unit per module – runs of modules in a row
 * become one rectangle. Draw it in a viewBox of the matrix size.
 */
export function qrCodePath(matrix: readonly (readonly boolean[])[]): string {
    let path = '';
    for (const [y, row] of matrix.entries()) {
        let x = 0;
        while (x < row.length) {
            if (!row[x]) {
                x++;
                continue;
            }
            const start = x;
            while (x < row.length && row[x]) x++;
            path += `M${start},${y}h${x - start}v1h-${x - start}z`;
        }
    }
    return path;
}

export interface RingPart {
    /** Share of the circumference 0–1 where the part starts and its length */
    start: number;
    length: number;
}

/**
 * Parts of a ring for values out of `max` (default: their sum, or 100 when smaller), one after another from the
 * top, clockwise. `gap` leaves a share of the circumference free between parts.
 */
export function ringParts(values: readonly number[], max?: number, gap = 0): RingPart[] {
    const sum = values.reduce((total, value) => total + Math.max(0, value), 0);
    const whole = max ?? Math.max(100, sum);
    let start = 0;
    return values.map((value) => {
        const share = whole > 0 ? Math.max(0, value) / whole : 0;
        const part = { start, length: Math.max(0, share - (share > gap ? gap : 0)) };
        start += share;
        return part;
    });
}

/** A typed name as signature image (SVG data URL in a handwriting font) */
export function typedSignature(
    name: string,
    options: { width?: number; height?: number; color?: string } = {}
): string {
    const { width = 400, height = 120, color = '#1a1a1a' } = options;
    const size = Math.min(48, Math.floor((width * 1.6) / Math.max(1, name.length)));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="'Segoe Script','Bradley Hand','Brush Script MT',cursive" font-size="${size}" fill="${escapeXml(color)}">${escapeXml(name)}</text></svg>`;
    return svgDataUrl(svg);
}

/**
 * A stroke of points as SVG path ("M10 20 L12 24 …", rounded to tenths) – SignaturePad on React Native draws its
 * strokes with this; a single point becomes a dot (a zero-length line with round caps)
 */
export function pointsToPath(points: readonly { x: number; y: number }[]): string {
    const round = (value: number) => Math.round(value * 10) / 10;
    if (!points.length) return '';
    const [first, ...rest] = points;
    const moves = rest.length ? rest : [first!];
    return `M${round(first!.x)} ${round(first!.y)} ${moves.map((point) => `L${round(point.x)} ${round(point.y)}`).join(' ')}`;
}

/** Strokes (SVG paths of lines) as signature image: SVG data URL with round caps and joins; "" without strokes */
export function signatureSvg(
    paths: readonly string[],
    options: { width: number; height: number; color?: string; strokeWidth?: number }
): string {
    if (!paths.length) return '';
    const { width, height, color = '#1a1a1a', strokeWidth = 2 } = options;
    const strokes = paths.map((path) => `<path d="${escapeXml(path)}"/>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g fill="none" stroke="${escapeXml(color)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${strokes}</g></svg>`;
    return svgDataUrl(svg);
}

/** Draws an image Blob (e.g. ImageCropper's result) onto a new canvas */
export async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas;
}
