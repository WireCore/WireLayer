<script setup lang="ts">
import { ChevronDown } from '@lucide/vue';
import {
    button as buttonRecipe,
    buttonColorKey,
    type ButtonColor,
    type ButtonShape,
    type ButtonSize,
    type ButtonVariant,
    type RecipeClasses,
    splitButton as splitButtonRecipe,
} from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs, type Component } from 'vue';
import Menu from '../Menu/Menu.vue';
import type { MenuEntry } from '../Menu/types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface SplitButtonProps {
    /** Label of the main action */
    label: string;
    /** The other actions in the menu */
    items: MenuEntry[];
    variant?: Exclude<ButtonVariant, 'link' | 'text'>;
    /** Colour combined with the variant, like Button `color` (e.g. outline in danger) */
    color?: ButtonColor;
    size?: ButtonSize;
    /** Corner shape of the joined control: `pill` (default), `rounded` or `square` */
    shape?: ButtonShape;
    icon?: Component;
    disabled?: boolean;
    /** Accessible name of the menu button */
    menuLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof splitButtonRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SplitButtonProps>(), {
    variant: 'primary',
    size: 'md',
    icon: undefined,
    disabled: false,
});
const button = useRecipe('button', buttonRecipe);
const splitButton = useRecipe('splitButton', splitButtonRecipe, () => props.classes);
const emit = defineEmits<{ click: [event: MouseEvent]; select: [value: string] }>();
const attrs = useAttrs();
const styles = splitButton();
const look = () =>
    button({ variant: props.variant, color: buttonColorKey(props.color), size: props.size, shape: props.shape });
</script>

<template>
    <!-- Main action plus a menu with the other actions; both are separate buttons -->
    <div
        role="group"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :aria-label="label"
    >
        <button
            type="button"
            :class="look().base({ class: styles.main() })"
            :disabled="disabled"
            @click="emit('click', $event)"
        >
            <component :is="icon" v-if="icon" :class="look().icon()" aria-hidden="true" />
            {{ label }}
        </button>
        <Menu :items="items" @select="emit('select', $event)">
            <button
                type="button"
                :class="look().base({ class: styles.toggle() })"
                :disabled="disabled"
                :aria-label="menuLabel ?? translations.splitButton.more"
            >
                <ChevronDown :class="styles.toggleIcon()" aria-hidden="true" />
            </button>
        </Menu>
    </div>
</template>
