<script setup lang="ts">
import { Marquee } from '@ark-ui/vue/marquee';
import { Pause, Play } from '@lucide/vue';
import { marquee as marqueeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface MarqueeProps {
    /** Accessible name of the region, e.g. "Partners" (default "Ticker") */
    label?: string;
    /** Direction the content moves to: start (default), end, top or bottom */
    side?: 'start' | 'end' | 'top' | 'bottom';
    /** Speed in px per second (default 50) */
    speed?: number;
    /** Space between the items, a CSS length (default "1rem") */
    spacing?: string;
    /** Repeats the content until the band is full (default true) */
    autoFill?: boolean;
    reverse?: boolean;
    /** Paused – use with v-model:paused (the pause button and hover/focus pause, too) */
    paused?: boolean;
    /** Stops while the pointer is over the band or the focus is in it (default true) */
    pauseOnHover?: boolean;
    /** Button to pause and resume (WCAG 2.2.2, default true) */
    pauseButton?: boolean;
    /** Fades the content out at the edges */
    fade?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof marqueeRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MarqueeProps>(), {
    side: 'start',
    speed: 50,
    spacing: '1rem',
    autoFill: true,
    paused: undefined,
    pauseOnHover: true,
    pauseButton: true,
});
const emit = defineEmits<{ 'update:paused': [paused: boolean] }>();
defineSlots<{
    /** The items; they are repeated (copies hidden from screen readers) – no links or buttons in them */
    default?(): unknown;
}>();
const marquee = useRecipe('marquee', marqueeRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().marquee;
const styles = marquee();
const internal = ref(false);
const userPaused = computed(() => props.paused ?? internal.value);
const hovered = ref(false);
const focused = ref(false);
const stopped = computed(() => userPaused.value || (props.pauseOnHover && (hovered.value || focused.value)));
const horizontal = computed(() => props.side === 'start' || props.side === 'end');

function toggle() {
    internal.value = !userPaused.value;
    emit('update:paused', !userPaused.value);
}
function onFocusOut(event: FocusEvent) {
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) focused.value = false;
}
</script>

<template>
    <!--
        Moving band (region, named by the label): moves only without reduced motion; the pause button comes first,
        hover and focus stop it, too.
    -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
        @focusin="focused = true"
        @focusout="onFocusOut"
    >
        <IconButton
            v-if="pauseButton"
            :icon="userPaused ? Play : Pause"
            :label="userPaused ? t.play : t.pause"
            variant="text"
            size="sm"
            @click="toggle"
        />
        <Marquee.Root
            :class="styles.root()"
            :paused="stopped"
            :side="side"
            :speed="speed"
            :spacing="spacing"
            :auto-fill="autoFill"
            :reverse="reverse"
            :translations="{ root: label ?? t.label }"
        >
            <Marquee.Edge v-if="fade && horizontal" side="start" :class="styles.edge()" />
            <Marquee.Viewport :class="styles.viewport()">
                <Marquee.Content :class="styles.content()"><slot /></Marquee.Content>
            </Marquee.Viewport>
            <Marquee.Edge v-if="fade && horizontal" side="end" :class="styles.edge()" />
        </Marquee.Root>
    </div>
</template>
