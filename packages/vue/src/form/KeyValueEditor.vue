<script setup lang="ts">
import { useStore, type AnyFieldApi } from '@tanstack/vue-form';
import { keyValueEditor as keyValueEditorRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import FormList from './FormList.vue';
import Input from '../components/Input/Input.vue';
import { useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';

/** One row of a KeyValueEditor */
export interface KeyValuePair {
    key: string;
    value: string;
}

export interface KeyValueEditorProps {
    /** The TanStack Form field of the array of { key, value } (`mode="array"`) */
    field: AnyFieldApi;
    /** Visible name of the list, e.g. "HTTP headers" */
    label: string;
    /** Names of the two inputs (default "Key", "Value") */
    keyLabel?: string;
    valueLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    min?: number;
    max?: number;
    /** Marks keys that occur more than once (default true) */
    uniqueKeys?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof keyValueEditorRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<KeyValueEditorProps>(), { min: 0, uniqueKeys: true });
const keyValueEditor = useRecipe('keyValueEditor', keyValueEditorRecipe, () => props.classes);
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.keyValueEditor;
const styles = keyValueEditor();
const id = useId();
const pairs = useStore(props.field.store, (state) => (state.value as KeyValuePair[] | undefined) ?? []);
// Keys used more than once (empty keys do not count)
const duplicates = computed(() => {
    const seen = new Map<string, number>();
    for (const pair of pairs.value)
        if (pair.key.trim()) seen.set(pair.key.trim(), (seen.get(pair.key.trim()) ?? 0) + 1);
    return new Set([...seen].filter(([, count]) => count > 1).map(([key]) => key));
});
const isDuplicate = (index: number) => props.uniqueKeys && duplicates.value.has(pairs.value[index]?.key.trim() ?? '');
function set(index: number, part: keyof KeyValuePair, value: string) {
    props.field.replaceValue(index, { ...pairs.value[index], [part]: value });
}
</script>

<template>
    <!-- Key-value pairs (FormList preset): two inputs per row, duplicate keys marked -->
    <FormList
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :field="field"
        :label="label"
        :new-item="() => ({ key: '', value: '' })"
        :item-label="t.item"
        :add-label="t.add"
        :min="min"
        :max="max"
    >
        <template #item="{ index, itemLabel }">
            <Input
                :model-value="pairs[index]?.key ?? ''"
                :aria-label="`${keyLabel ?? t.key}, ${itemLabel}`"
                :placeholder="keyPlaceholder"
                :invalid="isDuplicate(index)"
                :aria-describedby="isDuplicate(index) ? `${id}-${index}` : undefined"
                :class="styles.cell()"
                @update:model-value="set(index, 'key', $event ?? '')"
            />
            <Input
                :model-value="pairs[index]?.value ?? ''"
                :aria-label="`${valueLabel ?? t.value}, ${itemLabel}`"
                :placeholder="valuePlaceholder"
                :class="styles.cell()"
                @update:model-value="set(index, 'value', $event ?? '')"
            />
            <p v-if="isDuplicate(index)" :id="`${id}-${index}`" :class="styles.error()">{{ t.duplicate }}</p>
        </template>
    </FormList>
</template>
