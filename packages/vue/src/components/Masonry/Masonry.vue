<script setup lang="ts">
import {
    columnVariables,
    masonry as masonryRecipe,
    masonrySpan,
    type RecipeClasses,
    type ResponsiveColumns,
} from '@wirecore/wirelayer-recipes';
import {
    computed,
    normalizeClass,
    normalizeStyle,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    useAttrs,
    useTemplateRef,
    watch,
} from 'vue';
import { useRecipe } from '../../recipes.js';

export interface MasonryProps {
    /** Columns: a number or per breakpoint, e.g. { base: 1, sm: 2, lg: 3 } (default 2) */
    columns?: ResponsiveColumns;
    /** Space between the cards: sm (8px), md (16px, default), lg (24px) */
    gap?: 'sm' | 'md' | 'lg';
    /**
     * `columns` (default): CSS columns, filled top to bottom – no JavaScript. `rows`: measured grid rows, filled left
     * to right like reading. Both keep the order of the children for screen readers and the keyboard.
     */
    mode?: 'columns' | 'rows';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof masonryRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MasonryProps>(), { columns: 2, mode: 'columns' });
const masonry = useRecipe('masonry', masonryRecipe, () => props.classes);
const attrs = useAttrs();
const style = computed(() => [columnVariables(props.columns), normalizeStyle(attrs.style)]);
const gapPx = { sm: 8, md: 16, lg: 24 };
const element = useTemplateRef<HTMLElement>('element');

// rows: every child spans as many 4px rows as it is high (plus the gap)
let observer: ResizeObserver | undefined;
function measure() {
    observer?.disconnect();
    const root = element.value;
    if (!root || props.mode !== 'rows') {
        for (const child of root?.children ?? []) (child as HTMLElement).style.removeProperty('grid-row-end');
        return;
    }
    const layout = () => {
        for (const child of root.children) {
            const item = child as HTMLElement;
            item.style.gridRowEnd = `span ${masonrySpan(item.getBoundingClientRect().height, 4, gapPx[props.gap ?? 'md'])}`;
        }
    };
    observer = new ResizeObserver(layout);
    for (const child of root.children) observer.observe(child);
    layout();
}
onMounted(measure);
// New or removed children
onUpdated(measure);
watch(() => [props.mode, props.gap], measure, { flush: 'post' });
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
    <!-- Cards of different heights in columns; the order of the children stays the reading order -->
    <div
        ref="element"
        v-bind="{
            ...attrs,
            class: masonry({ gap, measured: mode === 'rows', class: normalizeClass(attrs.class) }),
            style,
        }"
    >
        <slot />
    </div>
</template>
