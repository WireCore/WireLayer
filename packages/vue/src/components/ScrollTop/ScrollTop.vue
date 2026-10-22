<script setup lang="ts">
import { ArrowUp } from '@lucide/vue';
import { type RecipeClasses, scrollTop as scrollTopRecipe } from '@wirecore/wirelayer-recipes';
import { normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs, watch, type ComponentPublicInstance } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface ScrollTopProps {
    /** Shown after scrolling this far (px) */
    threshold?: number;
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof scrollTopRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ScrollTopProps>(), { threshold: 400 });
const scrollTop = useRecipe('scrollTop', scrollTopRecipe, () => props.classes);
const attrs = useAttrs();
const visible = ref(false);
const button = ref<ComponentPublicInstance | null>(null);
// A hidden button must not keep the focus
watch(visible, (shown) => {
    const element = button.value?.$el as HTMLElement | undefined;
    if (!shown && element && document.activeElement === element) element.blur();
});
const update = () => (visible.value = window.scrollY > props.threshold);
onMounted(() => {
    update();
    window.addEventListener('scroll', update, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener('scroll', update));

function toTop() {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    // The next Tab starts at the top of the page again
    document.body.setAttribute('tabindex', '-1');
    document.body.focus({ preventScroll: true });
    document.body.addEventListener('blur', () => document.body.removeAttribute('tabindex'), { once: true });
}
</script>

<template>
    <!-- Hidden (and out of the tab order) until the page is scrolled down -->
    <IconButton
        ref="button"
        :icon="ArrowUp"
        :label="label ?? translations.scrollTop.label"
        variant="primary"
        :class="scrollTop({ class: normalizeClass(attrs.class) })"
        :data-state="visible ? 'visible' : 'hidden'"
        :tabindex="visible ? undefined : -1"
        :aria-hidden="visible ? undefined : 'true'"
        @click="toTop"
    />
</template>
