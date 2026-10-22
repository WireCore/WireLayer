<script setup lang="ts">
import { CircleCheck, Info, OctagonX, TriangleAlert, X } from '@lucide/vue';
import {
    alert as alertRecipe,
    createPausableTimer,
    type AlertStatus,
    type AlertVariant,
    type PausableTimer,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, useAttrs, watch } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface AlertProps {
    status?: AlertStatus;
    /** `box` (default) or `simple`: only icon and text in the status colour, e.g. for a field error */
    variant?: AlertVariant;
    size?: 'sm' | 'md';
    title?: string;
    /** Shows a close button that emits `dismiss` */
    dismissible?: boolean;
    /** Accessible name of the close button */
    dismissLabel?: string;
    /**
     * Emits `dismiss` after this many milliseconds. The time pauses while the pointer is over the alert or the focus
     * is in it (WCAG 2.2.1); prefer `dismissible` for messages people need to read
     */
    duration?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof alertRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AlertProps>(), { status: 'info' });
const alert = useRecipe('alert', alertRecipe, () => props.classes);
const emit = defineEmits<{ dismiss: [] }>();
const attrs = useAttrs();

const icons = { neutral: Info, success: CircleCheck, info: Info, warn: TriangleAlert, danger: OctagonX };
const styles = computed(() => alert({ status: props.status, variant: props.variant, size: props.size }));

// Auto-dismiss: paused while hovered or focused
let timer: PausableTimer | undefined;
let hovered = false;
let focused = false;
const start = () => {
    timer?.clear();
    timer = props.duration ? createPausableTimer(() => emit('dismiss'), props.duration) : undefined;
    if (hovered || focused) timer?.pause();
};
const update = () => (hovered || focused ? timer?.pause() : timer?.resume());
onMounted(start);
watch(() => props.duration, start);
onBeforeUnmount(() => timer?.clear());
const onPointerEnter = () => ((hovered = true), update());
const onPointerLeave = () => ((hovered = false), update());
const onFocusIn = () => ((focused = true), update());
const onFocusOut = (event: FocusEvent) => {
    focused = (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null);
    update();
};
</script>

<template>
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :role="status === 'danger' || status === 'warn' ? 'alert' : 'status'"
        @mouseenter="onPointerEnter"
        @mouseleave="onPointerLeave"
        @focusin="onFocusIn"
        @focusout="onFocusOut"
    >
        <span :class="styles.iconBox()">
            <component :is="icons[status]" :class="styles.icon()" aria-hidden="true" />
        </span>
        <div :class="styles.content()">
            <div v-if="title" :class="styles.title()">{{ title }}</div>
            <div v-if="$slots.default" :class="styles.description()"><slot /></div>
        </div>
        <button
            v-if="dismissible"
            type="button"
            :class="styles.dismiss()"
            :aria-label="dismissLabel ?? translations.common.close"
            @click="emit('dismiss')"
        >
            <X :class="styles.dismissIcon()" aria-hidden="true" />
        </button>
    </div>
</template>
