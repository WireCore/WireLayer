<script setup lang="ts">
import { Field, useFieldContext } from '@ark-ui/vue/field';
import { CircleAlert } from '@lucide/vue';
import { input as inputRecipe, setTextControlValue, type RecipeClasses, type Size } from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs, useId, useTemplateRef, type Component } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useFieldStatus } from '../Field/context.js';
import InputStatus from './InputStatus.vue';

export interface InputProps {
    size?: Size;
    /** Marks the input as invalid (also inherited from a surrounding Field) */
    invalid?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    /** Disables the input (also inherited from a surrounding Field) */
    disabled?: boolean;
    /** Shows a spinner in the field and marks it busy (aria-busy), e.g. while checking the value */
    loading?: boolean;
    /** Shows a button that empties the field while it has a value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    /** Icon component rendered inside the field, before the text */
    leadingIcon?: Component;
    /** Static text segment before the input, e.g. `https://` */
    prefix?: string;
    /** Static text segment after the input, e.g. `.de` */
    suffix?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof inputRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<InputProps>();
const input = useRecipe('input', inputRecipe, () => props.classes);
const translations = useTranslations();
const model = defineModel<string>();
const attrs = useAttrs();
const fieldContext = useFieldContext();
const fieldStatus = useFieldStatus();

const isInvalid = computed(() => props.invalid || !!fieldContext?.value.invalid);
const isSuccess = computed(() => !isInvalid.value && (props.success || fieldStatus.value.success));
const isDisabled = computed(() => props.disabled || !!fieldContext?.value.disabled);
const isReadOnly = computed(() => !!attrs.readonly || attrs.readonly === '' || !!fieldContext?.value.readOnly);
const styles = computed(() =>
    input({
        size: props.size,
        invalid: isInvalid.value,
        success: isSuccess.value,
        disabled: isDisabled.value,
        hasIcon: !!props.leadingIcon,
        hasStatusIcon: isInvalid.value || isSuccess.value || props.loading || props.clearable,
    })
);
const split = computed(() => splitAttrs(attrs));
// Typed text without v-model (e.g. with defaultValue) – whether there is something to clear
const typed = ref(String(attrs.defaultValue ?? ''));
const showClear = computed(
    () => props.clearable && !!(model.value ?? typed.value) && !isDisabled.value && !isReadOnly.value
);

// Prefix/suffix are read by screen readers as part of the description, after helper/error text
const prefixId = useId();
const suffixId = useId();
const describedBy = computed(
    () =>
        [
            fieldContext?.value.ariaDescribedby,
            props.prefix && prefixId,
            props.suffix && suffixId,
            split.value.rest['aria-describedby'],
        ]
            .filter(Boolean)
            .join(' ') || undefined
);

const control = useTemplateRef<{ $el: HTMLInputElement }>('control');
function clear() {
    const element = control.value?.$el;
    if (!element) return;
    setTextControlValue(element);
    element.focus();
}
</script>

<template>
    <div
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :data-invalid="isInvalid || undefined"
        :data-disabled="isDisabled || undefined"
    >
        <span v-if="prefix" :id="prefixId" :class="styles.prefix()">{{ prefix }}</span>
        <component :is="leadingIcon" v-if="leadingIcon" :class="styles.icon()" aria-hidden="true" />
        <Field.Input
            ref="control"
            v-model="model"
            v-bind="split.rest"
            :class="styles.control()"
            :disabled="isDisabled || undefined"
            :aria-invalid="isInvalid || undefined"
            :aria-describedby="describedBy"
            :aria-busy="loading || undefined"
            @input="typed = ($event.target as HTMLInputElement).value"
        />
        <InputStatus
            v-if="loading || clearable || isSuccess"
            :loading="loading"
            :clear="showClear"
            :clear-label="clearLabel ?? translations.field.clear"
            :success="isSuccess"
            :classes="{
                spinner: styles.spinner(),
                clear: styles.clear(),
                clearIcon: styles.clearIcon(),
                statusIcon: styles.statusIcon(),
            }"
            @clear="clear"
        />
        <CircleAlert v-if="isInvalid" :class="styles.statusIcon()" aria-hidden="true" />
        <span v-if="suffix" :id="suffixId" :class="styles.suffix()">{{ suffix }}</span>
    </div>
</template>
