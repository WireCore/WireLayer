<script setup lang="ts">
import { type RecipeClasses, spoiler as spoilerRecipe } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs, useId, useTemplateRef } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface SpoilerProps {
    /** Height of the cut content in px */
    maxHeight?: number;
    /** Open state – use with v-model:open */
    open?: boolean;
    showLabel?: string;
    hideLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof spoilerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<SpoilerProps>(), {
    maxHeight: 120,
    open: undefined,
});
const spoiler = useRecipe('spoiler', spoilerRecipe, () => props.classes);
const emit = defineEmits<{ 'update:open': [open: boolean] }>();
const attrs = useAttrs();
const styles = spoiler();
const id = useId();
const internal = ref(false);
const isOpen = computed(() => props.open ?? internal.value);
const content = useTemplateRef<HTMLElement>('content');
const fullHeight = ref(0);
// The button only appears when the content is taller than maxHeight
let observer: ResizeObserver | undefined;
onMounted(() => {
    const measure = () =>
        (fullHeight.value = (content.value?.firstElementChild as HTMLElement | null)?.scrollHeight ?? 0);
    measure();
    observer = new ResizeObserver(measure);
    if (content.value?.firstElementChild) observer.observe(content.value.firstElementChild);
});
onBeforeUnmount(() => observer?.disconnect());
const cut = computed(() => fullHeight.value > props.maxHeight);
function toggle() {
    internal.value = !isOpen.value;
    emit('update:open', !isOpen.value);
}
</script>

<template>
    <!-- Content cut to maxHeight; the button (aria-expanded) shows the rest. Hidden text stays in the reading order. -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <div
            :id="`${id}content`"
            ref="content"
            :class="styles.content()"
            :data-state="cut && !isOpen ? 'closed' : 'open'"
            :style="{ maxHeight: cut && !isOpen ? `${maxHeight}px` : cut ? `${fullHeight}px` : undefined }"
        >
            <div><slot /></div>
        </div>
        <button
            v-if="cut"
            type="button"
            :class="styles.toggle()"
            :aria-expanded="isOpen"
            :aria-controls="`${id}content`"
            @click="toggle"
        >
            {{ isOpen ? (hideLabel ?? translations.spoiler.hide) : (showLabel ?? translations.spoiler.show) }}
        </button>
    </div>
</template>
