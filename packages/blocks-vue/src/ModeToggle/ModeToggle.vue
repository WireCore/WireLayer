<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue';
import {
    getPreferredMode,
    setMode,
    type ColorMode,
    type IconButtonVariant,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { IconButton, useTranslations } from '@wirecore/wirelayer-vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';

export interface ModeToggleProps {
    /** localStorage key for the choice */
    storageKey?: string;
    /** Accessible name while dark is active */
    lightLabel?: string;
    /** Accessible name while light is active */
    darkLabel?: string;
    variant?: IconButtonVariant;
    size?: Size;
}

const props = withDefaults(defineProps<ModeToggleProps>(), {
    storageKey: 'wirecore-mode',
    variant: 'text',
});

const translations = useTranslations();
const mode = ref<ColorMode>('light');
const read = (): ColorMode => (document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light');
// The document's data-mode is the single source of truth – every toggle on the page stays in sync
let observer: MutationObserver | undefined;

onMounted(() => {
    // Keep a mode set before hydration (e.g. by an inline script against flashing), else stored/system
    if (!document.documentElement.dataset.mode) setMode(getPreferredMode(props.storageKey), props.storageKey);
    mode.value = read();
    observer = new MutationObserver(() => (mode.value = read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
});
onBeforeUnmount(() => observer?.disconnect());

const toggle = () => setMode(mode.value === 'dark' ? 'light' : 'dark', props.storageKey);
</script>

<template>
    <IconButton
        :icon="mode === 'dark' ? Sun : Moon"
        :label="
            mode === 'dark'
                ? (lightLabel ?? translations.modeToggle.light)
                : (darkLabel ?? translations.modeToggle.dark)
        "
        :variant="variant"
        :size="size"
        @click="toggle"
    />
</template>
