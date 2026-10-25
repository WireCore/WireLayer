<script setup lang="ts">
import {
    chart as chartRecipe,
    funnel as funnelRecipe,
    funnelStages,
    type FunnelStage,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FunnelProps {
    /** The stages, widest first */
    stages: readonly FunnelStage[];
    /** Title, also the accessible name of the funnel */
    title: string;
    /** The title only for screen readers */
    hideTitle?: boolean;
    /** Colour of the bars (default primary) */
    tone?: VisualTone;
    /** Conversion from the previous stage between the bars (default true) */
    conversion?: boolean;
    /** The stages as a table below (opens on demand) – the text alternative (default true) */
    table?: boolean;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof funnelRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FunnelProps>(), { tone: 'primary', conversion: true, table: true });
const funnel = useRecipe('funnel', funnelRecipe, () => props.classes);
const chart = useRecipe('chart', chartRecipe);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chart);
const id = useId();
const styles = computed(() => funnel({ tone: props.tone }));
const tableStyles = chart();
const rows = computed(() => {
    const format = props.formatValue ?? ((value: number) => value.toLocaleString(locale.value.locale));
    const percent = new Intl.NumberFormat(locale.value.locale, { style: 'percent', maximumFractionDigits: 1 });
    return funnelStages(props.stages).map((stage) => ({
        ...stage,
        text: format(stage.value),
        conversionText: stage.fromPrevious === undefined ? undefined : percent.format(stage.fromPrevious),
        firstText: stage.fromFirst === undefined ? '–' : percent.format(stage.fromFirst),
    }));
});
</script>

<template>
    <!-- Bars narrowing with the value (an image named by the title); the table is the text alternative -->
    <figure v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <figcaption :id="`${id}title`" :class="hideTitle ? tableStyles.caption() : styles.title()">
            {{ title }}
        </figcaption>
        <div role="img" :aria-labelledby="`${id}title`" :class="styles.stages()">
            <template v-for="row in rows" :key="row.label">
                <div v-if="conversion && row.conversionText" :class="styles.conversion()">
                    {{ t.fromPrevious(row.conversionText) }}
                </div>
                <div :class="styles.stage()">
                    <span :class="styles.label()">{{ row.label }}</span>
                    <div :class="styles.track()"><div :class="styles.bar()" :style="{ width: `${row.width}%` }" /></div>
                    <span :class="styles.value()">{{ row.text }}</span>
                </div>
            </template>
        </div>
        <details v-if="table" :class="tableStyles.details()">
            <summary :class="tableStyles.summary()">{{ t.showTable }}</summary>
            <div :class="tableStyles.scroll()">
                <table :class="tableStyles.table()">
                    <caption :class="tableStyles.caption()">
                        {{
                            title
                        }}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col" :class="tableStyles.th()">{{ t.stage }}</th>
                            <th scope="col" :class="tableStyles.th()">{{ t.value }}</th>
                            <th scope="col" :class="tableStyles.th()">{{ t.conversion }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.label">
                            <th scope="row" :class="tableStyles.rowHeader()">{{ row.label }}</th>
                            <td :class="tableStyles.td()">{{ row.text }}</td>
                            <td :class="tableStyles.td()">{{ row.conversionText ?? '–' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </details>
    </figure>
</template>
