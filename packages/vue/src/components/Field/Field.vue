<script setup lang="ts">
import { Field } from '@ark-ui/vue/field';
import { CircleCheck } from '@lucide/vue';
import { field as fieldRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { fieldStatusKey } from './context.js';
import Toggletip from '../Toggletip/Toggletip.vue';

export interface FieldProps {
    /** Label of the control – or the `label` slot */
    label?: string;
    /** Description below the control – or the `helper-text` slot (e.g. with a link) */
    helperText?: string;
    /** Error message – also marks the field as invalid; or the `error` slot */
    error?: string;
    invalid?: boolean;
    /**
     * Confirmation, e.g. "Username is available": shown with a check icon, part of the description; the control gets
     * a green border. Ignored while the field is invalid; or the `success` slot
     */
    success?: string;
    required?: boolean;
    /** Marks the field as optional: "(optional)" after the label */
    optional?: boolean;
    /** Text after the label of an optional field (default "optional") */
    optionalText?: string;
    disabled?: boolean;
    readOnly?: boolean;
    /**
     * Explanation behind an (i) button next to the label (Toggletip: a click shows it and screen readers read it) –
     * or the `label-help` slot
     */
    labelHelp?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof fieldRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<FieldProps>();
const slots = defineSlots<{
    default?(): unknown;
    /** Own content of the label (instead of `label`) */
    label?(): unknown;
    'label-help'?(): unknown;
    /** Own helper text, e.g. with a link or a button – part of the control's description (instead of `helperText`) */
    'helper-text'?(): unknown;
    /** Own confirmation (instead of `success`) */
    success?(): unknown;
    /** Own error message (instead of `error`) – also marks the field as invalid */
    error?(): unknown;
}>();
const field = useRecipe('field', fieldRecipe, () => props.classes);
const translations = useTranslations();
const attrs = useAttrs();
const styles = field();
// A slot counts like its prop
const hasLabel = () => !!props.label || !!slots.label;
const hasError = () => !!props.error || !!slots.error;
const isInvalid = computed(() => props.invalid || hasError());
const showSuccess = computed(() => (!!props.success || !!slots.success) && !isInvalid.value);
provide(
    fieldStatusKey,
    computed(() => ({ success: showSuccess.value, labelled: hasLabel() }))
);
</script>

<template>
    <Field.Root
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :invalid="isInvalid"
        :required="required"
        :disabled="disabled"
        :read-only="readOnly"
    >
        <!-- With labelHelp: the label and the (i) button in a row -->
        <div v-if="hasLabel() && (labelHelp || slots['label-help'])" :class="styles.labelRow()">
            <Field.Label :class="styles.label()">
                <slot name="label">{{ label }}</slot
                ><Field.RequiredIndicator v-if="required" :class="styles.requiredIndicator()" /><span
                    v-if="optional && !required"
                    :class="styles.optionalIndicator()"
                    >{{ ` (${optionalText ?? translations.field.optional})` }}</span
                >
            </Field.Label>
            <Toggletip :label="label"
                ><slot name="label-help">{{ labelHelp }}</slot></Toggletip
            >
        </div>
        <Field.Label v-else-if="hasLabel()" :class="styles.label()">
            <slot name="label">{{ label }}</slot
            ><Field.RequiredIndicator v-if="required" :class="styles.requiredIndicator()" /><span
                v-if="optional && !required"
                :class="styles.optionalIndicator()"
                >{{ ` (${optionalText ?? translations.field.optional})` }}</span
            >
        </Field.Label>
        <slot />
        <!-- The success text joins the helper text, so every control is described by it -->
        <Field.HelperText v-if="helperText || slots['helper-text'] || showSuccess" :class="styles.helperText()"
            ><slot name="helper-text">{{ helperText }}</slot
            ><span v-if="showSuccess" :class="styles.successText()"
                ><CircleCheck :class="styles.successIcon()" aria-hidden="true" /><slot name="success">{{
                    success
                }}</slot></span
            ></Field.HelperText
        >
        <Field.ErrorText v-if="hasError()" :class="styles.errorText()"
            ><slot name="error">{{ error }}</slot></Field.ErrorText
        >
    </Field.Root>
</template>
