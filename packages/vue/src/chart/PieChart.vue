<script setup lang="ts">
import {
    chart as chartRecipe,
    mergeOptions,
    pieConfig,
    pieLegend,
    seriesChart as seriesChartRecipe,
    type ChartTheme,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import ChartCanvas from './ChartCanvas.vue';
import type { PieChartProps } from './types.js';
import { useLocale } from '../locale.js';
import { useRecipe } from '../recipes.js';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PieChartProps>(), {
    hideTitle: false,
    donut: false,
    height: '14rem',
    legend: true,
    table: true,
});
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chart);
const styles = useRecipe('chart', chartRecipe, () => props.classes)();
const seriesChart = useRecipe('seriesChart', seriesChartRecipe);
const parts = seriesChart();
const id = useId();
const format = computed(() => props.formatValue ?? ((value: number) => value.toLocaleString(locale.value.locale)));
const build = computed(() => (theme: ChartTheme, reducedMotion: boolean) => {
    const config = pieConfig(
        props.slices,
        props.donut,
        theme,
        format.value,
        props.title,
        reducedMotion,
        locale.value.locale
    );
    return { ...config, options: mergeOptions(config.options, props.options) };
});
const rows = computed(() => pieLegend(props.slices, format.value, locale.value.locale));
</script>

<template>
    <!-- Pie or doughnut on a canvas named by the title; the legend lists value and share, the table is the text -->
    <figure :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <figcaption :id="`${id}title`" :class="hideTitle ? styles.caption() : styles.title()">{{ title }}</figcaption>
        <div :class="parts.pieLayout()">
            <div :class="parts.pieBox()" :style="{ height }">
                <ChartCanvas :build="build" :labelledby="`${id}title`" />
            </div>
            <ul v-if="legend" role="list" :aria-label="t.legend" :class="parts.legend()">
                <li v-for="row in rows" :key="row.label" :class="parts.legendItem()">
                    <span :class="seriesChart({ tone: row.tone }).swatch()" aria-hidden="true" />
                    <span :class="parts.legendLabel()">{{ row.label }}</span>
                    <span :class="parts.legendValue()">{{ row.value }} · {{ row.share }}</span>
                </li>
            </ul>
        </div>
        <details v-if="table" :class="styles.details()">
            <summary :class="styles.summary()">{{ t.showTable }}</summary>
            <div :class="styles.scroll()">
                <table :class="styles.table()">
                    <caption :class="styles.caption()">
                        {{
                            title
                        }}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col" :class="styles.th()">{{ t.category }}</th>
                            <th scope="col" :class="styles.th()">{{ t.value }}</th>
                            <th scope="col" :class="styles.th()">{{ t.share }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.label">
                            <th scope="row" :class="styles.rowHeader()">{{ row.label }}</th>
                            <td :class="styles.td()">{{ row.value }}</td>
                            <td :class="styles.td()">{{ row.share }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    </figure>
</template>
