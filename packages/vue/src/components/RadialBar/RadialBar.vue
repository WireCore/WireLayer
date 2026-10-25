<script setup lang="ts">
import {
    radialBar as radialBarRecipe,
    radialBarRings,
    toneAt,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface RadialBarItem {
    label: string;
    value: number;
    /** End of this ring's scale (default: the chart's `max`) */
    max?: number;
    /** Colour of the ring (default: in turn) */
    tone?: VisualTone;
}

export interface RadialBarProps {
    /** One ring per item, the first outermost */
    items: readonly RadialBarItem[];
    /** Accessible name (visible with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** End of the scale (default 100) */
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    /** Formats the value in the legend (default: the share in percent) */
    formatValue?: (value: number, max: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof radialBarRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RadialBarProps>(), { max: 100, size: 'md' });
const radialBar = useRecipe('radialBar', radialBarRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const id = useId();
const styles = computed(() => radialBar({ size: props.size }));
const rings = computed(() => {
    const parts = radialBarRings(props.items, { max: props.max });
    const percent = new Intl.NumberFormat(locale.value.locale, { style: 'percent', maximumFractionDigits: 1 });
    return props.items.map((item, index) => {
        const part = parts[index]!;
        const tone = item.tone ?? toneAt(index);
        const max = item.max ?? props.max;
        return {
            ...item,
            ...part,
            text: props.formatValue ? props.formatValue(item.value, max) : percent.format(part.share),
            ring: radialBar({ tone }).ring(),
            swatch: radialBar({ tone }).swatch(),
        };
    });
});
</script>

<template>
    <!-- Rings (decorative) and a legend with the values as the text (a named group) -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="group"
        :aria-label="showTitle ? undefined : label"
        :aria-labelledby="showTitle ? `${id}title` : undefined"
    >
        <p v-if="showTitle" :id="`${id}title`" :class="styles.title()">{{ label }}</p>
        <div :class="styles.chart()">
            <svg :class="styles.svg()" viewBox="0 0 100 100" aria-hidden="true">
                <template v-for="ring in rings" :key="ring.label">
                    <circle :class="styles.track()" cx="50" cy="50" :r="ring.radius" :stroke-width="ring.thickness" />
                    <circle
                        :class="ring.ring"
                        cx="50"
                        cy="50"
                        :r="ring.radius"
                        :stroke-width="ring.thickness"
                        stroke-linecap="round"
                        :stroke-dasharray="`${ring.dash} ${ring.circumference}`"
                    />
                </template>
            </svg>
        </div>
        <ul role="list" :class="styles.legend()">
            <li v-for="ring in rings" :key="ring.label" :class="styles.legendItem()">
                <span :class="ring.swatch" aria-hidden="true" />{{ ring.label
                }}<span :class="styles.legendValue()">{{ ring.text }}</span>
            </li>
        </ul>
    </div>
</template>
