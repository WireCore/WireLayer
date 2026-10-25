<script setup lang="ts">
import { readChartTheme, type ChartTheme } from '@wirecore/wirelayer-recipes';
import { Chart, type ChartConfiguration } from 'chart.js/auto';
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';

// Internal: the canvas of the ready-made charts – creates the Chart.js instance from `build` and recolours it when
// theme, mode or the motion preference change

export interface ChartBuild {
    type: string;
    data: unknown;
    options: Record<string, unknown>;
    plugins?: readonly unknown[];
}

const props = defineProps<{
    /** Chart.js configuration from the token colours */
    build: (theme: ChartTheme, reducedMotion: boolean) => ChartBuild;
    /** Id of the title that names the canvas; without it the canvas is decorative */
    labelledby?: string;
}>();
const canvas = useTemplateRef<HTMLCanvasElement>('canvas');
let instance: Chart | undefined;
let observer: MutationObserver | undefined;
let motion: MediaQueryList | undefined;
// Without data-mode the page follows the system – recolour when it switches
let scheme: MediaQueryList | undefined;

const config = () => props.build(readChartTheme(canvas.value!), !!motion?.matches) as unknown as ChartConfiguration;
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
    if (next.type !== (instance.config as { type?: string }).type) return create();
    instance.data = next.data;
    instance.options = next.options ?? {};
    instance.update();
}
onMounted(() => {
    motion = matchMedia('(prefers-reduced-motion: reduce)');
    create();
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
watch(() => props.build, update);
</script>

<template>
    <canvas v-if="labelledby" ref="canvas" role="img" :aria-labelledby="labelledby" />
    <canvas v-else ref="canvas" aria-hidden="true" />
</template>
