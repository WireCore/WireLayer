<script setup lang="ts">
import { authLayout as authLayoutRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useRecipe } from '@wirecore/wirelayer-vue';
import { computed, normalizeClass, useAttrs } from 'vue';

export interface AuthLayoutProps {
    /** Decorative image on the other side (hidden on small screens) */
    image?: string;
    /** Form on the start (default) or end side */
    side?: 'start' | 'end';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof authLayoutRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AuthLayoutProps>(), { side: 'start' });
defineSlots<{
    /** The form (e.g. AuthForm) */
    default?(): unknown;
    /** Logo or product name above the form */
    brand?(): unknown;
    /** Text over the image: quote, product promise … */
    teaser?(): unknown;
    /** Below the form: imprint, privacy */
    footer?(): unknown;
}>();
const authLayout = useRecipe('authLayout', authLayoutRecipe, () => props.classes);
const attrs = useAttrs();
const styles = computed(() => authLayout({ side: props.side }));
</script>

<template>
    <!-- Two columns: the form in <main>, the image with a teaser as a complementary area (stacked on small screens) -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <main :class="styles.main()">
            <div v-if="$slots.brand" :class="styles.brand()"><slot name="brand" /></div>
            <div :class="styles.content()"><slot /></div>
            <div v-if="$slots.footer" :class="styles.footer()"><slot name="footer" /></div>
        </main>
        <aside v-if="image || $slots.teaser" :class="styles.aside()">
            <template v-if="image">
                <img :src="image" alt="" :class="styles.image()" />
                <div :class="styles.scrim()" aria-hidden="true" />
            </template>
            <div v-if="$slots.teaser" :class="styles.teaser()"><slot name="teaser" /></div>
        </aside>
    </div>
</template>
