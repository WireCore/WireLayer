<script setup lang="ts">
import {
    barsList as barsListRecipe,
    barsListWidths,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface BarsListItem {
    label: string;
    value: number;
    /** Makes the label a link */
    href?: string;
    /** Colour of the bar (default: the list's tone) */
    tone?: VisualTone;
}

export interface BarsListProps {
    items: BarsListItem[];
    /** Accessible name of the list (visible with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** Value of a full bar (default: the largest value) */
    max?: number;
    /** Colour of the bars (default primary) */
    tone?: VisualTone;
    /** Column headings above the list, e.g. "Page" and "Views" */
    labelHeader?: string;
    valueHeader?: string;
    /** Formats the values (default: numbers in the locale) */
    formatValue?: (value: number) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof barsListRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<BarsListProps>(), { tone: 'primary' });
const barsList = useRecipe('barsList', barsListRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const id = useId();
const styles = computed(() => barsList({ tone: props.tone }));
const rows = computed(() => {
    const widths = barsListWidths(
        props.items.map((item) => item.value),
        props.max
    );
    const format = props.formatValue ?? ((value: number) => value.toLocaleString(locale.value.locale));
    return props.items.map((item, index) => ({
        ...item,
        text: format(item.value),
        width: `${widths[index]}%`,
        bar: barsList({ tone: item.tone ?? props.tone }).bar(),
    }));
});
</script>

<template>
    <!-- A list of labels and values; the bars behind the labels show the values as lengths -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <p v-if="showTitle" :id="`${id}title`" :class="styles.title()">{{ label }}</p>
        <div v-if="labelHeader || valueHeader" :class="styles.header()" aria-hidden="true">
            <span>{{ labelHeader }}</span
            ><span>{{ valueHeader }}</span>
        </div>
        <ul
            role="list"
            :class="styles.list()"
            :aria-label="showTitle ? undefined : label"
            :aria-labelledby="showTitle ? `${id}title` : undefined"
        >
            <li v-for="row in rows" :key="row.label" :class="styles.item()">
                <span :class="row.bar" :style="{ width: row.width }" aria-hidden="true" />
                <span :class="styles.label()">
                    <a v-if="row.href" :href="row.href" :class="styles.link()">{{ row.label }}</a>
                    <template v-else>{{ row.label }}</template>
                </span>
                <span :class="styles.value()">{{ row.text }}</span>
            </li>
        </ul>
    </div>
</template>
