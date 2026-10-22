<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, Megaphone, TriangleAlert, X } from '@lucide/vue';
import {
    banner as bannerRecipe,
    type BannerPosition,
    type BannerVariant,
    readStored,
    type RecipeClasses,
    writeStored,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onMounted, ref, useAttrs, type Component } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface BannerProps {
    /** info (default), success, warn, danger or neutral */
    variant?: BannerVariant;
    /** Bold text before the message */
    title?: string;
    /** `inline` (default): in the flow; `top`/`bottom`: fixed to that edge of the window */
    position?: BannerPosition;
    /** Shows a close button */
    dismissible?: boolean;
    /** Controlled visibility – use with v-model:open */
    open?: boolean;
    /** Remembers the dismissal in localStorage under this key – the banner stays hidden on the next visit */
    storageKey?: string;
    /** Own icon instead of the one for the variant */
    icon?: Component;
    hideIcon?: boolean;
    /** Name of the close button (default "Dismiss notice") */
    dismissLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof bannerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<BannerProps>(), { open: undefined });
const banner = useRecipe('banner', bannerRecipe, () => props.classes);
const emit = defineEmits<{ 'update:open': [open: boolean]; dismiss: [] }>();
const slots = defineSlots<{ default?(): unknown; actions?(): unknown }>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = computed(() => banner({ variant: props.variant, position: props.position }));
const icons: Record<BannerVariant, Component> = {
    info: Info,
    success: CircleCheck,
    warn: TriangleAlert,
    danger: CircleAlert,
    neutral: Megaphone,
};
const icon = computed(() => props.icon ?? icons[props.variant ?? 'info']);
// Urgent problems interrupt (alert), everything else is announced politely (status)
const role = computed(() => (props.variant === 'danger' ? 'alert' : 'status'));

const internal = ref(true);
const visible = computed(() => props.open ?? internal.value);
// A remembered dismissal is only known in the browser (after the server-rendered first paint)
onMounted(() => {
    if (readStored(props.storageKey) === 'dismissed') internal.value = false;
});
function dismiss() {
    internal.value = false;
    writeStored(props.storageKey, 'dismissed');
    emit('update:open', false);
    emit('dismiss');
}
</script>

<template>
    <!--
        Page-wide notice: message in a live region (role="alert" for danger, else "status"), actions and an optional
        close button; a dismissal can be remembered (storageKey)
    -->
    <div v-if="visible" v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <component :is="icon" v-if="!hideIcon" :class="styles.icon()" aria-hidden="true" />
        <div :role="role" :class="styles.content()">
            <span v-if="title" :class="styles.title()">{{ title }}</span>
            <span v-if="slots.default" :class="styles.message()"><slot /></span>
        </div>
        <div v-if="slots.actions" :class="styles.actions()"><slot name="actions" /></div>
        <button
            v-if="dismissible"
            type="button"
            :class="styles.dismiss()"
            :aria-label="dismissLabel ?? translations.banner.dismiss"
            @click="dismiss"
        >
            <X :class="styles.dismissIcon()" aria-hidden="true" />
        </button>
    </div>
</template>
