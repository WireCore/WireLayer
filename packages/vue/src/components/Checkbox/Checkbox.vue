<script setup lang="ts">
import { Checkbox } from '@ark-ui/vue/checkbox';
import { Check, Minus } from '@lucide/vue';
import { checkbox as checkboxRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useRecipe } from '../../recipes.js';

export type CheckedState = boolean | 'indeterminate';

export interface CheckboxProps {
    /** Controlled state – use with v-model:checked */
    checked?: CheckedState;
    defaultChecked?: CheckedState;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof checkboxRecipe>;
}

defineOptions({ inheritAttrs: false });
// undefined (not false) when absent: uncontrolled by default, and a surrounding Field can still disable it
const props = withDefaults(defineProps<CheckboxProps>(), {
    checked: undefined,
    defaultChecked: undefined,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const checkbox = useRecipe('checkbox', checkboxRecipe, () => props.classes);
const emit = defineEmits<{ 'update:checked': [checked: CheckedState] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = checkbox();
</script>

<template>
    <Checkbox.Root
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :checked="checked"
        :default-checked="defaultChecked"
        :disabled="disabled"
        :invalid="invalid"
        :required="required"
        :name="name"
        :value="value"
        @update:checked="emit('update:checked', $event)"
    >
        <Checkbox.Control :class="styles.control()">
            <Checkbox.Indicator>
                <Check :class="styles.icon()" aria-hidden="true" />
            </Checkbox.Indicator>
            <Checkbox.Indicator indeterminate>
                <Minus :class="styles.icon()" aria-hidden="true" />
            </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label v-if="$slots.default" :class="styles.label()"><slot /></Checkbox.Label>
        <Checkbox.HiddenInput v-bind="split.rest" />
    </Checkbox.Root>
</template>
