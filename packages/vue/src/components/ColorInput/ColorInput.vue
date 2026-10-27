<script setup lang="ts">
import { ColorPicker, parseColor } from '@ark-ui/vue/color-picker';
import { useFieldContext } from '@ark-ui/vue/field';
import {
    colorPicker as colorPickerRecipe,
    formatColor,
    parseColorText,
    type ColorFormat,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId, watch } from 'vue';
import ColorPickerContent from '../ColorPicker/ColorPickerContent.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ColorInputProps {
    /** Colour as text in `format` – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Format of the value and the field: hex (default), rgb, hsl, hsb or oklch; typing accepts all of them */
    format?: ColorFormat;
    /** Adds an opacity slider */
    alpha?: boolean;
    /** Preset colours in the popup */
    swatches?: readonly string[];
    /** Area and sliders in the popup (default true); false: only the `swatches` */
    withPicker?: boolean;
    /** Button to pick a colour from the screen (where supported) */
    eyeDropper?: boolean;
    /** Number fields for the channels in the popup */
    channelInputs?: boolean;
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    /** Name of the field for form submission (its text) */
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof colorPickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ColorInputProps>(), {
    modelValue: undefined,
    defaultValue: '#000000',
    format: 'hex',
    withPicker: true,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();
const colorPicker = useRecipe('colorPicker', colorPickerRecipe, () => props.classes);
const attrs = useAttrs();
const field = useFieldContext();
const text = useTranslations().colorPicker;
const styles = colorPicker();
const openId = `${useId()}open`;
const hexOf = (value: string) => parseColorText(value) ?? '#000000';
const toArk = (value: string) => parseColor(hexOf(value));
const textOf = (hex: string) => formatColor(hex, props.format);
const current = ref(hexOf(props.modelValue ?? props.defaultValue));
watch(
    () => props.modelValue,
    (value) => value !== undefined && (current.value = hexOf(value))
);
const draft = ref<string | null>(null);
const shown = computed(() => draft.value ?? textOf(current.value));
const draftInvalid = computed(() => draft.value !== null && !!draft.value.trim() && !parseColorText(draft.value));
const isInvalid = computed(() => (props.invalid ?? field?.value.invalid) || draftInvalid.value);

function onArkChange(hex: string) {
    current.value = hex;
    emit('update:modelValue', textOf(hex));
}
// Typed text counts on Enter or when leaving the field; unreadable text goes back to the colour
function commit(api: { setValue(value: unknown): void }) {
    const hex = draft.value === null ? null : parseColorText(draft.value);
    draft.value = null;
    if (hex && hex !== current.value) api.setValue(parseColor(hex));
}
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const bottomStartPositioning = { placement: 'bottom-start', gutter: 4 } as const;
</script>

<template>
    <!-- Colour field: type a colour (hex, rgb(), hsl(), oklch()) or open the picker with the swatch button -->
    <ColorPicker.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :model-value="modelValue === undefined ? undefined : toArk(modelValue)"
        :default-value="toArk(defaultValue)"
        :disabled="disabled ?? field?.disabled"
        :read-only="readOnly ?? field?.readOnly"
        :invalid="isInvalid"
        :positioning="bottomStartPositioning"
        lazy-mount
        unmount-on-exit
        @value-change="onArkChange($event.value.toString(alpha ? 'hexa' : 'hex'))"
    >
        <ColorPicker.Context v-slot="api">
            <ColorPicker.Control :class="styles.control()">
                <!-- Named by its own text (Ark would name it by the Field label, like the text field) -->
                <ColorPicker.Trigger :class="styles.inputTrigger()" :aria-labelledby="openId">
                    <ColorPicker.ValueSwatch :class="styles.swatch()" />
                    <span :id="openId" :class="styles.hiddenName()">{{ text.open }}</span>
                </ColorPicker.Trigger>
                <input
                    v-bind="{ ...attrs, class: undefined, style: undefined }"
                    :id="field?.ids.control ?? (attrs.id as string | undefined)"
                    type="text"
                    :class="styles.textInput()"
                    :value="shown"
                    :name="name"
                    :placeholder="placeholder"
                    :disabled="(disabled ?? field?.disabled) || undefined"
                    :readonly="readOnly ?? field?.readOnly"
                    :aria-label="
                        field
                            ? undefined
                            : ((attrs['aria-label'] as string | undefined) ?? (attrs.id ? undefined : text.name))
                    "
                    :aria-invalid="isInvalid || undefined"
                    :aria-describedby="field?.ariaDescribedby"
                    spellcheck="false"
                    autocomplete="off"
                    @input="draft = ($event.target as HTMLInputElement).value"
                    @keydown.enter.prevent="commit(api)"
                    @blur="commit(api)"
                />
            </ColorPicker.Control>
        </ColorPicker.Context>
        <ColorPickerContent
            :alpha="alpha"
            :swatches="swatches"
            :with-picker="withPicker"
            :eye-dropper="eyeDropper"
            :channel-inputs="channelInputs"
            :classes="classes"
        />
    </ColorPicker.Root>
</template>
