<script setup lang="ts">
import { RadioGroup } from '@ark-ui/vue/radio-group';
import { selectionCard as selectionCardRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface RadioCardProps {
    /** Value of the option inside a RadioGroup */
    value: string;
    /** Title – the accessible name of the radio button */
    title: string;
    /** Text below the title – read as the description */
    description?: string;
    /** Icon component in a box at the start */
    icon?: Component;
    /** Price or other figure at the end, e.g. "$29 / month" – part of the description */
    price?: string;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof selectionCardRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RadioCardProps>(), { disabled: undefined });
const selectionCard = useRecipe('selectionCard', selectionCardRecipe, () => props.classes);
const attrs = useAttrs();
const styles = selectionCard({ type: 'radio' });
const id = useId();
const describedBy = computed(
    () => [props.description && `${id}description`, props.price && `${id}price`].filter(Boolean).join(' ') || undefined
);
</script>

<template>
    <!-- A large card that is one option of a RadioGroup (use `columns` on the group for a grid) -->
    <RadioGroup.Item
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :value="value"
        :disabled="disabled"
    >
        <span v-if="icon" :class="styles.icon()"
            ><component :is="icon" :class="styles.iconSvg()" aria-hidden="true"
        /></span>
        <span :class="styles.body()">
            <span :class="styles.heading()">
                <RadioGroup.ItemText :class="styles.title()">{{ title }}</RadioGroup.ItemText>
                <span v-if="price" :id="`${id}price`" :class="styles.price()">{{ price }}</span>
            </span>
            <span v-if="description" :id="`${id}description`" :class="styles.description()">{{ description }}</span>
            <slot />
        </span>
        <RadioGroup.ItemControl :class="styles.control()" />
        <RadioGroup.ItemHiddenInput :aria-describedby="describedBy" />
    </RadioGroup.Item>
</template>
