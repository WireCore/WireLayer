<script setup lang="ts" generic="T">
import { Carousel } from '@ark-ui/vue/carousel';
import { ChevronLeft, ChevronRight, Pause, Play } from '@lucide/vue';
import {
    carousel as carouselRecipe,
    carouselBreakpoint,
    iconButton as iconButtonRecipe,
    type CarouselBreakpoint,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, ref, useAttrs } from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface CarouselProps<T> {
    items: readonly T[];
    /** Accessible name of the carousel region, e.g. "References" */
    label: string;
    /** Slides in view at once – fractions show a part of the next one (e.g. 1.5) */
    slidesPerPage?: number;
    /** Slides one step moves (default: a page) */
    slidesToScroll?: number | 'auto';
    /** Slides side by side (default) or on top of each other (give a `height`) */
    orientation?: 'horizontal' | 'vertical';
    /** Height of the slides area (CSS length) – needed when vertical */
    height?: string;
    /** Settings from a width of the carousel on (a container query), e.g. [{ minWidth: 640, slidesPerPage: 2 }] */
    breakpoints?: readonly CarouselBreakpoint[];
    /** The slides can be dragged with the mouse, too (touch swipes anyway) */
    allowMouseDrag?: boolean;
    /** Gap between slides (CSS length) */
    spacing?: string;
    loop?: boolean;
    /** Turns pages by itself (default every 4 s) – always with a pause button (WCAG 2.2.2) */
    autoplay?: boolean | { delay: number };
    /** Dots below the slides, one per page */
    indicators?: boolean;
    /** Current page – use with v-model:page */
    page?: number;
    defaultPage?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof carouselRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<CarouselProps<T>>(), {
    slidesPerPage: 1,
    slidesToScroll: undefined,
    orientation: 'horizontal',
    height: undefined,
    breakpoints: undefined,
    allowMouseDrag: false,
    spacing: '16px',
    loop: false,
    autoplay: false,
    indicators: true,
    page: undefined,
    defaultPage: 0,
});
const carousel = useRecipe('carousel', carouselRecipe, () => props.classes);
const iconButton = useRecipe('iconButton', iconButtonRecipe);
const emit = defineEmits<{ 'update:page': [page: number] }>();
defineSlots<{ default(props: { item: T; index: number }): unknown }>();
const attrs = useAttrs();
const styles = computed(() => carousel({ vertical: props.orientation === 'vertical' }));
// Breakpoints follow the width of the carousel itself (measured in the browser; the base settings before that)
const root = ref<{ $el: HTMLElement } | null>(null);
const width = ref(0);
let observer: ResizeObserver | undefined;
onMounted(() => {
    if (!props.breakpoints?.length || typeof ResizeObserver === 'undefined' || !root.value) return;
    observer = new ResizeObserver(([entry]) => (width.value = entry?.contentRect.width ?? 0));
    observer.observe(root.value.$el);
});
onBeforeUnmount(() => observer?.disconnect());
const settings = computed(() =>
    carouselBreakpoint(
        width.value,
        { slidesPerPage: props.slidesPerPage, slidesPerMove: props.slidesToScroll, spacing: props.spacing },
        props.breakpoints
    )
);
const button = iconButton({ variant: 'outline', size: 'sm' });
const internal = ref(props.defaultPage);
const current = computed(() => props.page ?? internal.value);

function change(page: number) {
    internal.value = page;
    emit('update:page', page);
}
</script>

<template>
    <!--
        Region "carousel" with slides labelled "Image n of m". Previous/next buttons, one dot per page (arrow keys
        move between pages there); autoplay only with a pause button.
    -->
    <Carousel.Root
        ref="root"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :aria-label="label"
        :slide-count="items.length"
        :slides-per-page="settings.slidesPerPage"
        :slides-per-move="settings.slidesPerMove"
        :orientation="orientation"
        :allow-mouse-drag="allowMouseDrag"
        :spacing="settings.spacing"
        :loop="loop"
        :autoplay="autoplay"
        :page="current"
        :translations="translations.carousel"
        @page-change="change($event.page)"
    >
        <Carousel.ItemGroup :class="styles.itemGroup()" tabindex="0" :style="height ? { height } : undefined">
            <Carousel.Item v-for="(item, index) in items" :key="index" :index="index" :class="styles.item()">
                <slot :item="item" :index="index" />
            </Carousel.Item>
        </Carousel.ItemGroup>
        <Carousel.Control :class="styles.control()">
            <Carousel.AutoplayTrigger v-if="autoplay" :class="button.base()">
                <Carousel.AutoplayIndicator>
                    <Pause :class="button.icon()" aria-hidden="true" />
                    <template #fallback><Play :class="button.icon()" aria-hidden="true" /></template>
                </Carousel.AutoplayIndicator>
            </Carousel.AutoplayTrigger>
            <Carousel.PrevTrigger :class="button.base()">
                <ChevronLeft :class="button.icon()" aria-hidden="true" />
            </Carousel.PrevTrigger>
            <Carousel.Context v-slot="api">
                <Carousel.IndicatorGroup :class="styles.indicatorGroup()">
                    <Carousel.Indicator
                        v-for="(_, index) in indicators ? api.pageSnapPoints : []"
                        :key="index"
                        :index="index"
                        :class="styles.indicator()"
                        :aria-current="index === api.page ? 'true' : undefined"
                    />
                </Carousel.IndicatorGroup>
            </Carousel.Context>
            <Carousel.NextTrigger :class="button.base()">
                <ChevronRight :class="button.icon()" aria-hidden="true" />
            </Carousel.NextTrigger>
        </Carousel.Control>
    </Carousel.Root>
</template>
