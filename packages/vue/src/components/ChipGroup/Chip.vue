<script setup lang="ts">
import { ToggleGroup } from '@ark-ui/vue/toggle-group';
import { X } from '@lucide/vue';
import {
    chip as chipRecipe,
    chipGroup as chipGroupRecipe,
    type ChipSize,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, inject, normalizeClass, useAttrs, type Component } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { chipGroupKey } from './context.js';

export interface ChipProps {
    /** Value of the option inside a ChipGroup (required there; a standalone chip does not need it) */
    value?: string;
    /** Icon component before the label */
    icon?: Component;
    disabled?: boolean;
    /** Text of a standalone chip (or the default slot); also names its remove button */
    label?: string;
    /** Standalone chip: small round image before the label (decorative) */
    avatar?: string;
    /** Standalone chip: shows a remove button that emits `remove` */
    removable?: boolean;
    /** Accessible name of the remove button (default: "Remove <label>") */
    removeLabel?: string;
    /** Standalone chip: size */
    size?: ChipSize;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipes chipGroup and chip) */
    classes?: RecipeClasses<typeof chipGroupRecipe> & RecipeClasses<typeof chipRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ChipProps>(), { disabled: undefined, removable: false });
const emit = defineEmits<{ remove: [] }>();
const inGroup = inject(chipGroupKey, false);
const chipGroup = useRecipe('chipGroup', chipGroupRecipe, () => props.classes);
const chip = useRecipe('chip', chipRecipe, () => props.classes);
const translations = useTranslations();
const attrs = useAttrs();
const styles = chipGroup();
const own = computed(() =>
    chip({ size: props.size, removable: props.removable, withAvatar: !!props.avatar, disabled: !!props.disabled })
);
</script>

<template>
    <ToggleGroup.Item
        v-if="inGroup"
        v-bind="{ ...attrs, class: styles.chip({ class: normalizeClass(attrs.class) }) }"
        :value="value ?? ''"
        :disabled="disabled"
    >
        <component :is="icon" v-if="icon" :class="styles.icon()" aria-hidden="true" />
        <slot />
    </ToggleGroup.Item>
    <!-- Standalone: a label, not a control; only the remove button is focusable -->
    <span v-else v-bind="{ ...attrs, class: own.base({ class: normalizeClass(attrs.class) }) }">
        <img v-if="avatar" :src="avatar" alt="" :class="own.avatar()" />
        <component :is="icon" v-else-if="icon" :class="own.icon()" aria-hidden="true" />
        <span :class="own.label()"
            ><slot>{{ label }}</slot></span
        >
        <button
            v-if="removable"
            type="button"
            :class="own.remove()"
            :disabled="disabled"
            :aria-label="removeLabel ?? translations.chip.remove(label)"
            @click="emit('remove')"
        >
            <X :class="own.removeIcon()" aria-hidden="true" />
        </button>
    </span>
</template>
