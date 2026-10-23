<script setup lang="ts" generic="TType extends ChartType">
import {
    chart as chartRecipe,
    type RecipeClasses,
    chartTable,
    readChartTheme,
    themeChartData,
    themeChartOptions,
} from '@wirecore/wirelayer-recipes';
import { Chart, type ChartData, type ChartOptions, type ChartType } from 'chart.js/auto';
import {
    computed,
    normalizeClass,
    onBeforeUnmount,
    onMounted,
    toRaw,
    useAttrs,
    useId,
    useTemplateRef,
    watch,
} from 'vue';
import { useLocale, useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';

export interface ChartProps<TType extends ChartType> {
    type: TType;
    data: ChartData<TType>;
    /** Chart.js options – merged over the WireLayer defaults (colours, font, no fixed aspect ratio) */
    options?: ChartOptions<TType>;
    /** Title of the chart, also its accessible name */
    title: string;
    /** Keep the title for screen readers only, e.g. inside a card that already has a heading */
    hideTitle?: boolean;
    /** Height of the chart area (CSS length) */
    height?: string;
    /** The data as a table below the chart (opens on demand) – the text alternative for the canvas */
    table?: boolean;
    formatValue?: (value: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chartRecipe>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const translations = useTranslations();
const props = withDefaults(defineProps<ChartProps<TType>>(), {
    options: undefined,
    hideTitle: false,
    height: '18rem',
    table: true,
});
const attrs = useAttrs();
const styles = useRecipe('chart', chartRecipe, () => props.classes)();
const id = useId();
const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
const format = computed(
    () => props.formatValue ?? ((value: number) => value.toLocaleString(localeContext.value.locale))
);
const rows = computed(() => chartTable(props.data, format.value, translations.chart));
let instance: Chart<TType> | undefined;
let observer: MutationObserver | undefined;
let motion: MediaQueryList | undefined;
// Without data-mode the page follows the system – recolour when it switches
let scheme: MediaQueryList | undefined;

function config() {
    const theme = readChartTheme(canvas.value!);
    return {
        type: props.type,
        data: themeChartData(props.type, toRaw(props.data), theme),
        options: themeChartOptions(
            props.type,
            theme,
            toRaw(props.options),
            !!motion?.matches,
            localeContext.value.locale
        ) as ChartOptions<TType>,
    };
}

function create() {
    instance?.destroy();
    instance = undefined;
    // No 2D context outside a real browser (e.g. jsdom) – the table still renders
    const context = canvas.value?.getContext('2d');
    if (context) instance = new Chart(context, config());
}

function update() {
    if (!instance) return create();
    const next = config();
    instance.data = next.data;
    instance.options = next.options;
    instance.update();
}

onMounted(() => {
    motion = matchMedia('(prefers-reduced-motion: reduce)');
    create();
    // Theme and mode live on <html> (data-theme, data-mode) – recolour when they change
    observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true });
    motion.addEventListener('change', update);
    scheme = matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', update);
});
onBeforeUnmount(() => {
    observer?.disconnect();
    motion?.removeEventListener('change', update);
    scheme?.removeEventListener('change', update);
    instance?.destroy();
});
watch(() => props.type, create);
watch([() => props.data, () => props.options], update, { deep: true });
</script>

<template>
    <!-- Canvas with role="img" named by the title; the data table is its text alternative (WCAG 1.1.1) -->
    <figure :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <figcaption :id="`${id}title`" :class="hideTitle ? styles.caption() : styles.title()">{{ title }}</figcaption>
        <div :class="styles.canvasBox()" :style="{ height }">
            <canvas ref="canvas" role="img" :aria-labelledby="`${id}title`" />
        </div>
        <details v-if="table" :class="styles.details()">
            <summary :class="styles.summary()">{{ translations.chart.showTable }}</summary>
            <div :class="styles.scroll()">
                <table :class="styles.table()">
                    <caption :class="styles.caption()">
                        {{
                            title
                        }}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col" :class="styles.th()">{{ translations.chart.category }}</th>
                            <th v-for="column in rows.columns" :key="column" scope="col" :class="styles.th()">
                                {{ column }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows.rows" :key="row.label">
                            <th scope="row" :class="styles.rowHeader()">{{ row.label }}</th>
                            <td v-for="(value, index) in row.values" :key="index" :class="styles.td()">{{ value }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    </figure>
</template>
