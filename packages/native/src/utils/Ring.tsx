import Svg, { Circle } from 'react-native-svg';

export interface RingSegment {
    /** Share of the circle where it starts, 0–1 from the top, clockwise */
    start: number;
    /** Share of the circle it covers, 0–1 */
    length: number;
    color?: string;
}

/** Ring of segments (react-native-svg) in a 100 × 100 box – decorative, the component carries the value */
export function Ring({
    size,
    thickness,
    segments,
    track,
    roundCaps = false,
}: {
    size: number;
    /** Width of the ring in % of the size */
    thickness: number;
    segments: RingSegment[];
    track?: string;
    roundCaps?: boolean;
}) {
    const radius = 50 - thickness / 2;
    const circumference = 2 * Math.PI * radius;
    return (
        <Svg width={size} height={size} viewBox="0 0 100 100" aria-hidden pointerEvents="none">
            <Circle cx={50} cy={50} r={radius} stroke={track} strokeWidth={thickness} fill="none" />
            {segments.map((segment, index) =>
                segment.length > 0 ? (
                    <Circle
                        key={index}
                        cx={50}
                        cy={50}
                        r={radius}
                        stroke={segment.color}
                        strokeWidth={thickness}
                        fill="none"
                        strokeLinecap={roundCaps ? 'round' : 'butt'}
                        strokeDasharray={`${segment.length * circumference} ${circumference}`}
                        strokeDashoffset={-segment.start * circumference}
                        transform="rotate(-90 50 50)"
                    />
                ) : null
            )}
        </Svg>
    );
}
