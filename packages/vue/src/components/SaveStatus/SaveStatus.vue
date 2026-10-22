<script setup lang="ts">
import { CircleAlert, CircleCheck, LoaderCircle } from '@lucide/vue';
import { saveStatus as saveStatusRecipe, type RecipeClasses, type SaveStatusState } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export type SaveStatusTranslations = Record<SaveStatusState, string>;

export interface SaveStatusProps {
    /** idle (nothing to report), saving, saved or error */
    status?: SaveStatusState;
    /** Own texts per state, e.g. { saved: 'Draft saved' } */
    translations?: Partial<SaveStatusTranslations>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof saveStatusRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SaveStatusProps>(), { status: 'idle' });
const saveStatus = useRecipe('saveStatus', saveStatusRecipe, () => props.classes);
const attrs = useAttrs();
const texts = useTranslations();
const styles = computed(() => saveStatus({ status: props.status }));
const text = computed(() => ({ ...texts.saveStatus, ...props.translations })[props.status]);
</script>

<template>
    <!-- Save state with icon and text; a live region (role="status"), so changes are announced -->
    <span v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }" role="status">
        <LoaderCircle v-if="status === 'saving'" :class="styles.spinner()" aria-hidden="true" />
        <CircleCheck v-else-if="status === 'saved'" :class="styles.icon()" aria-hidden="true" />
        <CircleAlert v-else-if="status === 'error'" :class="styles.icon()" aria-hidden="true" />
        {{ text }}
    </span>
</template>
