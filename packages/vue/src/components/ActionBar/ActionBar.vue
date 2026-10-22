<script setup lang="ts">
import { X } from '@lucide/vue';
import { actionBar as actionBarRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import Toolbar from '../Toolbar/Toolbar.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface ActionBarProps {
    /** Number of selected items – the bar shows while it is above 0 */
    count: number;
    /** Shows the bar independently of `count` */
    open?: boolean;
    /** Accessible name of the toolbar */
    label?: string;
    /** Name of the button that clears the selection */
    clearLabel?: string;
    /** `fixed` floats at the bottom of the window, `inline` stays in the flow */
    placement?: 'fixed' | 'inline';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof actionBarRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ActionBarProps>(), { open: undefined });
const actionBar = useRecipe('actionBar', actionBarRecipe, () => props.classes);
const emit = defineEmits<{ clear: [] }>();
const attrs = useAttrs();
const styles = computed(() => actionBar({ placement: props.placement }));
const shown = computed(() => props.open ?? props.count > 0);
</script>

<template>
    <!-- Actions for the selected items: a toolbar (one tab stop, arrow keys) with the count and a clear button -->
    <Toolbar
        v-if="shown"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :label="label ?? translations.actionBar.label"
    >
        <span role="status" :class="styles.count()">{{ translations.common.selectedCount(count) }}</span>
        <slot />
        <span :class="styles.separator()" aria-hidden="true" />
        <IconButton
            :icon="X"
            :label="clearLabel ?? translations.actionBar.clear"
            variant="text"
            size="sm"
            @click="emit('clear')"
        />
    </Toolbar>
</template>
