<script setup lang="ts">
import { checkboxGroup as checkboxGroupRecipe, visuallyHidden, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, ref, useAttrs, useId } from 'vue';
import { switchGroupKey } from './context.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface SwitchGroupProps {
    /** Values of the switches that are on – use with v-model */
    modelValue?: string[];
    defaultValue?: string[];
    /** Visible label of the group (names it); otherwise pass aria-label */
    label?: string;
    helperText?: string;
    /** Error message – also marks the group and its switches invalid */
    error?: string;
    invalid?: boolean;
    /** Shows the required mark after the label */
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** Name of the inputs for form submission */
    name?: string;
    /** At most this many can be on – the others are disabled until one is switched off (announced) */
    max?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof checkboxGroupRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SwitchGroupProps>(), {
    modelValue: undefined,
    disabled: undefined,
    invalid: undefined,
    readOnly: undefined,
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
const styles = computed(() => checkboxGroup({ orientation: 'vertical' }));
const describedBy = computed(
    () => [props.helperText && `${id}help`, props.error && `${id}error`].filter(Boolean).join(' ') || undefined
);
function setChecked(item: string, checked: boolean) {
    if (props.readOnly || props.disabled) return;
    const next = checked
        ? [...value.value.filter((entry) => entry !== item), item]
        : value.value.filter((entry) => entry !== item);
    if (checked && atMax.value && !value.value.includes(item)) return;
    internal.value = next;
    emit('update:modelValue', next);
}
provide(
    switchGroupKey,
    computed(() => ({
        isChecked: (item: string) => value.value.includes(item),
        setChecked,
        disabled: props.disabled,
        invalid: isInvalid.value,
        readOnly: props.readOnly,
        name: props.name,
        blocked: (item: string) => atMax.value && !value.value.includes(item),
    }))
);
</script>

<template>
    <!-- role="group" named by its label, described by helper and error text; Switches with a value inside -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="group"
        :aria-labelledby="label ? `${id}label` : undefined"
        :aria-describedby="describedBy"
        :data-invalid="isInvalid ? '' : undefined"
        :data-disabled="disabled ? '' : undefined"
    >
        <span v-if="label" :id="`${id}label`" :class="styles.label()"
            >{{ label }}<span v-if="required" :class="styles.requiredIndicator()" aria-hidden="true">*</span></span
        >
        <div :class="styles.items()"><slot /></div>
        <p v-if="helperText" :id="`${id}help`" :class="styles.helperText()">{{ helperText }}</p>
        <p v-if="error" :id="`${id}error`" :class="styles.errorText()">{{ error }}</p>
        <span v-if="max !== undefined" role="status" :class="visuallyHidden()">{{
            atMax ? translations.checkboxGroup.maxReached(max) : ''
        }}</span>
    </div>
</template>
