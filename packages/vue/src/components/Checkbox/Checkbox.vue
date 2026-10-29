<script setup lang="ts" generic="C extends CheckedState = CheckedState">
import { Checkbox } from '@ark-ui/vue/checkbox';
import { useFieldContext } from '@ark-ui/vue/field';
import { Check, Minus } from '@lucide/vue';
import { controlIds, checkbox as checkboxRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, useAttrs } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useRecipe } from '../../recipes.js';

export type CheckedState = boolean | 'indeterminate';

/**
 * `C`: the state type – inferred from `checked`/`defaultChecked`, so a boolean v-model:checked gets booleans back (the
 * indeterminate state only comes from `checked`)
 */
export interface CheckboxProps<C extends CheckedState = CheckedState> {
    /** Controlled state – use with v-model:checked */
    checked?: C;
    defaultChecked?: C;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    value?: string;
    /** Id of the check box (the hidden input), e.g. for a `<label for>` */
    id?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof checkboxRecipe>;
}

defineOptions({ inheritAttrs: false });
// undefined (not false) when absent: uncontrolled by default, and a surrounding Field can still disable it
const props = withDefaults(defineProps<CheckboxProps<C>>(), {
    checked: undefined,
    defaultChecked: undefined,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const checkbox = useRecipe('checkbox', checkboxRecipe, () => props.classes);
const emit = defineEmits<{ 'update:checked': [checked: C] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = checkbox();
// An own id goes to the hidden input through Ark (it finds the input by its id)
const field = useFieldContext();
const ids = computed(() =>
    controlIds(props.id, 'hiddenInput', { label: field?.value.ids.label, hiddenInput: field?.value.ids.control })
);
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
        v-bind="ids"
        @update:checked="emit('update:checked', $event as C)"
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
