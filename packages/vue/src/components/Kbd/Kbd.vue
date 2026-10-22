<script setup lang="ts">
import { formatHotkey, kbd as kbdRecipe, kbdGroup, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed } from 'vue';
import { useIsApple } from '../../composables/hotkeys.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface KbdProps {
    /**
     * A shortcut to show key by key, e.g. "mod+k" → Ctrl K (⌘ K on Apple devices), "g i" → G then I. Without it the
     * slot is the key
     */
    hotkey?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof kbdRecipe>;
}

const props = defineProps<KbdProps>();
const kbd = useRecipe('kbd', kbdRecipe, () => props.classes);
const translations = useTranslations();
const apple = useIsApple();
const steps = computed(() => (props.hotkey ? formatHotkey(props.hotkey, translations.hotkeys.keys, apple.value) : []));
</script>

<template>
    <!-- One key per <kbd> inside a <kbd> for the whole shortcut (HTML's way to mark up key combinations) -->
    <kbd v-if="hotkey" :class="kbdGroup()"
        ><template v-for="(keys, step) in steps" :key="step"
            ><template v-if="step > 0"> {{ translations.hotkeys.then }} </template
            ><kbd v-for="key in keys" :key="key" :class="kbd()">{{ key }}</kbd></template
        ></kbd
    >
    <!-- A key, e.g. <Kbd>Strg</Kbd> + <Kbd>K</Kbd> -->
    <kbd v-else :class="kbd()"><slot /></kbd>
</template>
