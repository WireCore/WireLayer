<script setup lang="ts">
import { Clipboard } from '@ark-ui/vue/clipboard';
import { Check, Copy } from '@lucide/vue';
import {
    copyButton as copyButtonRecipe,
    iconButton as iconButtonRecipe,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { normalizeClass, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface CopyButtonProps {
    /** Text that is copied */
    value: string;
    /** Shows the value next to the button (monospace) */
    showValue?: boolean;
    /** Accessible name, e.g. "Copy IP address" */
    label?: string;
    size?: Size;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof copyButtonRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CopyButtonProps>(), { showValue: false, size: 'sm' });
const copyButton = useRecipe('copyButton', copyButtonRecipe, () => props.classes);
const iconButton = useRecipe('iconButton', iconButtonRecipe);
const attrs = useAttrs();
const styles = copyButton();
</script>

<template>
    <!-- Copies the value; the icon turns into a check and "Copied to clipboard" is announced -->
    <Clipboard.Root
        :model-value="value"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
    >
        <span v-if="showValue" :class="styles.value()">{{ value }}</span>
        <Clipboard.Trigger
            :class="iconButton({ variant: 'text', size }).base()"
            :aria-label="label ?? translations.copyButton.label"
        >
            <Clipboard.Indicator>
                <Copy :class="iconButton({ size }).icon()" aria-hidden="true" />
                <template #copied><Check :class="iconButton({ size }).icon()" aria-hidden="true" /></template>
            </Clipboard.Indicator>
        </Clipboard.Trigger>
        <Clipboard.Context v-slot="api">
            <span role="status" :class="styles.status()">{{ api.copied ? translations.copyButton.copied : '' }}</span>
        </Clipboard.Context>
    </Clipboard.Root>
</template>
