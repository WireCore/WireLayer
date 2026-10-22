import {
    layoutGapSize,
    responsiveColumnCount,
    simpleGrid,
    type LayoutGap,
    type ResponsiveColumns,
} from '@wirecore/wirelayer-recipes/native';
import { Children, useState } from 'react';
import { useWindowDimensions, View, type ViewProps } from 'react-native';

export interface SimpleGridProps extends ViewProps {
    /** Columns – a number or by width, e.g. `{ base: 1, sm: 2, lg: 3 }` (breakpoints of the grid's own width) */
    columns?: ResponsiveColumns;
    /** As many columns as fit with at least this width (pt) – instead of `columns` */
    minColumnWidth?: number;
    /** Space between the cells (default md, 16) */
    gap?: LayoutGap;
    className?: string;
}

/** Grid of equally wide columns; the cells wrap into rows */
export function SimpleGrid({
    columns = 1,
    minColumnWidth,
    gap = 'md',
    className,
    style,
    children,
    onLayout,
    ...props
}: SimpleGridProps) {
    const styles = simpleGrid();
    const window = useWindowDimensions();
    const [width, setWidth] = useState<number | null>(null);
    const space = layoutGapSize[gap];
    const available = width ?? window.width;
    const count = minColumnWidth
        ? Math.max(1, Math.floor((available + space) / (minColumnWidth + space)))
        : Math.max(1, responsiveColumnCount(columns, available));
    const cell = width === null ? undefined : (width - space * (count - 1)) / count;
    return (
        <View
            {...props}
            className={styles.base({ class: className })}
            style={[{ columnGap: space, rowGap: space }, style]}
            onLayout={(event) => {
                setWidth(event.nativeEvent.layout.width);
                onLayout?.(event);
            }}
        >
            {Children.map(children, (child) => (
                <View className={styles.cell()} style={{ width: cell ?? `${100 / count}%` }}>
                    {child}
                </View>
            ))}
        </View>
    );
}
