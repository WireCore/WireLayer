import {
    sankey,
    sankeyLayout,
    sankeyPath,
    toneAt,
    type SankeyLinkInput,
    type SankeyNodeInput,
} from '@wirecore/wirelayer-recipes/native';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { ChartData, nativeAccessible, useChartColors, useLayoutWidth } from '../../chart/parts.js';
import { useLocale } from '../../locale.js';

export interface SankeyProps extends Omit<ViewProps, 'children'> {
    nodes: SankeyNodeInput[];
    /** Flows from node to node (ids) */
    links: SankeyLinkInput[];
    /** Title, also the accessible name of the diagram */
    title: string;
    /** Height of the diagram in pt (default 260) – it fills the width */
    height?: number;
    /** The flows as a list below the diagram (opens on demand) – the text alternative (default true) */
    table?: boolean;
    formatOptions?: Intl.NumberFormatOptions;
    /** Default: the LocaleProvider's */
    locale?: string;
    className?: string;
}

const NODE_WIDTH = 10;
/** Line height of a node label */
const LABEL = 16;

/**
 * Flows as bands between nodes (react-native-svg), an image named by the title; the flows as a list ("From: To,
 * Value") are the text alternative
 */
export function Sankey({
    nodes,
    links,
    title,
    height = 260,
    table = true,
    formatOptions,
    locale,
    className,
    ...props
}: SankeyProps) {
    const context = useLocale();
    const t = context.translations;
    const styles = sankey();
    const colors = useChartColors();
    const [width, onLayout] = useLayoutWidth();
    const layout = sankeyLayout(nodes, links, width, height, { nodeWidth: NODE_WIDTH, padding: 12 });
    const lastColumn = Math.max(0, ...layout.nodes.map((node) => node.column));
    // Labels fit between two columns
    const labelWidth = Math.max(48, (lastColumn > 0 ? (width - NODE_WIDTH) / lastColumn : width) - NODE_WIDTH - 12);
    const number = new Intl.NumberFormat(locale ?? context.locale, formatOptions);
    const labelOf = (id: string) => nodes.find((node) => node.id === id)?.label ?? id;
    const toneOf = (id: string) =>
        toneAt(
            Math.max(
                0,
                nodes.findIndex((node) => node.id === id)
            )
        );
    return (
        <View {...props} className={styles.base({ class: className })}>
            <Text className={styles.title()} aria-hidden>
                {title}
            </Text>
            <View
                role="img"
                aria-label={title}
                {...nativeAccessible}
                className={styles.plot()}
                style={{ height }}
                onLayout={onLayout}
            >
                {width > 0 && (
                    <Svg
                        width={width}
                        height={height}
                        viewBox={`0 0 ${width} ${height}`}
                        aria-hidden
                        pointerEvents="none"
                    >
                        {layout.links.map((link) => (
                            <Path
                                key={link.index}
                                d={sankeyPath(link)}
                                stroke={colors[toneOf(link.source)]}
                                strokeOpacity={0.35}
                                strokeWidth={Math.max(1, link.width)}
                                fill="none"
                            />
                        ))}
                        {layout.nodes.map((node) => (
                            <Rect
                                key={node.id}
                                x={node.x}
                                y={node.y}
                                width={NODE_WIDTH}
                                height={Math.max(1, node.height)}
                                rx={2}
                                fill={colors[toneAt(node.index)]}
                            />
                        ))}
                    </Svg>
                )}
                {width > 0 && (
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {layout.nodes.map((node) => {
                            const last = node.column === lastColumn && lastColumn > 0;
                            const top = Math.max(0, Math.min(height - LABEL, node.y + node.height / 2 - LABEL / 2));
                            return (
                                <Text
                                    key={node.id}
                                    className={styles.nodeLabel()}
                                    numberOfLines={1}
                                    style={{
                                        top,
                                        lineHeight: LABEL,
                                        maxWidth: labelWidth,
                                        ...(last ? { right: width - node.x + 4 } : { left: node.x + NODE_WIDTH + 4 }),
                                    }}
                                >
                                    {`${node.label} `}
                                    <Text className={styles.nodeValue()}>{number.format(node.value)}</Text>
                                </Text>
                            );
                        })}
                    </View>
                )}
            </View>
            {table && (
                <ChartData
                    label={title}
                    rows={links.map((link) => ({
                        label: labelOf(link.source),
                        values: [
                            { name: t.sankey.target, value: labelOf(link.target) },
                            { name: t.sankey.value, value: number.format(link.value) },
                        ],
                    }))}
                />
            )}
        </View>
    );
}
