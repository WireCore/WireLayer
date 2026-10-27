<script setup lang="ts">
import { Checkbox } from '@ark-ui/vue/checkbox';
import { useFieldContext } from '@ark-ui/vue/field';
import { Check } from '@lucide/vue';
import { controlIds, selectionCard as selectionCardRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, useAttrs, useId, type Component } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useRecipe } from '../../recipes.js';
import type { CheckedState } from '../Checkbox/Checkbox.vue';

export interface CheckboxCardProps {
    /** Title – the accessible name of the checkbox */
    title: string;
    /** Text below the title – read as the description */
    description?: string;
    /** Icon component in a box at the start */
    icon?: Component;
    /** Price or other figure at the end, e.g. "$29 / month" – part of the description */
    price?: string;
    /** Value inside a CheckboxGroup */
    value?: string;
    /** Controlled state – use with v-model:checked (alone; in a CheckboxGroup the group holds the value) */
    checked?: CheckedState;
    defaultChecked?: CheckedState;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Id of the check box (the hidden input), e.g. for a `<label for>` */
    id?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof selectionCardRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CheckboxCardProps>(), {
    checked: undefined,
    defaultChecked: undefined,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const selectionCard = useRecipe('selectionCard', selectionCardRecipe, () => props.classes);
const emit = defineEmits<{ 'update:checked': [checked: CheckedState] }>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = selectionCard({ type: 'checkbox' });
const uid = useId();
const describedBy = computed(
    () =>
        [props.description && `${uid}description`, props.price && `${uid}price`].filter(Boolean).join(' ') || undefined
);
// An own id goes to the hidden input through Ark (it finds the input by its id)
const field = useFieldContext();
const ids = computed(() =>
    controlIds(props.id, 'hiddenInput', { label: field?.value.ids.label, hiddenInput: field?.value.ids.control })
);
</script>

<template>
    <!-- A large card that is one checkbox: title (name), description and price (description), icon -->
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
        @update:checked="emit('update:checked', $event)"
    >
        <span v-if="icon" :class="styles.icon()"
            ><component :is="icon" :class="styles.iconSvg()" aria-hidden="true"
        /></span>
        <span :class="styles.body()">
            <span :class="styles.heading()">
                <Checkbox.Label :class="styles.title()">{{ title }}</Checkbox.Label>
                <span v-if="price" :id="`${uid}price`" :class="styles.price()">{{ price }}</span>
            </span>
            <span v-if="description" :id="`${uid}description`" :class="styles.description()">{{ description }}</span>
            <slot />
        </span>
        <Checkbox.Control :class="styles.control()">
            <Checkbox.Indicator><Check :class="styles.controlIcon()" aria-hidden="true" /></Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.HiddenInput v-bind="split.rest" :aria-describedby="describedBy" />
    </Checkbox.Root>
</template>
