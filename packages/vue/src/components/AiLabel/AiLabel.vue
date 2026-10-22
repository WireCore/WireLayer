<script setup lang="ts">
import { Sparkles } from '@lucide/vue';
import { aiLabel as aiLabelRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import Toggletip from '../Toggletip/Toggletip.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface AiLabelProps {
    /** Text of the label (default "AI-generated") */
    label?: string;
    /** Explanation behind the (i) button (default: a short note on AI content); `false` hides the button */
    explanation?: string | false;
    size?: 'sm' | 'md';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof aiLabelRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AiLabelProps>(), { explanation: undefined, size: 'md' });
const aiLabel = useRecipe('aiLabel', aiLabelRecipe, () => props.classes);
defineSlots<{ default?(): unknown }>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = computed(() => aiLabel({ size: props.size }));
</script>

<template>
    <!-- "AI-generated" (text, not only an icon) with the explanation in a toggletip -->
    <span v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <span :class="styles.badge()"
            ><Sparkles :class="styles.icon()" aria-hidden="true" />{{ label ?? translations.aiLabel.label }}</span
        >
        <Toggletip v-if="explanation !== false" :trigger-label="translations.aiLabel.help"
            ><slot>{{ explanation ?? translations.aiLabel.explanation }}</slot></Toggletip
        >
    </span>
</template>
