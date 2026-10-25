import {
    chart as chartRecipe,
    sankey as sankeyRecipe,
    sankeyLayout,
    sankeyPath,
    toneAt,
    type RecipeClasses,
    type SankeyLinkInput,
    type SankeyNodeInput,
} from '@wirecore/wirelayer-recipes';
import { useId, type ComponentProps } from 'react';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SankeyProps extends Omit<ComponentProps<'figure'>, 'children' | 'title'> {
    nodes: readonly SankeyNodeInput[];
    /** Flows from node to node (ids) */
    links: readonly SankeyLinkInput[];
    /** Title, also the accessible name of the diagram */
    title: string;
    /** Height of the diagram in px */
    height?: number;
    /** The flows as a table below the diagram (expandable) */
    table?: boolean;
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sankeyRecipe>;
}

const WIDTH = 640;
const NODE_WIDTH = 12;

/** SVG with role="img" named by the title; the flows as a table are its text alternative (WCAG 1.1.1) */
export function Sankey({
    nodes,
    links,
    title,
    height = 300,
    table = true,
    formatOptions,
    locale,
    classes,
    className,
    ...props
}: SankeyProps) {
    const sankey = useRecipe('sankey', sankeyRecipe, classes);
    const chart = useRecipe('chart', chartRecipe);
    const styles = sankey();
    const tableStyles = chart();
    const id = useId();
    const localeContext = useLocale();
    const translations = useTranslations();
    const layout = sankeyLayout(nodes, links, WIDTH, height, { nodeWidth: NODE_WIDTH });
    const lastColumn = Math.max(0, ...layout.nodes.map((node) => node.column));
    const number = new Intl.NumberFormat(locale ?? localeContext.locale, formatOptions);
    const labelOf = (nodeId: string) => nodes.find((node) => node.id === nodeId)?.label ?? nodeId;
    const toneOf = (nodeId: string) =>
        toneAt(
            Math.max(
                0,
                nodes.findIndex((node) => node.id === nodeId)
            )
        );
    return (
        <figure {...props} className={styles.base({ class: className })}>
            <figcaption id={`${id}title`} className={styles.title()}>
                {title}
            </figcaption>
            <svg className={styles.svg()} viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-labelledby={`${id}title`}>
                {layout.links.map((link) => (
                    <path
                        key={link.index}
                        className={sankey({ tone: toneOf(link.source) }).link()}
                        d={sankeyPath(link)}
                        strokeWidth={Math.max(1, link.width)}
                    />
                ))}
                {layout.nodes.map((node) => (
                    <g key={node.id}>
                        <rect
                            className={sankey({ tone: toneAt(node.index) }).node()}
                            x={node.x}
                            y={node.y}
                            width={NODE_WIDTH}
                            height={Math.max(1, node.height)}
                            rx="2"
                        />
                        <text
                            className={styles.nodeLabel()}
                            x={node.column === lastColumn ? node.x - 6 : node.x + NODE_WIDTH + 6}
                            y={node.y + node.height / 2}
                            textAnchor={node.column === lastColumn ? 'end' : 'start'}
                            dominantBaseline="middle"
                        >
                            {node.label} <tspan className={styles.nodeValue()}>{number.format(node.value)}</tspan>
                        </text>
                    </g>
                ))}
            </svg>
            {table && (
                <details className={tableStyles.details()}>
                    <summary className={tableStyles.summary()}>{translations.chart.showTable}</summary>
                    <div className={tableStyles.scroll()}>
                        <table className={tableStyles.table()}>
                            <caption className={tableStyles.caption()}>{title}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={tableStyles.th()}>
                                        {translations.sankey.source}
                                    </th>
                                    <th scope="col" className={tableStyles.th()}>
                                        {translations.sankey.target}
                                    </th>
                                    <th scope="col" className={tableStyles.th()}>
                                        {translations.sankey.value}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {links.map((link, index) => (
                                    <tr key={index}>
                                        <th scope="row" className={tableStyles.rowHeader()}>
                                            {labelOf(link.source)}
                                        </th>
                                        <td className={tableStyles.rowHeader()}>{labelOf(link.target)}</td>
                                        <td className={tableStyles.td()}>{number.format(link.value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            )}
        </figure>
    );
}
