<script setup lang="ts">
import { Toast, Toaster } from '@ark-ui/vue/toast';
import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert, X } from '@lucide/vue';
import { isSwipeDismiss, type RecipeClasses, toast as toastRecipe } from '@wirecore/wirelayer-recipes';
import { computed, reactive } from 'vue';
import { toaster as appToaster } from './toaster.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface ToasterProps {
    /** A toaster from createToaster() – without it the app-wide one of toast() */
    toaster?: typeof appToaster;
    /** Accessible name of the notification region */
    label?: string;
    /** Accessible name of each toast's close button */
    closeLabel?: string;
    /** Thin bar at the bottom that shows the remaining time (decorative; stops while paused) */
    showProgress?: boolean;
    /** Toasts can be swiped away sideways (touch, pen and mouse); the close button stays */
    swipeToDismiss?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof toastRecipe>;
}

const props = defineProps<ToasterProps>();
const toast = useRecipe('toast', toastRecipe, () => props.classes);
const styles = computed(() => toast({ showProgress: props.showProgress, swipeable: props.swipeToDismiss }));
const icons = { success: CircleCheck, info: Info, warning: TriangleAlert, error: OctagonX };
const store = computed(() => props.toaster ?? appToaster);

// Swiping: the toast follows the pointer sideways and closes when let go far enough
const swipes = reactive<Record<string, { start: number; distance: number; active: boolean }>>({});
function swipeProps(id: string | undefined) {
    if (!props.swipeToDismiss || !id) return {};
    const swipe = swipes[id];
    return {
        style: swipe?.distance
            ? {
                  translate: `calc(var(--x) + ${swipe.distance}px) var(--y)`,
                  ...(swipe.active ? { transition: 'none' } : {}),
              }
            : undefined,
        onPointerdown: (event: PointerEvent) => {
            if (event.button !== 0 || (event.target as Element).closest('button')) return;
            swipes[id] = { start: event.clientX, distance: 0, active: true };
            (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
        },
        onPointermove: (event: PointerEvent) => {
            const current = swipes[id];
            if (current?.active) current.distance = event.clientX - current.start;
        },
        onPointerup: (event: PointerEvent) => {
            const current = swipes[id];
            if (!current?.active) return;
            current.active = false;
            if (isSwipeDismiss(current.distance, (event.currentTarget as HTMLElement).offsetWidth))
                store.value.dismiss(id);
            else current.distance = 0;
        },
        onPointercancel: () => {
            if (swipes[id]) swipes[id] = { start: 0, distance: 0, active: false };
        },
    };
}
</script>

<template>
    <!-- Place once in the app; show toasts with toast({ title, description, type, action }) -->
    <Toaster v-slot="item" :toaster="store" :label="label ?? translations.toast.label">
        <Toast.Root :class="styles.root()" v-bind="swipeProps(item.id)">
            <LoaderCircle v-if="item.type === 'loading'" :class="styles.spinner()" aria-hidden="true" />
            <component
                :is="icons[item.type as keyof typeof icons]"
                v-else-if="item.type && item.type in icons"
                :class="styles.icon()"
                aria-hidden="true"
            />
            <div :class="styles.text()">
                <Toast.Title :class="styles.title()">{{ item.title }}</Toast.Title>
                <Toast.Description v-if="item.description" :class="styles.description()">
                    {{ item.description }}
                </Toast.Description>
            </div>
            <Toast.ActionTrigger v-if="item.action" :class="styles.action()">{{
                item.action.label
            }}</Toast.ActionTrigger>
            <Toast.CloseTrigger :class="styles.close()" :aria-label="closeLabel ?? translations.common.close">
                <X :class="styles.closeIcon()" aria-hidden="true" />
            </Toast.CloseTrigger>
            <span v-if="showProgress && Number.isFinite(item.duration)" :class="styles.progress()" aria-hidden="true" />
        </Toast.Root>
    </Toaster>
</template>
