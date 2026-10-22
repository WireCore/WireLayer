import { watermark, watermarkTile, type WatermarkOptions } from '@wirecore/wirelayer-recipes/native';
import { useState, type ReactNode } from 'react';
import { Image, View, type ViewProps } from 'react-native';
import Svg, { G, Text as SvgText } from 'react-native-svg';

export interface WatermarkProps extends ViewProps, WatermarkOptions {
    className?: string;
    /** The content under the watermark */
    children?: ReactNode;
}

/**
 * Repeats a text or image over the content, e.g. "Draft" or "Confidential" – decoration only (drawn as SVG, hidden
 * from screen readers, presses go through).
 */
export function Watermark({
    text,
    image,
    imageWidth = 120,
    imageHeight = 64,
    rotate = -22,
    gap,
    fontSize = 16,
    color = '#808080',
    opacity = 0.15,
    className,
    children,
    ...props
}: WatermarkProps) {
    const styles = watermark();
    const [area, setArea] = useState({ width: 0, height: 0 });
    const tile = watermarkTile({ text, image, imageWidth, imageHeight, gap, fontSize });
    const columns = Math.ceil(area.width / tile.width) + 1;
    const rows = Math.ceil(area.height / tile.height) + 1;
    const tiles = area.width > 0 ? Array.from({ length: rows * columns }, (_, index) => index) : [];
    const position = (index: number) => ({
        x: (index % columns) * tile.width,
        y: Math.floor(index / columns) * tile.height,
    });
    return (
        <View
            {...props}
            className={styles.base({ class: className })}
            onLayout={(event) => setArea(event.nativeEvent.layout)}
        >
            {children}
            <View className={styles.layer()} pointerEvents="none" aria-hidden style={{ opacity }}>
                {image ? (
                    tiles.map((index) => (
                        <View
                            key={index}
                            className={styles.tile()}
                            style={{
                                left: position(index).x,
                                top: position(index).y,
                                width: tile.width,
                                height: tile.height,
                                transform: [{ rotate: `${rotate}deg` }],
                            }}
                        >
                            <Image source={{ uri: image }} alt="" style={{ width: imageWidth, height: imageHeight }} />
                        </View>
                    ))
                ) : (
                    <Svg width={area.width} height={area.height} viewBox={`0 0 ${area.width || 1} ${area.height || 1}`}>
                        {tiles.map((index) => {
                            const { x, y } = position(index);
                            const centerX = x + tile.width / 2;
                            const top = y + (tile.height - tile.contentHeight) / 2 + fontSize;
                            return (
                                <G key={index} transform={`rotate(${rotate} ${centerX} ${y + tile.height / 2})`}>
                                    {tile.lines.map((line, row) => (
                                        <SvgText
                                            key={row}
                                            x={centerX}
                                            y={top + row * tile.lineHeight}
                                            textAnchor="middle"
                                            fontSize={fontSize}
                                            fontFamily="sans-serif"
                                            fill={color}
                                        >
                                            {line}
                                        </SvgText>
                                    ))}
                                </G>
                            );
                        })}
                    </Svg>
                )}
            </View>
        </View>
    );
}
