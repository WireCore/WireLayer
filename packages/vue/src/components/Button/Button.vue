<script setup lang="ts">
import { ark } from '@ark-ui/vue/factory';
import { LoaderCircle } from '@lucide/vue';
import {
    button as buttonRecipe,
    buttonColorKey,
    formatCount,
    type ButtonColor,
    type ButtonShape,
    type ButtonSize,
    type ButtonVariant,
    type RecipeClasses,
    spinner as spinnerRecipe,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ButtonProps {
    variant?: ButtonVariant;
    /**
     * Colour combined with the variant: with `outline`, `text`, `soft` and `link` it colours that style (e.g. a
     * danger text button), with a filled variant it replaces the fill
     */
    color?: ButtonColor;
    size?: ButtonSize;
    /** Corner shape: `pill` (default), `rounded` or `square` */
    shape?: ButtonShape;
    /** Full width of the container */
    block?: boolean;
    /** Icon component rendered before the label */
    leadingIcon?: Component;
    /** Icon component rendered after the label */
    trailingIcon?: Component;
    /** Shows a spinner and ignores clicks; stays focusable (aria-disabled + aria-busy) so focus is not lost */
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    /** Counter (number > 0) or dot (true) after the label */
    badge?: number | boolean;
    /**
     * Added to the accessible name while a badge is shown, e.g. "Notifications 4 new". Receives the visible counter
     * text ("4", "99+") or null for the dot
     */
    badgeLabel?: (count: string | null) => string;
    /** Render the slotted element (e.g. a link) with button styles instead of a <button> */
    asChild?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof buttonRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ButtonProps>(), {
    type: 'button',
    block: undefined,
    badgeLabel: (count: string | null) => (count === null ? 'new' : `${count} new`),
});
const button = useRecipe('button', buttonRecipe, () => props.classes);
const spinner = useRecipe('spinner', spinnerRecipe);
const attrs = useAttrs();
const styles = computed(() =>
    button({
        variant: props.variant,
        color: buttonColorKey(props.color),
        size: props.size,
        shape: props.shape,
        block: props.block,
    })
);
const count = computed(() => (typeof props.badge === 'number' && props.badge > 0 ? props.badge : 0));

type ClickHandler = (event: MouseEvent) => void;

function onClick(event: MouseEvent) {
    if (props.loading) {
        event.preventDefault();
        return;
    }
    [attrs.onClick as ClickHandler | ClickHandler[] | undefined].flat().forEach((handler) => handler?.(event));
}
</script>

<template>
    <ark.button
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }), onClick }"
        :as-child="asChild"
        :type="asChild ? undefined : type"
        :disabled="asChild ? undefined : disabled"
        :aria-disabled="loading || undefined"
        :aria-busy="loading || undefined"
    >
        <slot v-if="asChild" />
        <template v-else>
            <LoaderCircle v-if="loading" :class="spinner().icon({ class: styles.icon() })" aria-hidden="true" />
            <component :is="leadingIcon" v-else-if="leadingIcon" :class="styles.icon()" aria-hidden="true" />
            <slot />
            <component :is="trailingIcon" v-if="trailingIcon" :class="styles.icon()" aria-hidden="true" />
            <template v-if="count">
                <span :class="styles.badge()" aria-hidden="true">{{ formatCount(count) }}</span>
                <span :class="styles.badgeLabel()">{{ ` ${badgeLabel(formatCount(count))}` }}</span>
            </template>
            <template v-else-if="badge === true">
                <span :class="styles.dot()" aria-hidden="true" />
                <span :class="styles.badgeLabel()">{{ ` ${badgeLabel(null)}` }}</span>
            </template>
        </template>
    </ark.button>
</template>
