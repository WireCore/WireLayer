<script setup lang="ts">
import {
    caretAfterDigits,
    countryFlag,
    countryName,
    findPhoneCountry,
    formatPhoneNumber,
    isValidPhoneNumber,
    parsePhoneNumber,
    phoneCountries,
    phoneInput as phoneInputRecipe,
    phonePlaceholder,
    toE164,
    type PhoneCountry,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, watch } from 'vue';
import Input from '../Input/Input.vue';
import Select from '../Select/Select.vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface PhoneInputProps {
    /** The number in E.164 ("+4930123456", "" when empty) – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Chosen country (ISO code) – use with v-model:country */
    country?: string;
    /** Country before anything is chosen (default "DE") */
    defaultCountry?: string;
    /** Countries to offer (default: about 60 common ones; extend with your own entries) */
    countries?: readonly PhoneCountry[];
    /** Accessible name of the country select (default "Country") */
    countryLabel?: string;
    placeholder?: string;
    size?: Size;
    disabled?: boolean;
    /** Marks the number invalid (it also is after leaving a number of the wrong length) */
    invalid?: boolean;
    required?: boolean;
    /** Name of the hidden form field (E.164) */
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof phoneInputRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PhoneInputProps>(), {
    modelValue: undefined,
    defaultValue: '',
    country: undefined,
    defaultCountry: 'DE',
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const emit = defineEmits<{
    'update:modelValue': [value: string];
    'update:country': [country: string];
    /** Whether the number has a valid length for its country (after every change) */
    validChange: [valid: boolean];
}>();
const phoneInput = useRecipe('phoneInput', phoneInputRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const styles = phoneInput();
const list = computed(() => props.countries ?? phoneCountries);
const fallback = computed(() => findPhoneCountry(props.defaultCountry, list.value) ?? list.value[0]!);
const initial = parsePhoneNumber(props.modelValue ?? props.defaultValue, fallback.value, list.value);
const internalCountry = ref(props.country ?? initial.country.code);
const current = computed(() => findPhoneCountry(props.country ?? internalCountry.value, list.value) ?? fallback.value);
const digits = ref(initial.digits);
// "+4…" before a calling code is recognised stays as typed
const draft = ref<string | null>(null);
const touched = ref(false);
const e164 = computed(() => toE164(digits.value, current.value));
const valid = computed(() => !digits.value || isValidPhoneNumber(digits.value, current.value));
const items = computed(() => {
    const collator = new Intl.Collator(locale.value.locale);
    return list.value
        .map((entry) => {
            const name = countryName(entry.code, locale.value.locale);
            return { value: entry.code, label: `${countryFlag(entry.code)} ${name} +${entry.dial}`, name };
        })
        .sort((a, b) => collator.compare(a.name, b.name));
});

// A new value from outside (not the one emitted last) is split into country and digits
watch(
    () => props.modelValue,
    (value) => {
        if (value === undefined || value === e164.value) return;
        const parsed = parsePhoneNumber(value, current.value, list.value);
        digits.value = parsed.digits;
        setCountry(parsed.country.code);
    }
);

function emitValue() {
    emit('update:modelValue', e164.value);
    emit('validChange', valid.value);
}
function setCountry(code: string) {
    if (code === current.value.code) return;
    internalCountry.value = code;
    emit('update:country', code);
}
function onCountry(code: string | null) {
    if (!code) return;
    setCountry(code);
    emitValue();
}
async function onInput(event: Event) {
    const element = event.target as HTMLInputElement;
    const text = element.value;
    const before = text.slice(0, element.selectionStart ?? text.length).replace(/\D/g, '').length;
    const parsed = parsePhoneNumber(text, current.value, list.value);
    draft.value = parsed.pending ? text : null;
    if (parsed.pending) {
        digits.value = '';
        emitValue();
        return;
    }
    const country = parsed.country.code !== current.value.code;
    digits.value = parsed.digits;
    if (country) setCountry(parsed.country.code);
    emitValue();
    await nextTick();
    // Same text after formatting: put the caret back after the same digit
    const shown = formatPhoneNumber(digits.value, current.value);
    if (element.value !== shown) element.value = shown;
    if (document.activeElement === element && !country) {
        const caret = caretAfterDigits(shown, before);
        element.setSelectionRange(caret, caret);
    }
}
</script>

<template>
    <!-- Country (flag and calling code, searchable) and the number, formatted for the country; the value is E.164 -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <Select
            :items="items"
            :model-value="current.code"
            :size="size"
            :disabled="disabled"
            filter
            standalone
            :aria-label="countryLabel ?? locale.translations.phoneInput.country"
            :class="styles.country()"
            :classes="{ content: styles.countryList() }"
            @update:model-value="onCountry"
        >
            <template #value>
                <span :class="styles.flag()" aria-hidden="true">{{ countryFlag(current.code) }}</span>
                <span :class="styles.dial()">+{{ current.dial }}</span>
            </template>
        </Select>
        <Input
            v-bind="{ ...attrs, class: undefined, style: undefined }"
            :model-value="draft ?? formatPhoneNumber(digits, current)"
            type="tel"
            inputmode="tel"
            autocomplete="tel-national"
            :placeholder="placeholder ?? phonePlaceholder(current)"
            :size="size"
            :disabled="disabled"
            :required="required"
            :invalid="invalid || (touched && !valid)"
            :class="styles.number()"
            @input="onInput"
            @blur="touched = true"
        />
        <input v-if="name" type="hidden" :name="name" :value="e164" />
    </div>
</template>
