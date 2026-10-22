<script setup lang="ts">
import { Checkbox } from '@ark-ui/vue/checkbox';
import { checkboxGroup as checkboxGroupRecipe, visuallyHidden, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface CheckboxGroupProps {
    /** Values of the ticked checkboxes – use with v-model */
    modelValue?: string[];
    defaultValue?: string[];
    /** Visible label of the group (names it); otherwise pass aria-label */
    label?: string;
    helperText?: string;
    /** Error message – also marks the group and its checkboxes invalid */
    error?: string;
    invalid?: boolean;
    /** Shows the required mark after the label */
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** Name of the inputs for form submission */
    name?: string;
    /** At most this many can be ticked – the others are disabled until one is unticked (announced) */
    max?: number;
    /** vertical (default) or horizontal */
    orientation?: 'vertical' | 'horizontal';
    /** Cards in a grid with this many columns (one column on small screens) – for CheckboxCard */
    columns?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof checkboxGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CheckboxGroupProps>(), {
    modelValue: undefined,
    disabled: undefined,
    invalid: undefined,
    readOnly: undefined,
    orientation: 'vertical',
});
const checkboxGroup = useRecipe('checkboxGroup', checkboxGroupRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();
const attrs = useAttrs();
const translations = useTranslations();
const id = useId();
const internal = ref(props.defaultValue ?? []);
const value = computed(() => props.modelValue ?? internal.value);
const isInvalid = computed(() => props.invalid || !!props.error || undefined);
const atMax = computed(() => props.max !== undefined && value.value.length >= props.max);
const styles = computed(() => checkboxGroup({ orientation: props.orientation, grid: props.columns !== undefined }));
const describedBy = computed(
    () => [props.helperText && `${id}help`, props.error && `${id}error`].filter(Boolean).join(' ') || undefined
);
function onChange(next: string[]) {
    internal.value = next;
    emit('update:modelValue', next);
}
</script>

<template>
    <!-- role="group" named by its label, described by helper and error text; Checkbox/CheckboxCard inside -->
    <Checkbox.Group
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :model-value="modelValue"
        :default-value="defaultValue"
        :disabled="disabled"
        :invalid="isInvalid"
        :read-only="readOnly"
        :name="name"
        :max-selected-values="max"
        :aria-labelledby="label ? `${id}label` : undefined"
        :aria-describedby="describedBy"
        @value-change="onChange"
    >
        <span v-if="label" :id="`${id}label`" :class="styles.label()"
            >{{ label }}<span v-if="required" :class="styles.requiredIndicator()" aria-hidden="true">*</span></span
        >
        <div :class="styles.items()" :style="columns ? { '--wc-columns': String(columns) } : undefined">
            <slot />
        </div>
        <p v-if="helperText" :id="`${id}help`" :class="styles.helperText()">{{ helperText }}</p>
        <p v-if="error" :id="`${id}error`" :class="styles.errorText()">{{ error }}</p>
        <span v-if="max !== undefined" role="status" :class="visuallyHidden()">{{
            atMax ? translations.checkboxGroup.maxReached(max) : ''
        }}</span>
    </Checkbox.Group>
</template>
