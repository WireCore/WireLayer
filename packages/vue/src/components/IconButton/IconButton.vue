<script setup lang="ts">
import {
    buttonColorKey,
    formatCount,
    iconButton as iconButtonRecipe,
    type ButtonColor,
    type ButtonShape,
    type ButtonSize,
    type IconButtonVariant,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface IconButtonProps {
    /** Icon component */
    icon: Component;
    /** Props passed on to the icon component, e.g. { fill: 'currentColor' } for a filled icon or { strokeWidth: 1.5 } */
    iconProps?: Record<string, unknown>;
    /** Accessible name – icon buttons have no visible text */
    label: string;
    variant?: IconButtonVariant;
    /** Colour combined with the variant, like Button `color` (e.g. a danger text button) */
    color?: ButtonColor;
    /** `xs` is 24px – the minimum target size (WCAG 2.5.8) */
    size?: ButtonSize;
    /** Corner shape: `pill` (round, default), `rounded` or `square` */
    shape?: ButtonShape;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    /** Counter (number > 0) or dot (true) in the top-right corner */
    badge?: number | boolean;
    /**
     * Appended to the accessible name while a badge is shown, e.g. "Notifications, 4 new".
     * Receives the visible counter text ("4", "99+") or null for the dot – the visible text must stay
     * part of the name (WCAG 2.5.3).
     */
    badgeLabel?: (count: string | null) => string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof iconButtonRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<IconButtonProps>(), {
    type: 'button',
    badgeLabel: (count: string | null) => (count === null ? 'new' : `${count} new`),
});
const iconButton = useRecipe('iconButton', iconButtonRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() =>
    iconButton({ variant: props.variant, color: buttonColorKey(props.color), size: props.size, shape: props.shape })
);

const count = computed(() => (typeof props.badge === 'number' && props.badge > 0 ? props.badge : 0));
const accessibleName = computed(() => {
    if (count.value) return `${props.label}, ${props.badgeLabel(formatCount(count.value))}`;
    if (props.badge === true) return `${props.label}, ${props.badgeLabel(null)}`;
    return props.label;
});
</script>

<template>
    <button
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :type="type"
        :disabled="disabled"
        :aria-label="accessibleName"
    >
        <component :is="icon" v-bind="iconProps" :class="styles.icon()" aria-hidden="true" />
        <span v-if="count" :class="styles.badge()" aria-hidden="true">{{ formatCount(count) }}</span>
        <span v-else-if="badge === true" :class="styles.dot()" aria-hidden="true" />
    </button>
</template>
