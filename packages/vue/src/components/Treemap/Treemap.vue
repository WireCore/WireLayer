<script setup lang="ts">
import {
    squarify,
    toneAt,
    treemap as treemapRecipe,
    type RecipeClasses,
    type VisualTone,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';
import { useLocale, useTranslations } from '../../locale.js';

export interface TreemapItem {
    label: string;
    value: number;
    /** Colour of the tile (default: in turn) */
    tone?: VisualTone;
}

export interface TreemapProps {
    items: TreemapItem[];
    /** Accessible name of the list (and visible title with `showTitle`) */
    label: string;
    showTitle?: boolean;
    /** Height of the area (CSS length) */
    height?: string;
    /** Width to height of the area the tiles are laid out for */
    ratio?: number;
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof treemapRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TreemapProps>(), { height: '320px', ratio: 2 });
const treemap = useRecipe('treemap', treemapRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => treemap());
const localeContext = useLocale();
const t = useTranslations().treemap;

const total = computed(() => props.items.reduce((sum, item) => sum + Math.max(0, item.value), 0));
const tiles = computed(() => {
    const rects = squarify(
        props.items.map((item) => item.value),
        props.ratio * 100,
        100
    );
    const locale = props.locale ?? localeContext.value.locale;
    const number = new Intl.NumberFormat(locale, props.formatOptions);
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
    return props.items.map((item, index) => ({
        ...item,
        tone: item.tone ?? toneAt(index),
        text: t.share(number.format(item.value), percent.format(total.value ? item.value / total.value : 0)),
        style: {
            left: `${rects[index]!.x / props.ratio}%`,
            top: `${rects[index]!.y}%`,
            width: `${rects[index]!.width / props.ratio}%`,
            height: `${rects[index]!.height}%`,
        },
    }));
});
</script>

<template>
    <!-- A list of the items with value and share; the tiles show the shares as areas -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <p v-if="showTitle" :class="styles.title()" aria-hidden="true">{{ label }}</p>
        <ul role="list" :aria-label="label" :class="styles.list()" :style="{ height }">
            <li
                v-for="tile in tiles"
                :key="tile.label"
                :class="treemap({ tone: tile.tone }).tile()"
                :style="tile.style"
                :title="`${tile.label}: ${tile.text}`"
            >
                <span :class="styles.tileLabel()">{{ tile.label }}</span>
                <span :class="styles.tileValue()">{{ tile.text }}</span>
            </li>
        </ul>
    </div>
</template>
