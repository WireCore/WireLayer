<script setup lang="ts">
import { RadioGroup } from '@ark-ui/vue/radio-group';
import { Check } from '@lucide/vue';
import { colorSwatchPicker as colorSwatchPickerRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ColorSwatch {
    /** CSS colour, e.g. "#1e66f5" or "var(--wc-primary)" – also the value */
    value: string;
    /** Name of the color, e.g. "Blue" (its accessible name) */
    label: string;
    disabled?: boolean;
}

export interface ColorSwatchPickerProps {
    /** The colours to choose from */
    items: ColorSwatch[];
    /** Chosen colour (its value) – use with v-model */
    modelValue?: string | null;
    defaultValue?: string | null;
    /** Visible label of the group (default "Color"; or aria-label) */
    label?: string;
    /** Shows the names below the swatches (otherwise only for screen readers) */
    showLabels?: boolean;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof colorSwatchPickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ColorSwatchPickerProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>();
const colorSwatchPicker = useRecipe('colorSwatchPicker', colorSwatchPickerRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().colorSwatchPicker;
const styles = computed(() => colorSwatchPicker({ size: props.size, showLabels: props.showLabels }));
</script>

<template>
    <!-- Colours as a radio group (arrow keys): every swatch is named by its colour name, the chosen one has a tick -->
    <RadioGroup.Root
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :model-value="modelValue"
        :default-value="defaultValue"
        orientation="horizontal"
        :disabled="disabled"
        :invalid="invalid"
        :required="required"
        :name="name"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <RadioGroup.Label v-if="!attrs['aria-label'] && !attrs['aria-labelledby']" :class="styles.label()">
            {{ label ?? t.label }}
        </RadioGroup.Label>
        <div :class="styles.items()">
            <RadioGroup.Item
                v-for="item in items"
                :key="item.value"
                :value="item.value"
                :disabled="item.disabled"
                :class="styles.item()"
            >
                <RadioGroup.ItemControl :class="styles.swatch()" :style="{ background: item.value }">
                    <RadioGroup.Context v-slot="api">
                        <Check v-if="api.value === item.value" :class="styles.check()" aria-hidden="true" />
                    </RadioGroup.Context>
                </RadioGroup.ItemControl>
                <RadioGroup.ItemText :class="styles.text()">{{ item.label }}</RadioGroup.ItemText>
                <RadioGroup.ItemHiddenInput />
            </RadioGroup.Item>
        </div>
    </RadioGroup.Root>
</template>
