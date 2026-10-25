<script setup lang="ts">
import { Field, useFieldContext } from '@ark-ui/vue/field';
import { ChevronDown } from '@lucide/vue';
import { nativeSelect as nativeSelectRecipe, type RecipeClasses, type Size } from '@wirecore/wirelayer-recipes';
import { computed, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useRecipe } from '../../recipes.js';

export interface NativeSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface NativeSelectProps {
    items: readonly NativeSelectOption[];
    /** Chosen value – use with v-model */
    modelValue?: string;
    /** First, empty option, e.g. "Please choose" */
    placeholder?: string;
    size?: Size;
    invalid?: boolean;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof nativeSelectRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<NativeSelectProps>(), {
    modelValue: undefined,
    placeholder: undefined,
    size: 'md',
    invalid: undefined,
    disabled: undefined,
});
const nativeSelect = useRecipe('nativeSelect', nativeSelectRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const field = useFieldContext();
const styles = computed(() => nativeSelect({ size: props.size }));
// Ark's Field passes readOnly, which a <select> does not have (Vue would write readonly="false"); null removes it
const noReadonly = null as unknown as undefined;
</script>

<template>
    <!-- The browser's select: its own keyboard and mobile pickers; inside a Field it is labelled and described -->
    <div :class="styles.base({ class: split.className })" :style="split.style">
        <Field.Select
            v-bind="split.rest"
            :class="styles.select()"
            :readonly="noReadonly"
            :value="modelValue"
            :disabled="disabled ?? field?.disabled"
            :aria-invalid="(invalid ?? field?.invalid) || undefined"
            @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        >
            <option v-if="placeholder" value="">{{ placeholder }}</option>
            <option v-for="item in items" :key="item.value" :value="item.value" :disabled="item.disabled">
                {{ item.label }}
            </option>
        </Field.Select>
        <ChevronDown :class="styles.icon()" aria-hidden="true" />
    </div>
</template>
