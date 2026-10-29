<script setup lang="ts" generic="F extends 'min' | 'previous' | undefined = undefined">
import { useFieldContext } from '@ark-ui/vue/field';
import { NumberInput, useNumberInput } from '@ark-ui/vue/number-input';
import { ChevronDown, ChevronUp, Minus, Plus } from '@lucide/vue';
import {
    controlIds,
    defaultNumberFormat,
    insertIntoTextControl,
    numberInput as numberInputRecipe,
    numberInputKey,
    parseLocaleNumber,
    setTextControlValue,
    toNumberInputValue,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useFieldStatus } from '../Field/context.js';
import InputStatus from '../Input/InputStatus.vue';
import { textFieldHandle } from '../../utils/text-field.js';

/** What an emptied field becomes when it is left: `min` (or 0) or the last valid number */
export type NumberInputEmptyFallback = 'min' | 'previous';

/** `F`: the type of `emptyFallback` (with it v-model only gets numbers, never null) */
export interface NumberInputProps<F extends NumberInputEmptyFallback | undefined = undefined> {
    /** Number or null (empty) – use with v-model */
    modelValue?: number | null;
    defaultValue?: number | null;
    min?: number;
    max?: number;
    step?: number;
    /** Display format, e.g. { style: 'currency', currency: 'EUR' } – default: locale format, all decimals */
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    size?: Size;
    invalid?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    /** Shows the − / + buttons (default); arrow keys keep working without them. Holding a button repeats */
    stepper?: boolean;
    /** `inline`: − and + side by side (default); `stacked`: up above down at the end (the field is 48px high) */
    stepperLayout?: 'inline' | 'stacked';
    /** Free text before the number, e.g. "≈" – independent of the number format */
    prefix?: string;
    /** Free text after the number, e.g. "pt" or "pcs" – independent of the number format */
    suffix?: string;
    /** Allows numbers below zero (default); false blocks the minus key and sets the minimum to 0 */
    allowNegative?: boolean;
    /** Allows decimals (default); false blocks the decimal separator and rounds to whole numbers */
    allowDecimal?: boolean;
    /** Exactly this many decimals, e.g. 2 → "12.50" */
    decimals?: number;
    /**
     * Out of min/max: `blur` corrects the value when the field is left (default), `strict` does not let it leave the
     * range, `none` keeps it (mark it invalid yourself)
     */
    clampBehavior?: 'blur' | 'strict' | 'none';
    /**
     * A number is always set: an emptied field falls back to `min` (or 0) or to the last valid number (`previous`)
     * when it is left or Enter is pressed – v-model then only gets numbers (typed `number`, not `number | null`)
     */
    emptyFallback?: F;
    /** Selects the whole number when the field gets the focus */
    selectOnFocus?: boolean;
    /** Shows a spinner in the field and marks it busy (aria-busy) */
    loading?: boolean;
    /** Shows a button that empties the field while it has a value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    /** Id of the input, e.g. for a `<label for>` */
    id?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof numberInputRecipe>;
}

