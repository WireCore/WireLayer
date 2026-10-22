<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { Maximize2, X } from '@lucide/vue';
import {
    dialog as dialogRecipe,
    gallery as galleryRecipe,
    iconButton as iconButtonRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, watch, type ImgHTMLAttributes } from 'vue';
import Carousel from '../Carousel/Carousel.vue';
import GalleryLightbox from './GalleryLightbox.vue';
import type { GalleryImage } from './types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface GalleryProps {
    images: GalleryImage[];
    /** Accessible name of the gallery, also the title of the fullscreen view */
    label: string;
    /** Row of thumbnails below the picture (instead of the dots); it follows the shown picture */
    thumbnails?: boolean;
    /** Button that opens the pictures large in a dialog */
    fullscreen?: boolean;
    /**
     * The large view is a lightbox: zoom (buttons, + and −, Ctrl+wheel, two fingers), move the zoomed picture,
     * rotate, download, fill the screen, swipe; keyboard shortcuts are shown in it
     */
    tools?: boolean;
    /** Pictures load when they come near the view (loading="lazy") */
    lazy?: boolean;
    /** More pictures can be loaded: showing one of the last two emits loadMore (they are added at the end) */
    hasMore?: boolean;
    /** The next pictures are loading (aria-busy) */
    loading?: boolean;
    /** Current picture – use with v-model:page */
    page?: number;
    defaultPage?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof galleryRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<GalleryProps>(), {
    thumbnails: true,
    fullscreen: true,
    tools: false,
    lazy: false,
    page: undefined,
    defaultPage: 0,
});
const dialog = useRecipe('dialog', dialogRecipe);
const gallery = useRecipe('gallery', galleryRecipe, () => props.classes);
const iconButton = useRecipe('iconButton', iconButtonRecipe);
const emit = defineEmits<{
    'update:page': [page: number];
    /** Load the next pictures (hasMore) */
    loadMore: [];
}>();
const attrs = useAttrs();
const styles = gallery();
const button = iconButton({ variant: 'outline', size: 'sm' });
const closeStyles = dialog();
const internal = ref(props.defaultPage);
const current = computed(() => props.page ?? internal.value);
const lazyImage = computed<ImgHTMLAttributes>(() => (props.lazy ? { loading: 'lazy', decoding: 'async' } : {}));
const sourcesOf = (item: GalleryImage): { src: string; type?: string }[] => item.sources ?? [{ src: item.src }];

function change(page: number) {
    internal.value = page;
    emit('update:page', page);
}
// The thumbnail of the shown picture scrolls into view
const strip = ref<HTMLElement | null>(null);
watch(current, async () => {
    await nextTick();
    strip.value
        ?.querySelector<HTMLElement>('[aria-current="true"]')
        ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
});
// Near the end: ask for more pictures, once per number of pictures
let asked = -1;
watch(
    () => [current.value, props.images.length, props.hasMore, props.loading] as const,
    ([page, count, hasMore, loading]) => {
        if (!hasMore || loading || page < count - 2 || asked === count) return;
        asked = count;
        emit('loadMore');
    },
    { immediate: true }
);
</script>

<template>
    <!-- Carousel of pictures with thumbnails (aria-current marks the shown one) and an optional fullscreen dialog -->
    <div
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :aria-busy="loading || undefined"
    >
        <Dialog.Root lazy-mount unmount-on-exit>
            <div :class="styles.stage()">
                <Carousel
                    :items="images"
                    :label="label"
                    :page="current"
                    :indicators="!thumbnails"
                    @update:page="change"
                >
                    <template #default="{ item, index }">
                        <figure :class="styles.figure()">
                            <video
                                v-if="item.type === 'video'"
                                :tabindex="index === current ? undefined : -1"
                                controls
                                preload="metadata"
                                :poster="item.poster ?? item.thumbnail"
                                :aria-label="item.alt"
                                :class="styles.video()"
                            >
                                <source
                                    v-for="source in sourcesOf(item)"
                                    :key="source.src"
                                    :src="source.src"
                                    :type="source.type"
                                />
                                <track
                                    v-for="track in item.tracks ?? []"
                                    :key="track.src"
                                    :kind="track.kind ?? 'captions'"
                                    :src="track.src"
                                    :srclang="track.srclang"
                                    :label="track.label"
                                    :default="track.default || undefined"
                                />
                            </video>
                            <img v-else :src="item.src" :alt="item.alt" :class="styles.image()" v-bind="lazyImage" />
                            <figcaption v-if="item.caption" :class="styles.caption()">{{ item.caption }}</figcaption>
                        </figure>
                    </template>
                </Carousel>
                <Dialog.Trigger
                    v-if="fullscreen"
                    :class="button.base({ class: styles.fullscreenTrigger() })"
                    :aria-label="translations.gallery.fullscreen"
                >
                    <Maximize2 :class="button.icon()" aria-hidden="true" />
                </Dialog.Trigger>
            </div>
            <Teleport to="body">
                <Dialog.Backdrop :class="closeStyles.backdrop()" />
                <Dialog.Positioner :class="styles.positioner()">
                    <GalleryLightbox
                        v-if="tools"
                        :images="images"
                        :label="label"
                        :page="current"
                        @update:page="change"
                    />
                    <Dialog.Content v-else :class="styles.content()">
                        <div :class="styles.header()">
                            <Dialog.Title :class="styles.title()">{{ label }}</Dialog.Title>
                            <Dialog.CloseTrigger :class="closeStyles.close()" :aria-label="translations.gallery.close">
                                <X :class="closeStyles.closeIcon()" aria-hidden="true" />
                            </Dialog.CloseTrigger>
                        </div>
                        <Carousel :items="images" :label="label" :page="current" @update:page="change">
                            <template #default="{ item, index }">
                                <figure :class="styles.figure()">
                                    <video
                                        v-if="item.type === 'video'"
                                        :tabindex="index === current ? undefined : -1"
                                        controls
                                        preload="metadata"
                                        :poster="item.poster ?? item.thumbnail"
                                        :aria-label="item.alt"
                                        :class="styles.video()"
                                    >
                                        <source
                                            v-for="source in sourcesOf(item)"
                                            :key="source.src"
                                            :src="source.src"
                                            :type="source.type"
                                        />
                                        <track
                                            v-for="track in item.tracks ?? []"
                                            :key="track.src"
                                            :kind="track.kind ?? 'captions'"
                                            :src="track.src"
                                            :srclang="track.srclang"
                                            :label="track.label"
                                            :default="track.default || undefined"
                                        />
                                    </video>
                                    <img v-else :src="item.src" :alt="item.alt" :class="styles.fullscreenImage()" />
                                    <figcaption v-if="item.caption" :class="styles.caption()">
                                        {{ item.caption }}
                                    </figcaption>
                                </figure>
                            </template>
                        </Carousel>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Teleport>
        </Dialog.Root>
        <div
            v-if="thumbnails"
            ref="strip"
            role="group"
            :aria-label="translations.gallery.thumbnails"
            :class="styles.thumbnails()"
        >
            <button
                v-for="(image, index) in images"
                :key="index"
                type="button"
                :class="styles.thumbnail()"
                :aria-label="translations.gallery.thumbnail(index, images.length)"
                :aria-current="index === current ? 'true' : undefined"
                @click="change(index)"
            >
                <img
                    :src="image.thumbnail ?? image.poster ?? image.src"
                    alt=""
                    :class="styles.thumbnailImage()"
                    v-bind="lazyImage"
                />
            </button>
        </div>
    </div>
</template>
