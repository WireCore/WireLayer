<script setup lang="ts" generic="V extends string | number = string">
import { Field, useFieldContext } from '@ark-ui/vue/field';
import { ChevronDown } from '@lucide/vue';
import { nativeSelect as nativeSelectRecipe, type RecipeClasses, type Size } from '@wirecore/wirelayer-recipes';
import { computed, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useRecipe } from '../../recipes.js';

export interface NativeSelectOption<V extends string | number = string> {
    /** A string or a number – v-model gets it back with its type */
    value: V;
    label: string;
    disabled?: boolean;
}

/** `V`: the type of the values – a union like `'ssh' | 'sftp'` or numbers (default string) */
export interface NativeSelectProps<V extends string | number = string> {
    items: readonly NativeSelectOption<V>[];
    /** Chosen value – use with v-model; the placeholder option gives an empty string */
    modelValue?: V | '';
    /** First, empty option, e.g. "Please choose" */
    placeholder?: string;
    size?: Size;
    invalid?: boolean;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof nativeSelectRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<NativeSelectProps<V>>(), {
    modelValue: undefined,
    placeholder: undefined,
    size: 'md',
    invalid: undefined,
    disabled: undefined,
});
const nativeSelect = useRecipe('nativeSelect', nativeSelectRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: V | ''] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const field = useFieldContext();
const styles = computed(() => nativeSelect({ size: props.size }));
// Ark's Field passes readOnly, which a <select> does not have (Vue would write readonly="false"); null removes it
const noReadonly = null as unknown as undefined;
// The option's value with its type (a number stays a number); the placeholder gives ''
function onChange(event: Event) {
    const text = (event.target as HTMLSelectElement).value;
    emit('update:modelValue', props.items.find((item) => String(item.value) === text)?.value ?? (text as V | ''));
}
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
            @change="onChange"
        >
            <option v-if="placeholder" value="">{{ placeholder }}</option>
            <option v-for="item in items" :key="item.value" :value="item.value" :disabled="item.disabled">
                {{ item.label }}
            </option>
        </Field.Select>
        <ChevronDown :class="styles.icon()" aria-hidden="true" />
    </div>
</template>