defineOptions({ inheritAttrs: false });
const localeContext = useLocale();
const translations = useTranslations();
const props = withDefaults(defineProps<NumberInputProps<F>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    formatOptions: () => defaultNumberFormat,
    invalid: undefined,
    success: undefined,
    disabled: undefined,
    readOnly: undefined,
    required: undefined,
    stepper: true,
    stepperLayout: 'inline',
    allowNegative: true,
    allowDecimal: true,
    clampBehavior: 'blur',
});
const numberInput = useRecipe('numberInput', numberInputRecipe, () => props.classes);
const currentLocale = computed(() => props.locale ?? localeContext.value.locale);
const emit = defineEmits<{ 'update:modelValue': [value: F extends string ? number : number | null] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const field = useFieldContext();
const fieldStatus = useFieldStatus();
const isInvalid = computed(() => !!props.invalid || !!field?.value.invalid);
const isSuccess = computed(() => !isInvalid.value && (!!props.success || fieldStatus.value.success));
const styles = computed(() =>
    numberInput({ size: props.size, stacked: props.stepperLayout === 'stacked', success: isSuccess.value })
);
// Fixed decimals or whole numbers on top of the given format
const format = computed<Intl.NumberFormatOptions>(() =>
    props.decimals !== undefined
        ? { ...props.formatOptions, minimumFractionDigits: props.decimals, maximumFractionDigits: props.decimals }
        : props.allowDecimal
          ? props.formatOptions
          : { ...props.formatOptions, maximumFractionDigits: 0 }
);
const min = computed(() => (props.allowNegative ? props.min : Math.max(props.min ?? 0, 0)));

// Ark keeps the text as typed ("12." while entering 12.5). A controlled value would be written back before
// Vue re-renders and swallow the separator – so only changes from outside are passed in, through the API.
let emitted: number | null | undefined;
// The last valid number – an emptied field with emptyFallback="previous" goes back to it
let previous = props.modelValue ?? props.defaultValue ?? null;
const initial = toNumberInputValue(props.modelValue ?? props.defaultValue, currentLocale.value, format.value);
// Ark Vue binds the formatted value on every render, which removes a just typed comma – the input shows this text
const text = ref(initial ?? '');
const api = useNumberInput(
    computed(() => ({
        defaultValue: initial,
        min: min.value,
        max: props.max,
        step: props.step,
        formatOptions: format.value,
        locale: currentLocale.value,
        invalid: props.invalid,
        disabled: props.disabled,
        readOnly: props.readOnly,
        required: props.required,
        name: props.name,
        clampValueOnBlur: props.clampBehavior !== 'none',
        allowOverflow: props.clampBehavior !== 'strict',
        translations: translations.numberInput,
        // An own id goes to the input through Ark (it finds the input by its id)
        ...controlIds(props.id, 'input', { label: field?.value.ids.label, input: field?.value.ids.control }),
        onValueChange: (details: { value: string; valueAsNumber: number }) => {
            text.value = details.value;
            const number = Number.isNaN(details.valueAsNumber) ? null : details.valueAsNumber;
            // With a fallback the value stays until the field is left
            if (number === null && props.emptyFallback) return;
            if (number !== null) previous = number;
            emitted = number;
            emit('update:modelValue', number as F extends string ? number : number | null);
        },
        // Leaving the field (or Enter) with an empty text: the fallback number
        onValueCommit: (details: { valueAsNumber: number }) => {
            if (!props.emptyFallback || !Number.isNaN(details.valueAsNumber)) return;
            api.value.setValue(props.emptyFallback === 'previous' && previous !== null ? previous : (min.value ?? 0));
        },
    }))
);
watch(
    () => props.modelValue,
    (value) => {
        if (value === undefined || value === emitted) return;
        if (value !== null) previous = value;
        if (value === null) api.value.clearValue();
        else api.value.setValue(value);
    }
);

// "." and "," both type the decimal separator of the locale; minus and decimals can be blocked
function onKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const input = event.currentTarget as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const rest = input.value.slice(0, start) + input.value.slice(input.selectionEnd ?? start);
    const action = numberInputKey(event.key, rest, currentLocale.value, {
        allowDecimal: props.allowDecimal && props.decimals !== 0,
        allowNegative: props.allowNegative,
    });
    if (!action) return;
    event.preventDefault();
    if (action !== 'block') insertIntoTextControl(input, action.insert);
}
// A pasted number replacing the whole text is read in either notation ("1234.5", "1.234,5")
function onPaste(event: ClipboardEvent) {
    const input = event.currentTarget as HTMLInputElement;
    const whole = (input.selectionStart ?? 0) === 0 && (input.selectionEnd ?? 0) === input.value.length;
    const number = parseLocaleNumber(event.clipboardData?.getData('text') ?? '', currentLocale.value);
    if (!whole || number === null) return;
    event.preventDefault();
    setTextControlValue(input, toNumberInputValue(number, currentLocale.value, format.value));
}
function onFocus(event: FocusEvent) {
    if (!props.selectOnFocus) return;
    const input = event.currentTarget as HTMLInputElement;
    // After the click that focused it, which would place the caret again
    requestAnimationFrame(() => input.select());
}

const prefixId = useId();
const suffixId = useId();
const describedBy = computed(() =>
    props.prefix || props.suffix
        ? [
              field?.value.ariaDescribedby,
              props.prefix && prefixId,
              props.suffix && suffixId,
              split.value.rest['aria-describedby'],
          ]
              .filter(Boolean)
              .join(' ')
        : undefined
);
const isLocked = computed(
    () => !!props.disabled || !!props.readOnly || !!field?.value.disabled || !!field?.value.readOnly
);
const control = useTemplateRef<{ $el: HTMLElement }>('control');
function clear() {
    const input = control.value?.$el.querySelector('input');
    if (!input) return;
    setTextControlValue(input);
    input.focus();
}
// focus(), blur(), select(), setSelectionRange() and the native input (`element`) for template refs
defineExpose(textFieldHandle(() => control.value?.$el.querySelector('input')));
</script>

<template>
    <!-- Number field with − / + buttons, arrow keys and locale formatting ("1,234.5") -->
    <NumberInput.RootProvider :value="api" :class="styles.base({ class: split.className })" :style="split.style">
        <NumberInput.Control ref="control" :class="styles.control()">
            <span v-if="prefix" :id="prefixId" :class="styles.prefix()">{{ prefix }}</span>
            <NumberInput.Input
                v-bind="{ ...split.rest, ...(describedBy ? { 'aria-describedby': describedBy } : {}) }"
                :value="text"
                :class="styles.input()"
                :aria-busy="loading || undefined"
                @keydown="onKeydown"
                @paste="onPaste"
                @focus="onFocus"
            />
            <InputStatus
                v-if="loading || clearable || isSuccess"
                :loading="loading"
                :clear="clearable && !!text && !isLocked"
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
            <span v-if="suffix" :id="suffixId" :class="styles.suffix()">{{ suffix }}</span>
            <div v-if="stepper && stepperLayout === 'stacked'" :class="styles.stepper()">
                <NumberInput.IncrementTrigger :class="styles.button()">
                    <ChevronUp :class="styles.buttonIcon()" aria-hidden="true" />
                </NumberInput.IncrementTrigger>
                <NumberInput.DecrementTrigger :class="styles.button()">
                    <ChevronDown :class="styles.buttonIcon()" aria-hidden="true" />
                </NumberInput.DecrementTrigger>
            </div>
            <template v-else-if="stepper">
                <NumberInput.DecrementTrigger :class="styles.button()">
                    <Minus :class="styles.buttonIcon()" aria-hidden="true" />
                </NumberInput.DecrementTrigger>
                <NumberInput.IncrementTrigger :class="styles.button()">
                    <Plus :class="styles.buttonIcon()" aria-hidden="true" />
                </NumberInput.IncrementTrigger>
            </template>
        </NumberInput.Control>
    </NumberInput.RootProvider>
</template>
