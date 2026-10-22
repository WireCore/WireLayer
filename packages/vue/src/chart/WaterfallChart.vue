<script setup lang="ts">
import {
    chart as chartRecipe,
    mergeOptions,
    waterfallBars,
    waterfallConfig,
    type ChartTheme,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import ChartCanvas from './ChartCanvas.vue';
import type { WaterfallChartProps } from './types.js';
import { useLocale } from '../locale.js';
import { useRecipe } from '../recipes.js';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<WaterfallChartProps>(), { hideTitle: false, height: '18rem', table: true });
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chart);
const styles = useRecipe('chart', chartRecipe, () => props.classes)();
const id = useId();
const format = computed(() => props.formatValue ?? ((value: number) => value.toLocaleString(locale.value.locale)));
const build = computed(() => (theme: ChartTheme, reducedMotion: boolean) => {
    const config = waterfallConfig(
        props.steps,
        theme,
        format.value,
        t.value,
        props.tones,
        reducedMotion,
        locale.value.locale
    );
    return { ...config, options: mergeOptions(config.options, props.options) };
});
const rows = computed(() => waterfallBars(props.steps));
</script>

<template>
    <!-- Floating bars: each change starts where the previous one ended, totals from zero; the table is the text -->
    <figure :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <figcaption :id="`${id}title`" :class="hideTitle ? styles.caption() : styles.title()">{{ title }}</figcaption>
        <div :class="styles.canvasBox()" :style="{ height }">
            <ChartCanvas :build="build" :labelledby="`${id}title`" />
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
                            <th scope="col" :class="styles.th()">{{ t.change }}</th>
                            <th scope="col" :class="styles.th()">{{ t.total }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(row, index) in rows" :key="index">
                            <th scope="row" :class="styles.rowHeader()">{{ row.label }}</th>
                            <td :class="styles.td()">{{ row.kind === 'total' ? '–' : format(row.change) }}</td>
                            <td :class="styles.td()">{{ format(row.sum) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    </figure>
</template>
