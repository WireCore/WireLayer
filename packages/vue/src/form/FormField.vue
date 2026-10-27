<script setup lang="ts">
import { useStore, type AnyFieldApi } from '@tanstack/vue-form';
import type { field as fieldRecipe, RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import Field from '../components/Field/Field.vue';
import { firstError } from './errors.js';

export interface FormFieldProps {
    /** The TanStack Form field (from `<form.Field v-slot="{ field }">`) */
    field: AnyFieldApi;
    label?: string;
    helperText?: string;
    /** Confirmation below the control (Field `success`) */
    success?: string;
    required?: boolean;
    /** "(optional)" after the label */
    optional?: boolean;
    disabled?: boolean;
    /** Extra classes per part of the Field, e.g. { label: "…" } (see the field recipe) */
    classes?: RecipeClasses<typeof fieldRecipe>;
}

const props = defineProps<FormFieldProps>();
defineSlots<{
    default?(props: { field: AnyFieldApi }): unknown;
    /** Own content of the label (instead of `label`) */
    label?(): unknown;
    /** Own helper text, e.g. with a link – part of the control's description (instead of `helperText`) */
    'helper-text'?(): unknown;
    /** Own confirmation (instead of `success`) */
    success?(): unknown;
}>();
const meta = useStore(props.field.store, (state) => state.meta);

// Errors appear once the field was left (or the form submitted, which touches every field)
const error = computed(() => (meta.value.isTouched ? firstError(meta.value.errors) : undefined));
</script>

<template>
    <!-- Label, helper text, error, aria-invalid and aria-describedby come from Field; id and other attributes as well -->
    <Field
        :label="label"
        :helper-text="helperText"
        :success="success"
        :error="error"
        :required="required"
        :optional="optional"
        :disabled="disabled"
        :classes="classes"
    >
        <slot :field="field" />
        <template v-if="$slots.label" #label><slot name="label" /></template>
        <template v-if="$slots['helper-text']" #helper-text><slot name="helper-text" /></template>
        <template v-if="$slots.success" #success><slot name="success" /></template>
    </Field>
</template>
