<script setup lang="ts">
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
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import { useRecipe } from '../../recipes.js';
import { useLocale, useTranslations } from '../../locale.js';

export interface SankeyProps {
    nodes: SankeyNodeInput[];
    /** Flows from node to node (ids) */
    links: SankeyLinkInput[];
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

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SankeyProps>(), { height: 300, table: true });
const sankey = useRecipe('sankey', sankeyRecipe, () => props.classes);
const chart = useRecipe('chart', chartRecipe);
const attrs = useAttrs();
const id = useId();
const styles = computed(() => sankey());
const tableStyles = chart();
const localeContext = useLocale();
const translations = useTranslations();
const WIDTH = 640;
const NODE_WIDTH = 12;

const layout = computed(() => sankeyLayout(props.nodes, props.links, WIDTH, props.height, { nodeWidth: NODE_WIDTH }));
const lastColumn = computed(() => Math.max(0, ...layout.value.nodes.map((node) => node.column)));
const format = (value: number) =>
    new Intl.NumberFormat(props.locale ?? localeContext.value.locale, props.formatOptions).format(value);
const labelOf = (nodeId: string) => props.nodes.find((node) => node.id === nodeId)?.label ?? nodeId;
const toneOf = (nodeId: string) =>
    toneAt(
        Math.max(
            0,
            props.nodes.findIndex((node) => node.id === nodeId)
        )
    );
</script>

<template>
    <!-- SVG with role="img" named by the title; the flows as a table are its text alternative (WCAG 1.1.1) -->
    <figure v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <figcaption :id="`${id}title`" :class="styles.title()">{{ title }}</figcaption>
        <svg :class="styles.svg()" :viewBox="`0 0 ${WIDTH} ${height}`" role="img" :aria-labelledby="`${id}title`">
            <path
                v-for="link in layout.links"
                :key="link.index"
                :class="sankey({ tone: toneOf(link.source) }).link()"
                :d="sankeyPath(link)"
                :stroke-width="Math.max(1, link.width)"
            />
            <g v-for="node in layout.nodes" :key="node.id">
                <rect
                    :class="sankey({ tone: toneAt(node.index) }).node()"
                    :x="node.x"
                    :y="node.y"
                    :width="NODE_WIDTH"
                    :height="Math.max(1, node.height)"
                    rx="2"
                />
                <text
                    :class="styles.nodeLabel()"
                    :x="node.column === lastColumn ? node.x - 6 : node.x + NODE_WIDTH + 6"
                    :y="node.y + node.height / 2"
                    :text-anchor="node.column === lastColumn ? 'end' : 'start'"
                    dominant-baseline="middle"
                >
                    {{ node.label }}
                    <tspan :class="styles.nodeValue()">{{ format(node.value) }}</tspan>
                </text>
            </g>
        </svg>
        <details v-if="table" :class="tableStyles.details()">
            <summary :class="tableStyles.summary()">{{ translations.chart.showTable }}</summary>
            <div :class="tableStyles.scroll()">
                <table :class="tableStyles.table()">
                    <caption :class="tableStyles.caption()">
                        {{
                            title
                        }}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col" :class="tableStyles.th()">{{ translations.sankey.source }}</th>
                            <th scope="col" :class="tableStyles.th()">{{ translations.sankey.target }}</th>
                            <th scope="col" :class="tableStyles.th()">{{ translations.sankey.value }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(link, index) in links" :key="index">
                            <th scope="row" :class="tableStyles.rowHeader()">{{ labelOf(link.source) }}</th>
                            <td :class="tableStyles.rowHeader()">{{ labelOf(link.target) }}</td>
                            <td :class="tableStyles.td()">{{ format(link.value) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    </figure>
</template>
