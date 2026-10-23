<script setup lang="ts">
import {
    readChartTheme,
    type RecipeClasses,
    sparkline as sparklineRecipe,
    sparklineSummary,
    themeChartOptions,
} from '@wirecore/wirelayer-recipes';
import { Chart } from 'chart.js/auto';
import { computed, normalizeClass, onBeforeUnmount, onMounted, useAttrs, useTemplateRef, watch } from 'vue';
import { useLocale, useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';

export interface SparklineProps {
    data: number[];
    /** What the line shows, e.g. "Load over the last 24 hours" – starts the text alternative */
    label: string;
    /** Area under the line */
    fill?: boolean;
    width?: string;
    height?: string;
    formatValue?: (value: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sparklineRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SparklineProps>(), {
    fill: true,
    width: '8rem',
    height: '2rem',
});
const sparkline = useRecipe('sparkline', sparklineRecipe, () => props.classes);
const attrs = useAttrs();
const localeContext = useLocale();
const translations = useTranslations();
const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
// The canvas is an image named by the trend and the extremes
const format = computed(
    () => props.formatValue ?? ((value: number) => value.toLocaleString(localeContext.value.locale))
);
const summary = computed(() => sparklineSummary(props.label, props.data, format.value, translations.chart));
let instance: Chart<'line'> | undefined;
let observer: MutationObserver | undefined;
// Without data-mode the page follows the system – recolour when it switches
let scheme: MediaQueryList | undefined;

function config() {
    const theme = readChartTheme(canvas.value!);
    const color = theme.palette[0]!;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
        data: {
            labels: props.data.map((_, index) => index),
            datasets: [
                {
                    data: [...props.data],
                    borderColor: color,
                    backgroundColor: color.replace(/[\d.]+\)$/, '0.15)'),
                    borderWidth: 1.5,
                    fill: props.fill,
                    pointRadius: 0,
                    tension: 0.35,
                },
            ],
        },
        options: themeChartOptions(
            'line',
            theme,
            {
                scales: { x: { display: false }, y: { display: false } },
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                events: [],
            },
            reducedMotion,
            localeContext.value.locale
        ),
    };
}

function update() {
    if (!instance) return;
    Object.assign(instance, config());
    instance.update();
}

onMounted(() => {
    const context = canvas.value?.getContext('2d');
    if (context) instance = new Chart(context, { type: 'line', ...config() } as never);
    observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true });
    scheme = matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', update);
});
onBeforeUnmount(() => {
    observer?.disconnect();
    scheme?.removeEventListener('change', update);
    instance?.destroy();
});
watch(() => [...props.data], update);
</script>

<template>
    <span :class="sparkline({ class: normalizeClass(attrs.class) })" :style="[{ width, height }, attrs.style]">
        <canvas ref="canvas" role="img" :aria-label="summary" />
    </span>
</template>
