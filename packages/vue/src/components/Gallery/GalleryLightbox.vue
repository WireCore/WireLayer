<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Maximize,
    Minimize,
    RotateCw,
    Scan,
    X,
    ZoomIn,
    ZoomOut,
} from '@lucide/vue';
import {
    clampPan,
    dialog as dialogRecipe,
    gallery as galleryRecipe,
    iconButton as iconButtonRecipe,
    pinchZoom,
    stepZoom,
    swipeDirection,
    zoomLimits,
} from '@wirecore/wirelayer-recipes';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import type { GalleryImage } from './types.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

// Lightbox of a Gallery (`tools`): one picture at a time – zoom (buttons, +/−, Ctrl+wheel, two fingers), move the
// zoomed picture (drag, arrow keys), rotate, download, fill the screen; swipe or arrow keys change the picture
const props = defineProps<{ images: GalleryImage[]; label: string; page: number }>();
const emit = defineEmits<{ 'update:page': [page: number] }>();
const gallery = useRecipe('gallery', galleryRecipe);
const dialog = useRecipe('dialog', dialogRecipe);
const iconButton = useRecipe('iconButton', iconButtonRecipe);
const styles = gallery();
const closeStyles = dialog();
const button = iconButton({ variant: 'text', size: 'sm' });
const translations = useTranslations();
const locale = useLocale();
const t = translations.gallery;

const item = computed(() => props.images[props.page]);
const sourcesOf = (entry: GalleryImage): { src: string; type?: string }[] => entry.sources ?? [{ src: entry.src }];
const video = computed(() => item.value?.type === 'video');
const zoom = ref(1);
const rotation = ref(0);
const offset = ref({ x: 0, y: 0 });
const panning = ref(false);
const status = ref('');
watch(
    () => props.page,
    () => reset(false)
);

function go(step: number) {
    const next = props.page + step;
    if (next < 0 || next >= props.images.length) return;
    emit('update:page', next);
}
function setZoom(next: number) {
    zoom.value = next;
    offset.value = clamp(offset.value);
    status.value = t.zoom(Math.round(next * 100));
}
function reset(announce = true) {
    zoom.value = 1;
    rotation.value = 0;
    offset.value = { x: 0, y: 0 };
    if (announce) status.value = t.zoom(100);
}
function rotate() {
    rotation.value = (rotation.value + 90) % 360;
    offset.value = clamp(offset.value);
}

// Moving: the zoomed picture keeps covering the stage
const stage = ref<HTMLElement | null>(null);
const image = ref<HTMLImageElement | null>(null);
function clamp(next: { x: number; y: number }) {
    if (!stage.value || !image.value) return { x: 0, y: 0 };
    const turned = rotation.value % 180 !== 0;
    const width = image.value.clientWidth;
    const height = image.value.clientHeight;
    return clampPan(next, zoom.value, turned ? { width: height, height: width } : { width, height }, {
        width: stage.value.clientWidth,
        height: stage.value.clientHeight,
    });
}
const pointers = new Map<number, { x: number; y: number }>();
let gesture:
    | { kind: 'pan'; x: number; y: number; from: { x: number; y: number } }
    | { kind: 'pinch'; distance: number; zoom: number }
    | { kind: 'swipe'; x: number; y: number }
    | null = null;
const distance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
};
function onPointerDown(event: PointerEvent) {
    if (video.value) return;
    stage.value?.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) gesture = { kind: 'pinch', distance: distance(), zoom: zoom.value };
    else if (zoom.value > 1) {
        gesture = { kind: 'pan', x: event.clientX, y: event.clientY, from: offset.value };
        panning.value = true;
    } else gesture = { kind: 'swipe', x: event.clientX, y: event.clientY };
}
function onPointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesture.kind === 'pinch') {
        zoom.value = pinchZoom(gesture.zoom, gesture.distance, distance());
        offset.value = clamp(offset.value);
    } else if (gesture.kind === 'pan') {
        offset.value = clamp({
            x: gesture.from.x + event.clientX - gesture.x,
            y: gesture.from.y + event.clientY - gesture.y,
        });
    }
}
function onPointerUp(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (gesture?.kind === 'swipe') go(swipeDirection(event.clientX - gesture.x, event.clientY - gesture.y, rtl.value));
    if (gesture?.kind === 'pinch') status.value = t.zoom(Math.round(zoom.value * 100));
    gesture = null;
    panning.value = false;
}
function onWheel(event: WheelEvent) {
    if (!event.ctrlKey || video.value) return;
    event.preventDefault();
    setZoom(stepZoom(zoom.value, event.deltaY < 0 ? 1 : -1));
}

// Fill the screen (Fullscreen API) with the dialog
const content = ref<{ $el: HTMLElement } | null>(null);
const screen = ref(false);
const screenable = ref(false);
const onScreenChange = () => (screen.value = !!document.fullscreenElement);
onMounted(() => {
    screenable.value = !!document.documentElement.requestFullscreen;
    document.addEventListener('fullscreenchange', onScreenChange);
});
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onScreenChange));
function toggleScreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void content.value?.$el.requestFullscreen?.();
}

