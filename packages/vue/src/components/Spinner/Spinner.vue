<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue';
import { type RecipeClasses, type Size, spinner as spinnerRecipe } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface SpinnerProps {
    size?: Size;
    /** Text announced to screen readers (live region) */
    label?: string;
    /** Fixed progress 0–100: a ring that fills up instead of turning (a progress bar) */
    value?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof spinnerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<SpinnerProps>();
const spinner = useRecipe('spinner', spinnerRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => spinner({ size: props.size }));
const share = computed(() => Math.min(100, Math.max(0, props.value ?? 0)));
const circumference = 2 * Math.PI * 9;
</script>

<template>
    <!-- A fixed value: a ring as progress bar (named by the label, the value as text) -->
    <span
        v-if="value !== undefined"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="progressbar"
        :aria-label="label ?? translations.common.loading"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="share"
        :aria-valuetext="`${Math.round(share)} %`"
    >
        <svg :class="styles.ring()" viewBox="0 0 24 24" aria-hidden="true">
            <circle :class="styles.ringTrack()" cx="12" cy="12" r="9" stroke-width="3" />
            <circle
                :class="styles.ringRange()"
                cx="12"
                cy="12"
                r="9"
                stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="`${(share / 100) * circumference} ${circumference}`"
            />
        </svg>
    </span>
    <span v-else v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }" role="status">
        <LoaderCircle :class="styles.icon()" aria-hidden="true" />
        <span :class="styles.label()">{{ label ?? translations.common.loading }}</span>
    </span>
</template>
