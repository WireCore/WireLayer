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
import { computed, normalizeClass, useAttrs, useId } from 'vue';
import ColorPickerContent from './ColorPickerContent.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface ColorPickerProps {
    /** Colour, e.g. "#1e66f5" ("#1e66f580" with alpha; in `format`) – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Adds an opacity slider; the value then has 8 hex digits */
    alpha?: boolean;
    /** Preset colours shown below the picker */
    swatches?: string[];
    /** Format of the value: hex (default), rgb, hsl, hsb or oklch – e.g. "oklch(55.4% 0.218 262.9)" */
    format?: ColorFormat;
    /** Area and sliders in the popup (default true); false: only the `swatches` (a palette) */
    withPicker?: boolean;
    /** Button to pick a colour from the screen (where the browser supports it) */
    eyeDropper?: boolean;
    /** Number fields for the channels, switchable between RGB, HSL, HSB and OKLCH */
    channelInputs?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof colorPickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ColorPickerProps>(), {
    modelValue: undefined,
    defaultValue: '#000000',
    alpha: false,
    format: 'hex',
    withPicker: true,
    eyeDropper: false,
    channelInputs: false,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
});
const colorPicker = useRecipe('colorPicker', colorPickerRecipe, () => props.classes);
const emit = defineEmits<{ 'update:modelValue': [value: string]; valueChangeEnd: [value: string] }>();
const attrs = useAttrs();
const field = useFieldContext();
const styles = computed(() => colorPicker({ cssText: props.format !== 'hex' }));
const text = translations.colorPicker;
const id = useId();
const nameId = `${id}name`;
const valueId = `${id}value`;
const hexFormat = computed(() => (props.alpha ? 'hexa' : 'hex'));
// Values in other formats (oklch() …) are read here; Ark knows hex, rgb, hsl and hsb
const toArk = (value: string) => parseColor(parseColorText(value) ?? value);
const parsed = computed(() => (props.modelValue === undefined ? undefined : toArk(props.modelValue)));
const initial = computed(() => toArk(props.defaultValue));
/** The value as text in the chosen format */
const textOf = (color: { toString(format: 'hex' | 'hexa'): string }) =>
    props.format === 'hex'
        ? color.toString(hexFormat.value)
        : formatColor(color.toString(hexFormat.value), props.format);
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);
</script>

<template>
    <!-- Colour field: the button opens a panel with area, hue (and opacity) slider, hex input and presets -->
    <ColorPicker.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :model-value="parsed"
        :default-value="initial"
        :disabled="disabled ?? field?.disabled"
        :read-only="readOnly ?? field?.readOnly"
        :invalid="invalid ?? field?.invalid"
        :name="name"
        :positioning="{ placement: 'bottom-start', gutter: 4 }"
        lazy-mount
        unmount-on-exit
        @value-change="emit('update:modelValue', textOf($event.value))"
        @value-change-end="emit('valueChangeEnd', textOf($event.value))"
    >
        <ColorPicker.Context v-slot="api">
            <ColorPicker.Control :class="styles.control()">
                <!-- Named by the Field label (or aria-label) plus the current value, which is visible -->
                <ColorPicker.Trigger
                    :class="styles.trigger()"
                    :aria-label="text.trigger(textOf(api.value))"
                    :aria-labelledby="`${field ? field.ids.label : nameId} ${valueId}`"
                    :aria-describedby="field?.ariaDescribedby"
                >
                    <span v-if="!field" :id="nameId" :class="styles.hiddenName()">{{ ariaLabel ?? text.name }}</span>
                    <ColorPicker.ValueSwatch :class="styles.swatch()" />
                    <span :id="valueId" :class="styles.valueText()">{{ textOf(api.value) }}</span>
                </ColorPicker.Trigger>
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
        <!-- Only for form submission – Ark renders it as an unlabelled text input -->
        <ColorPicker.HiddenInput v-if="name" aria-hidden="true" />
    </ColorPicker.Root>
</template>