// Keyboard: arrows change the picture (or move a zoomed one), + − 0 zoom, R rotates, F fills the screen
const rtl = computed(() => locale.value.dir === 'rtl');
function onKeydown(event: KeyboardEvent) {
    // The video player keeps its own keys
    if ((event.target as HTMLElement).closest('video')) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const pan = (x: number, y: number) => (offset.value = clamp({ x: offset.value.x + x, y: offset.value.y + y }));
    const back = rtl.value ? 1 : -1;
    const keys: Record<string, () => void> = {
        ArrowLeft: () => (zoom.value > 1 ? pan(40, 0) : go(back)),
        ArrowRight: () => (zoom.value > 1 ? pan(-40, 0) : go(-back)),
        ArrowUp: () => zoom.value > 1 && pan(0, 40),
        ArrowDown: () => zoom.value > 1 && pan(0, -40),
        '+': () => setZoom(stepZoom(zoom.value, 1)),
        '=': () => setZoom(stepZoom(zoom.value, 1)),
        '-': () => setZoom(stepZoom(zoom.value, -1)),
        '0': () => reset(),
        r: rotate,
        R: rotate,
        f: toggleScreen,
        F: toggleScreen,
    };
    const action = keys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
}
const transform = computed(
    () => `translate(${offset.value.x}px, ${offset.value.y}px) scale(${zoom.value}) rotate(${rotation.value}deg)`
);
</script>

<template>
    <Dialog.Content ref="content" :class="styles.lightbox()" @keydown="onKeydown">
        <div :class="styles.header()">
            <Dialog.Title :class="styles.title()">{{ label }}</Dialog.Title>
            <span :class="styles.counter()">{{ page + 1 }} / {{ images.length }}</span>
            <Dialog.CloseTrigger :class="closeStyles.close()" :aria-label="t.close">
                <X :class="closeStyles.closeIcon()" aria-hidden="true" />
            </Dialog.CloseTrigger>
        </div>
        <div role="group" :aria-label="t.toolbar" :class="styles.toolbar()">
            <IconButton
                :icon="ChevronLeft"
                :label="translations.carousel.prevTrigger"
                variant="text"
                size="sm"
                :disabled="page <= 0"
                @click="go(-1)"
            />
            <IconButton
                :icon="ChevronRight"
                :label="translations.carousel.nextTrigger"
                variant="text"
                size="sm"
                :disabled="page >= images.length - 1"
                @click="go(1)"
            />
            <template v-if="!video">
                <IconButton
                    :icon="ZoomOut"
                    :label="t.zoomOut"
                    variant="text"
                    size="sm"
                    :disabled="zoom <= zoomLimits.min"
                    @click="setZoom(stepZoom(zoom, -1))"
                />
                <span :class="styles.zoomValue()" aria-hidden="true">{{ Math.round(zoom * 100) }} %</span>
                <IconButton
                    :icon="ZoomIn"
                    :label="t.zoomIn"
                    variant="text"
                    size="sm"
                    :disabled="zoom >= zoomLimits.max"
                    @click="setZoom(stepZoom(zoom, 1))"
                />
                <IconButton :icon="Scan" :label="t.resetZoom" variant="text" size="sm" @click="reset()" />
                <IconButton :icon="RotateCw" :label="t.rotate" variant="text" size="sm" @click="rotate" />
            </template>
            <a
                v-if="item"
                :href="item.download ?? item.fullSrc ?? item.src"
                download
                :class="button.base()"
                :aria-label="t.download"
            >
                <Download :class="button.icon()" aria-hidden="true" />
            </a>
            <IconButton
                v-if="screenable"
                :icon="screen ? Minimize : Maximize"
                :label="screen ? t.exitScreen : t.screen"
                variant="text"
                size="sm"
                @click="toggleScreen"
            />
        </div>
        <!-- Pointer gestures only; the buttons and keys do the same -->
        <div
            v-if="item"
            ref="stage"
            :class="styles.zoomStage()"
            :data-zoomed="zoom > 1 || undefined"
            :data-panning="panning || undefined"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @wheel="onWheel"
        >
            <video
                v-if="video"
                controls
                preload="metadata"
                :poster="item.poster ?? item.thumbnail"
                :aria-label="item.alt"
                :class="styles.zoomVideo()"
            >
                <source v-for="source in sourcesOf(item)" :key="source.src" :src="source.src" :type="source.type" />
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
            <img
                v-else
                ref="image"
                :src="item.fullSrc ?? item.src"
                :alt="item.alt"
                draggable="false"
                :class="styles.zoomImage()"
                :data-panning="panning || undefined"
                :style="{ transform }"
            />
        </div>
        <p v-if="item?.caption" :class="styles.caption()">{{ item.caption }}</p>
        <p :class="styles.shortcuts()">{{ t.shortcuts }}</p>
        <p role="status" :class="styles.status()">{{ status }}</p>
    </Dialog.Content>
</template>
