<script setup lang="ts">
import { Search } from '@lucide/vue';
import {
    searchField as searchFieldRecipe,
    setTextControlValue,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs } from 'vue';
import Autocomplete from '../Autocomplete/Autocomplete.vue';
import Input from '../Input/Input.vue';
import NativeSelect, { type NativeSelectOption } from '../NativeSelect/NativeSelect.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface SearchFieldProps {
    /** The search text – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Accessible name of the search (form role="search" and field) – default "Search" */
    label?: string;
    placeholder?: string;
    /** Search is running: spinner in the field, aria-busy */
    loading?: boolean;
    /** Areas to search in – a select before the field (v-model:scope) */
    scopes?: NativeSelectOption[];
    /** Chosen area – use with v-model:scope */
    scope?: string;
    /** Accessible name of the area select (default "Search in") */
    scopeLabel?: string;
    /** Suggestions while typing (combobox pattern) – any other text can still be searched */
    suggestions?: string[];
    /** Accessible name of the clear button (default "Clear search") */
    clearLabel?: string;
    size?: Size;
    disabled?: boolean;
    /** Name of the field for form submission (default "q") */
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof searchFieldRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SearchFieldProps>(), {
    modelValue: undefined,
    defaultValue: '',
    scope: undefined,
    name: 'q',
});
const searchField = useRecipe('searchField', searchFieldRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:scope': [scope: string];
    /** Enter (or the form's submit): the text and the area */
    submit: [value: string, scope: string | undefined];
    /** Escape emptied the field */
    clear: [];
}>();
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.searchField;
const styles = searchField();
const name = computed(() => props.label ?? t.label);
const internal = ref(props.defaultValue);
const text = computed(() => props.modelValue ?? internal.value);
function setText(value: string | undefined) {
    internal.value = value ?? '';
    emit('update:modelValue', value ?? '');
}

function submit() {
    emit('submit', text.value, props.scope);
}
// Escape empties a filled field (and stops there, so a dialog around stays open)
function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLInputElement;
    if (event.key !== 'Escape' || target.tagName !== 'INPUT' || !target.value) return;
    event.preventDefault();
    event.stopPropagation();
    setTextControlValue(target);
    emit('clear');
}
</script>

<template>
    <!-- A search form (role="search"): optional area, field with magnifier, clear button and spinner; Enter searches -->
    <form
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="search"
        :aria-label="name"
        @submit.prevent="submit"
        @keydown="onKeydown"
    >
        <NativeSelect
            v-if="scopes?.length"
            :items="scopes"
            :model-value="scope"
            :size="size"
            :disabled="disabled"
            :aria-label="scopeLabel ?? t.scope"
            :class="styles.scope()"
            @update:model-value="emit('update:scope', $event)"
        />
        <Autocomplete
            v-if="suggestions"
            :model-value="text"
            :items="suggestions"
            :placeholder="placeholder ?? t.placeholder"
            :loading="loading"
            :disabled="disabled"
            :name="props.name"
            :aria-label="name"
            :size="size"
            clearable
            :class="styles.field()"
            @update:model-value="setText"
        />
        <Input
            v-else
            :model-value="text"
            type="search"
            enterkeyhint="search"
            :name="props.name"
            :aria-label="name"
            :placeholder="placeholder ?? t.placeholder"
            :leading-icon="Search"
            :loading="loading"
            :disabled="disabled"
            :size="size"
            clearable
            :clear-label="clearLabel ?? t.clear"
            :class="styles.field()"
            :classes="{ control: styles.control() }"
            @update:model-value="setText"
        />
    </form>
</template>
