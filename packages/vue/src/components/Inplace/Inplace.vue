<script setup lang="ts">
import { inplace as inplaceRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface InplaceProps {
    /** Editing – use with v-model:active */
    active?: boolean;
    /** Hint for screen readers after the shown text, e.g. "bearbeiten" */
    editLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof inplaceRecipe>;
}

// The root switches between button and editor – no attributes fall through
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<InplaceProps>(), { active: undefined });
const inplace = useRecipe('inplace', inplaceRecipe, () => props.classes);
const emit = defineEmits<{ 'update:active': [active: boolean] }>();
defineSlots<{ display(): unknown; default(props: { close: () => void }): unknown }>();
const styles = inplace();
const internal = ref(false);
const isActive = computed(() => props.active ?? internal.value);
const content = useTemplateRef<HTMLElement>('content');
const display = useTemplateRef<HTMLElement>('display');

async function set(next: boolean) {
    internal.value = next;
    emit('update:active', next);
    await nextTick();
    // Focus moves into the editor and back to the text when it closes – the latter a task later, so the Enter
    // that saved does not land on the text button and open the editor again
    if (next) content.value?.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]')?.focus();
    else setTimeout(() => display.value?.focus());
}
</script>

<template>
    <!-- Shows a value as a button; activating it swaps in the editor (Escape closes it) -->
    <button v-if="!isActive" ref="display" type="button" :class="styles.display()" @click="set(true)">
        <slot name="display" />
        <span :class="styles.hint()">({{ editLabel ?? translations.inplace.edit }})</span>
    </button>
    <div v-else ref="content" :class="styles.content()" @keydown.esc.prevent="set(false)">
        <slot :close="() => set(false)" />
    </div>
</template>
