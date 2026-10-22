// Storybook only: react-native-svg's web build imports native TurboModules that Vite cannot resolve (see main.ts).
// The elements the components draw (Svg, Path, Circle, Rect, Line, G, Text) map to plain DOM SVG with the same
// props; apps keep react-native-svg.
import type { ReactNode } from 'react';

interface SvgProps {
    width?: number;
    height?: number;
    viewBox?: string;
    pointerEvents?: string;
    'aria-hidden'?: boolean;
    children?: ReactNode;
}

export default function Svg({ width, height, viewBox, pointerEvents, children, ...props }: SvgProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox={viewBox}
            aria-hidden={props['aria-hidden'] ? true : undefined}
            style={{
                // Without a viewBox (SignaturePad) the drawing lies over its pad; with one it is in the flow
                ...(viewBox ? { display: 'block', flexShrink: 0 } : { position: 'absolute', inset: 0 }),
                pointerEvents: pointerEvents === 'none' ? 'none' : undefined,
            }}
        >
            {children}
        </svg>
    );
}

/** Paint props shared by the shapes */
interface Paint {
    stroke?: string;
    strokeWidth?: number;
    strokeLinecap?: 'round' | 'butt' | 'square';
    strokeLinejoin?: 'round' | 'miter' | 'bevel';
    strokeDasharray?: string;
    strokeDashoffset?: number;
    strokeOpacity?: number;
    fill?: string;
    fillOpacity?: number;
    opacity?: number;
    transform?: string;
}

export function Path(props: Paint & { d: string }) {
    return <path {...props} />;
}

export function Circle(props: Paint & { cx: number; cy: number; r: number }) {
    return <circle {...props} />;
}

interface RectProps extends Paint {
    x?: number;
    y?: number;
    width: number;
    height: number;
    rx?: number;
    ry?: number;
}

export function Rect(props: RectProps) {
    return <rect {...props} />;
}

export function Line(props: Paint & { x1: number; y1: number; x2: number; y2: number }) {
    return <line {...props} />;
}

export function G(props: { transform?: string; opacity?: number; children?: ReactNode }) {
    return <g {...props} />;
}

export function Text({
    textAnchor,
    fontSize,
    fontFamily,
    ...props
}: {
    x?: number;
    y?: number;
    fill?: string;
    textAnchor?: 'start' | 'middle' | 'end';
    fontSize?: number;
    fontFamily?: string;
    children?: ReactNode;
}) {
    return <text {...props} textAnchor={textAnchor} fontSize={fontSize} fontFamily={fontFamily} />;
}
