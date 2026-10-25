<script setup lang="ts">
import { countdown as countdownRecipe, countdownParts, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export type CountdownUnit = 'days' | 'hours' | 'minutes' | 'seconds';

export interface CountdownProps {
    /** End point: ISO string ("2026-12-24T18:00"), timestamp or Date */
    target: string | number | Date;
    /** Accessible name of the timer, e.g. "Offer ends in" */
    label: string;
    /** Shown units, largest first – the largest takes everything above it (e.g. 49 hours without days) */
    units?: readonly CountdownUnit[];
    variant?: 'boxed' | 'plain';
    size?: 'sm' | 'md' | 'lg';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof countdownRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CountdownProps>(), {
    units: () => ['days', 'hours', 'minutes', 'seconds'],
});
const countdown = useRecipe('countdown', countdownRecipe, () => props.classes);
const allUnits: CountdownUnit[] = ['days', 'hours', 'minutes', 'seconds'];
const emit = defineEmits<{ complete: [] }>();
const attrs = useAttrs();
const styles = computed(() => countdown({ variant: props.variant, size: props.size }));

// The time is only read in the browser – server and first client render show "--", so hydration matches
const now = ref<number | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
    now.value = Date.now();
    timer = setInterval(() => (now.value = Date.now()), 1000);
});
onBeforeUnmount(() => clearInterval(timer));

const remaining = computed(() => (now.value === null ? null : new Date(props.target).getTime() - now.value));
const parts = computed(() => (remaining.value === null ? null : countdownParts(remaining.value, props.units)));
const shown = computed(() => allUnits.filter((unit) => props.units.includes(unit)));
watch(
    () => remaining.value !== null && remaining.value <= 0,
    (done) => {
        if (!done) return;
        clearInterval(timer);
        emit('complete');
    }
);
</script>

<template>
    <!-- role="timer": screen readers read the current value on demand, without announcing every second -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="timer"
        :aria-label="label"
        aria-atomic="true"
    >
        <span v-for="unit in shown" :key="unit" :class="styles.unit()">
            <span :class="styles.value()">{{ parts ? String(parts[unit]).padStart(2, '0') : '--' }}</span>
            <span :class="styles.label()">{{ translations.countdown[unit](parts ? parts[unit] : 0) }}</span>
        </span>
    </div>
</template>
