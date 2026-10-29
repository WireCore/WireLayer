<script setup lang="ts">
import {
    maskIsComplete,
    maskIsNumeric,
    maskPlaceholder,
    maskValue,
    unmaskValue,
    type MaskTokens,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import Input from '../Input/Input.vue';
import { textFieldHandle, type TextFieldHandle } from '../../utils/text-field.js';

/** Further Input props (size, leadingIcon, prefix, invalid, clearable, loading …) are passed through */
export interface MaskInputProps {
    /**
     * 9 digit, a letter, * letter or digit – everything else is inserted by itself, \\ escapes a token, `?` starts an
     * optional rest, e.g. "+4\\9 999 9999999" or "99999?-9999"
     */
    mask: string;
    /** Masked value (or the raw one with `unmask`) – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    placeholder?: string;
    /** Character for the open slots in the placeholder (default "_") */
    slotChar?: string;
    /** v-model holds only the typed characters ("891234" instead of "DE89 1234") */
    unmask?: boolean;
    /** Empties an incomplete value when the field is left */
    autoClear?: boolean;
    /** Own tokens, e.g. { h: /[0-9a-f]/i } – they extend 9, a and * */
    tokens?: MaskTokens;
}

const props = withDefaults(defineProps<MaskInputProps>(), {
    modelValue: undefined,
    defaultValue: '',
    placeholder: undefined,
    slotChar: '_',
    tokens: undefined,
});
const emit = defineEmits<{
    'update:modelValue': [value: string];
    /** Only the typed characters */
    rawChange: [raw: string];
    /** Every required slot is filled */
    complete: [value: string];
}>();
const internal = ref(maskValue(props.defaultValue, props.mask, props.tokens));
const current = computed(() =>
    props.modelValue === undefined ? internal.value : maskValue(props.modelValue, props.mask, props.tokens)
);

function update(next: string) {
    const wasComplete = maskIsComplete(current.value, props.mask, props.tokens);
    internal.value = next;
    const raw = unmaskValue(next, props.mask, props.tokens);
    emit('update:modelValue', props.unmask ? raw : next);
    emit('rawChange', raw);
    if (!wasComplete && maskIsComplete(next, props.mask, props.tokens)) emit('complete', next);
}

async function onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const caret = input.selectionStart ?? input.value.length;
    const atEnd = caret === input.value.length;
    const next = maskValue(input.value, props.mask, props.tokens);
    const shifted = caret + (next.length - input.value.length);
    update(next);
    // The input shows the masked text; typing in the middle keeps the caret where it was
    input.value = next;
    if (!atEnd) {
        await nextTick();
        input.setSelectionRange(shifted, shifted);
    }
}

function onBlur(event: FocusEvent) {
    if (!props.autoClear || !current.value || maskIsComplete(current.value, props.mask, props.tokens)) return;
    update('');
    (event.target as HTMLInputElement).value = '';
}
// focus(), blur(), select(), setSelectionRange() and the native input (`element`) for template refs
const field = useTemplateRef<TextFieldHandle>('field');
defineExpose(textFieldHandle(() => field.value?.element));
</script>

<template>
    <!-- Text input with a fixed format (IBAN, phone, postcode …): separators are added while typing -->
    <Input
        ref="field"
        :inputmode="maskIsNumeric(mask, tokens) ? 'numeric' : undefined"
        :model-value="current"
        :placeholder="placeholder ?? maskPlaceholder(mask, slotChar, tokens)"
        @input="onInput"
        @blur="onBlur"
    />
</template>
