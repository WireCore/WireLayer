<script setup lang="ts">
import {
    bulletChart as bulletChartRecipe,
    bulletScale,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface BulletChartProps {
    /** Name of the measure, e.g. "Revenue" */
    label: string;
    /** Smaller text below the name, e.g. the unit */
    description?: string;
    value: number;
    /** End of the scale */
    max: number;
    /** Start of the scale (default 0) */
    min?: number;
    /** Target value: a marker across the bar */
    target?: number;
    /** Upper limits of the qualitative bands (e.g. poor, fair, good), shown as shades behind the bar */
    ranges?: number[];
    /** Colour of the bar (default primary) */
    tone?: VisualTone;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof bulletChartRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<BulletChartProps>(), { min: 0, tone: 'primary' });
const bulletChart = useRecipe('bulletChart', bulletChartRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chart);
const id = useId();
const styles = computed(() => bulletChart({ tone: props.tone }));
const format = computed(() => props.formatValue ?? ((value: number) => value.toLocaleString(locale.value.locale)));
const scale = computed(() =>
    bulletScale({ value: props.value, target: props.target, min: props.min, max: props.max, ranges: props.ranges })
);
const valueText = computed(() =>
    t.value.bulletValue(
        format.value(props.value),
        format.value(props.max),
        props.target === undefined ? undefined : format.value(props.target)
    )
);
</script>

<template>
    <!-- A meter (role="meter") with the value, the end of the scale and the target as its text -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div :class="styles.header()">
            <span :id="`${id}label`" :class="styles.label()">{{ label }}</span>
            <span v-if="description" :id="`${id}description`" :class="styles.description()">{{ description }}</span>
        </div>
        <div
            role="meter"
            :aria-labelledby="`${id}label`"
            :aria-describedby="description ? `${id}description` : undefined"
            :aria-valuemin="min"
            :aria-valuemax="max"
            :aria-valuenow="value"
            :aria-valuetext="valueText"
            :class="styles.meter()"
        >
            <span
                v-for="band in scale.bands"
                :key="band.band"
                :class="styles.band()"
                :data-band="band.band"
                :style="{ width: `${band.width}%` }"
            />
            <span :class="styles.bar()" :style="{ width: `${scale.value}%` }" />
            <span
                v-if="scale.target !== undefined"
                :class="styles.target()"
                :style="{ insetInlineStart: `${scale.target}%` }"
            />
        </div>
        <div :class="styles.values()" aria-hidden="true">
            <span :class="styles.current()">{{ format(value) }}</span>
            <span v-if="target !== undefined">{{ t.target }}: {{ format(target) }}</span>
            <span>{{ format(max) }}</span>
        </div>
    </div>
</template>
