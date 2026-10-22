<script setup lang="ts">
import { Check } from '@lucide/vue';
import { type RecipeClasses, steps as stepsRecipe, type StepStatus } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface StepItem {
    label: string;
    /** Icon component for the active/open state (default: the step number) */
    icon?: Component;
}

export interface StepsProps {
    items: StepItem[];
    /** Index of the current step; earlier steps are done */
    current: number;
    /** Accessible name of the list, e.g. "Project timeline" */
    label?: string;
    /** Status text read by screen readers after each step (default: from the locale) */
    statusLabels?: Record<StepStatus, string>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof stepsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<StepsProps>();
const steps = useRecipe('steps', stepsRecipe, () => props.classes);
const attrs = useAttrs();
const translations = useTranslations();
const labels = computed(() => props.statusLabels ?? translations.stepper.status);

const statusOf = (index: number): StepStatus =>
    index < props.current ? 'done' : index === props.current ? 'active' : 'todo';
const stylesOf = (index: number) => steps({ status: statusOf(index) });
</script>

<template>
    <ol v-bind="{ ...attrs, class: steps().base({ class: normalizeClass(attrs.class) }) }" :aria-label="label">
        <li
            v-for="(item, index) in items"
            :key="index"
            :class="stylesOf(index).item()"
            :aria-current="statusOf(index) === 'active' ? 'step' : undefined"
        >
            <span :class="stylesOf(index).indicator()" aria-hidden="true">
                <Check v-if="statusOf(index) === 'done'" :class="stylesOf(index).icon()" />
                <component :is="item.icon" v-else-if="item.icon" :class="stylesOf(index).icon()" />
                <span v-else :class="stylesOf(index).number()">{{ index + 1 }}</span>
            </span>
            <span :class="stylesOf(index).label()">{{ item.label }}</span>
            <span :class="stylesOf(index).status()">{{ `, ${labels[statusOf(index)]}` }}</span>
        </li>
    </ol>
</template>
