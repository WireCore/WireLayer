<script setup lang="ts">
import { divider as dividerRecipe, type DividerOrientation, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface DividerProps {
    orientation?: DividerOrientation;
    /** Line style: `solid` (default), `dashed` or `dotted` */
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    /** Where the label sits: at the `start`, in the `center` (default) or at the `end` */
    labelPosition?: 'start' | 'center' | 'end';
    /** Text in the middle, e.g. "or" – read as normal text, the lines are decorative (also via #label) */
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dividerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<DividerProps>(), { orientation: 'horizontal' });
const divider = useRecipe('divider', dividerRecipe, () => props.classes);
const slots = defineSlots<{ label?: () => unknown }>();
const attrs = useAttrs();
const hasLabel = computed(() => !!props.label || !!slots.label);
const styles = computed(() =>
    divider({
        orientation: props.orientation,
        plain: !hasLabel.value,
        lineStyle: props.lineStyle,
        labelPosition: props.labelPosition,
    })
);
const className = computed(() => styles.value.base({ class: normalizeClass(attrs.class) }));
</script>

<template>
    <div
        v-if="!hasLabel"
        role="separator"
        :aria-orientation="orientation === 'vertical' ? 'vertical' : undefined"
        v-bind="{ ...attrs, class: className }"
    />
    <div v-else v-bind="{ ...attrs, class: className }">
        <span :class="styles.line()" aria-hidden="true" />
        <span :class="styles.label()"
            ><slot name="label">{{ label }}</slot></span
        >
        <span :class="styles.line()" aria-hidden="true" />
    </div>
</template>
