<script setup lang="ts">
import { filterChips as filterChipsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { nextTick, normalizeClass, useAttrs, useTemplateRef, watch } from 'vue';
import Chip from '../ChipGroup/Chip.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface FilterChip {
    /** Key of the filter – passed to `remove` */
    id: string;
    /** Name of the filter, e.g. "Location" */
    label: string;
    /** The active value as text, e.g. "Frankfurt, Vienna" */
    value: string;
}

export interface FilterChipsProps {
    /** The active filters */
    filters: readonly FilterChip[];
    /** Accessible name of the list (default "Active filters") */
    label?: string;
    /** Text of the reset button (default "Reset all"); `false` hides it */
    resetLabel?: string | false;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof filterChipsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FilterChipsProps>(), { resetLabel: undefined });
const filterChips = useRecipe('filterChips', filterChipsRecipe, () => props.classes);
const emit = defineEmits<{ remove: [id: string]; clear: [] }>();
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.filterChips;
const styles = filterChips();
const list = useTemplateRef<HTMLUListElement>('list');
// After removing a chip the focus goes to the chip now in its place (or the one before, or the reset button)
let refocus: number | null = null;
function remove(id: string, index: number) {
    refocus = index;
    emit('remove', id);
}
watch(
    () => props.filters.length,
    async () => {
        if (refocus === null) return;
        const index = refocus;
        refocus = null;
        await nextTick();
        const buttons = [...(list.value?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
        (buttons[Math.min(index, Math.max(0, props.filters.length - 1))] ?? buttons.at(-1))?.focus();
    }
);
</script>

<template>
    <!-- The active filters as a list of chips with remove buttons ("Remove filter Location: Frankfurt") -->
    <ul
        v-if="filters.length"
        ref="list"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :aria-label="label ?? t.label"
    >
        <li v-for="(filter, index) in filters" :key="filter.id" :class="styles.item()">
            <Chip
                :label="`${filter.label}: ${filter.value}`"
                removable
                :remove-label="t.remove(`${filter.label}: ${filter.value}`)"
                @remove="remove(filter.id, index)"
                ><span :class="styles.name()">{{ filter.label }}:</span> {{ filter.value }}</Chip
            >
        </li>
        <li v-if="resetLabel !== false" :class="styles.item()">
            <button type="button" :class="styles.reset()" @click="emit('clear')">{{ resetLabel ?? t.reset }}</button>
        </li>
    </ul>
</template>
