<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import { PinInput } from '@ark-ui/vue/pin-input';
import { pinInput as pinInputRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface PinInputProps {
    /** Number of characters */
    length?: number;
    /** Code – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    type?: 'numeric' | 'alphanumeric' | 'alphabetic';
    /** One-time code: the browser/phone may fill it in from an SMS */
    otp?: boolean;
    /** Show dots instead of the characters */
    mask?: boolean;
    placeholder?: string;
    invalid?: boolean;
    disabled?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof pinInputRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PinInputProps>(), {
    length: 6,
    modelValue: undefined,
    defaultValue: undefined,
    type: 'numeric',
    otp: true,
    mask: undefined,
    placeholder: '',
    invalid: undefined,
    disabled: undefined,
});
const pinInput = useRecipe('pinInput', pinInputRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string]; valueComplete: [value: string] }>();
const attrs = useAttrs();
const field = useFieldContext();
const styles = pinInput();
const toArray = (value: string | undefined) => (value === undefined ? undefined : value.split(''));

function onValueChange(details: { value: string[]; valueAsString: string }) {
    emit('update:modelValue', details.valueAsString);
    // Fired here as in React, where Ark's own completion event does not fire when controlled
    if (details.value.length === props.length && details.value.every(Boolean)) {
        emit('valueComplete', details.valueAsString);
    }
}
</script>

<template>
    <!-- Code input (OTP, PIN): one box per character, typing moves on, pasting fills all boxes -->
    <PinInput.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :count="length"
        :model-value="toArray(modelValue)"
        :default-value="toArray(defaultValue)"
        :type="type"
        :otp="otp"
        :mask="mask"
        :placeholder="placeholder"
        :invalid="invalid"
        :disabled="disabled"
        :name="name"
        :translations="translations.pinInput"
        @value-change="onValueChange"
    >
        <!-- One named group around the boxes – each box is "Digit 2 of 6" -->
        <PinInput.Control
            :class="styles.control()"
            role="group"
            :aria-labelledby="field?.ids.label"
            :aria-label="field ? undefined : (attrs['aria-label'] as string | undefined)"
            :aria-describedby="field?.ariaDescribedby"
        >
            <PinInput.Input v-for="index in length" :key="index" :index="index - 1" :class="styles.input()" />
        </PinInput.Control>
        <PinInput.HiddenInput />
    </PinInput.Root>
</template>
