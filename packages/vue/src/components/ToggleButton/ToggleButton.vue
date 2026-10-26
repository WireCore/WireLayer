<script setup lang="ts">
import { Toggle } from '@ark-ui/vue/toggle';
import {
    button as buttonRecipe,
    type RecipeClasses,
    type Size,
    toggleButton as toggleButtonRecipe,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, type Component } from 'vue';
import { useRecipe } from '../../recipes.js';

export interface ToggleButtonProps {
    /** Pressed state – use with v-model:pressed */
    pressed?: boolean;
    defaultPressed?: boolean;
    size?: Size;
    icon?: Component;
    /** Icon while pressed (default: `icon`) – the label stays the same */
    pressedIcon?: Component;
    /** Props passed on to the icon component, e.g. { fill: 'currentColor' } for a filled icon or { strokeWidth: 1.5 } */
    iconProps?: Record<string, unknown>;
    /** Props of the icon while pressed, added to `iconProps` – e.g. { fill: 'currentColor' }: a filled icon when on */
    pressedIconProps?: Record<string, unknown>;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof toggleButtonRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ToggleButtonProps>(), {
    pressed: undefined,
    defaultPressed: false,
    size: 'md',
    icon: undefined,
    pressedIcon: undefined,
    disabled: false,
});
const button = useRecipe('button', buttonRecipe);
const toggleButton = useRecipe('toggleButton', toggleButtonRecipe, () => props.classes);
const emit = defineEmits<{ 'update:pressed': [pressed: boolean] }>();
const attrs = useAttrs();
const look = computed(() => button({ variant: 'outline', size: props.size }));
</script>

<template>
    <!-- Button that stays pressed (aria-pressed), e.g. "Active only" – the label does not change with the state -->
    <Toggle.Root
        v-bind="attrs"
        :class="look.base({ class: [toggleButton(), normalizeClass(attrs.class)] })"
        :pressed="pressed"
        :default-pressed="defaultPressed"
        :disabled="disabled"
        @pressed-change="emit('update:pressed', $event)"
    >
        <Toggle.Context v-if="icon || pressedIcon" v-slot="api">
            <component
                :is="api.pressed ? (pressedIcon ?? icon) : icon"
                v-if="api.pressed ? (pressedIcon ?? icon) : icon"
                v-bind="api.pressed ? { ...iconProps, ...pressedIconProps } : iconProps"
                :class="look.icon()"
                aria-hidden="true"
            />
        </Toggle.Context>
        <slot />
    </Toggle.Root>
</template>
