<script setup lang="ts">
import {
    chart as chartRecipe,
    clampRange,
    mergeOptions,
    referencePlugin,
    referenceSummary,
    seriesChart as seriesChartRecipe,
    seriesChartConfig,
    seriesTable,
    type ChartTheme,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId } from 'vue';
import Slider from '../components/Slider/Slider.vue';
import ChartCanvas from './ChartCanvas.vue';
import type { SeriesChartBaseProps } from './types.js';
import { useLocale } from '../locale.js';
import { useRecipe } from '../recipes.js';

// Internal: BarChart, LineChart and CompositeChart

interface Props extends SeriesChartBaseProps {
    kind: 'bar' | 'line' | 'composite';
    horizontal?: boolean;
    stacked?: boolean;
    curved?: boolean;
    area?: boolean;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<Props>(), {
    height: '18rem',
    table: true,
    legend: undefined,
    range: undefined,
    defaultRange: undefined,
});
const emit = defineEmits<{ 'update:range': [range: [number, number]] }>();
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chart);
const styles = useRecipe('chart', chartRecipe, () => props.classes)();
const parts = useRecipe('seriesChart', seriesChartRecipe)();
const id = useId();
const format = computed(() => props.formatValue ?? ((value: number) => value.toLocaleString(locale.value.locale)));
const internalRange = ref<[number, number] | undefined>(props.defaultRange);
const shownRange = computed(() =>
    props.brush ? clampRange(props.range ?? internalRange.value, props.data.length) : undefined
);
const series = computed(() =>
    props.area ? props.series.map((entry) => ({ ...entry, area: entry.area ?? true })) : props.series
);
const build = computed(() => (theme: ChartTheme, reducedMotion: boolean) => {
    const config = seriesChartConfig(
        {
            kind: props.kind,
            data: props.data,
            categoryKey: props.categoryKey,
            series: series.value,
            horizontal: props.horizontal,
            stacked: props.stacked,
            scale: props.scale,
            curved: props.curved,
            references: props.references,
            range: shownRange.value,
            legend: props.legend,
        },
        theme,
        format.value,
        reducedMotion,
        locale.value.locale
    );
    return { ...config, options: mergeOptions(config.options, props.options), plugins: [referencePlugin] };
});
// The overview below: the first series as a thin line over all rows, without axes
const overview = computed(() => (theme: ChartTheme) => {
    const config = seriesChartConfig(
        {
            kind: 'line',
            data: props.data,
            categoryKey: props.categoryKey,
            series: series.value.slice(0, 1),
            legend: false,
        },
        theme,
        format.value,
        true,
        locale.value.locale
    );
    return {
        ...config,
        options: mergeOptions(config.options, {
            scales: { x: { display: false }, y: { display: false } },
            plugins: { tooltip: { enabled: false } },
            elements: { point: { radius: 0 } },
            events: [],
        }),
    };
});
const labels = computed(() => props.data.map((row) => String(row[props.categoryKey] ?? '')));
function setRange(value: number[]) {
    const next = clampRange([value[0] ?? 0, value[1] ?? 0], props.data.length);
    internalRange.value = next;
    emit('update:range', next);
}
const rows = computed(() => seriesTable(props.data, props.categoryKey, series.value, format.value, shownRange.value));
const referenceText = computed(() =>
    props.references?.length ? referenceSummary(props.references, format.value) : ''
);
</script>

<template>
    <figure :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <figcaption :id="`${id}title`" :class="hideTitle ? styles.caption() : styles.title()">{{ title }}</figcaption>
        <div :class="styles.canvasBox()" :style="{ height }">
            <ChartCanvas :build="build" :labelledby="`${id}title`" />
        </div>
        <p v-if="referenceText" :class="parts.references()">{{ t.references }}: {{ referenceText }}</p>
        <div v-if="brush && data.length > 1" :class="parts.brush()">
            <div :class="parts.brushCanvas()"><ChartCanvas :build="overview" /></div>
            <Slider
                :model-value="shownRange"
                :min="0"
                :max="data.length - 1"
                :step="1"
                :min-range="1"
                :label="t.brush"
                :thumb-labels="t.brushThumbs"
                :format-value="(index: number) => labels[index] ?? ''"
                show-value
                @update:model-value="setRange"
            />
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
                            <th v-for="column in rows.columns" :key="column" scope="col" :class="styles.th()">
                                {{ column }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in rows.rows" :key="index">
                            <th scope="row" :class="styles.rowHeader()">{{ row.label }}</th>
                            <td v-for="(value, column) in row.values" :key="column" :class="styles.td()">
                                {{ value }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    </figure>
</template>
