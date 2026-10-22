<script setup lang="ts">
import { Info } from '@lucide/vue';
import { toggletip as toggletipRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, ref, useAttrs, useTemplateRef, watch, type Component } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ToggletipProps {
    /** The explanation (or the default slot) */
    content?: string;
    /** What it explains, e.g. the field label – names the button "More information about <label>" */
    label?: string;
    /** Own accessible name of the button */
    triggerLabel?: string;
    /** Open state – use with v-model:open */
    open?: boolean;
    /** Icon of the button (default: info) */
    icon?: Component;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof toggletipRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ToggletipProps>(), { open: undefined });
const toggletip = useRecipe('toggletip', toggletipRecipe, () => props.classes);
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = toggletip();
const internal = ref(false);
const isOpen = computed(() => props.open ?? internal.value);
const root = useTemplateRef<HTMLElement>('root');
const name = computed(
    () =>
        props.triggerLabel ??
        (props.label ? translations.toggletip.labelFor(props.label) : translations.toggletip.label)
);
function setOpen(next: boolean) {
    internal.value = next;
    emit('update:open', next);
}
// While open: Escape and a click outside close it (the focus stays on the button)
const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    setOpen(false);
};
const onPointer = (event: PointerEvent) => {
    if (!root.value?.contains(event.target as Node)) setOpen(false);
};
const listen = (on: boolean) => {
    if (typeof document === 'undefined') return;
    if (on) {
        document.addEventListener('keydown', onKey);
        document.addEventListener('pointerdown', onPointer);
    } else {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('pointerdown', onPointer);
    }
};
watch(isOpen, listen);
onBeforeUnmount(() => listen(false));
</script>

<template>
    <!--
        (i) button: a click shows the explanation in a bubble inside a live region (role="status"), so screen readers
        read it; Escape, a second click or a click outside close it. Not modal, the focus stays on the button.
    -->
    <span ref="root" v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <button
            type="button"
            :class="styles.trigger()"
            :aria-label="name"
            :aria-expanded="isOpen"
            @click="setOpen(!isOpen)"
        >
            <component :is="icon ?? Info" :class="styles.icon()" aria-hidden="true" />
        </button>
        <span role="status">
            <span v-if="isOpen" :class="styles.bubble()"
                ><slot>{{ content }}</slot></span
            >
        </span>
    </span>
</template>
