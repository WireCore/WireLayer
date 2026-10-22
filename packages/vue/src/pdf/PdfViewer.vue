<script setup lang="ts">
import {
    CaseSensitive,
    ChevronDown,
    ChevronUp,
    Download,
    FileWarning,
    Maximize,
    Minimize,
    PanelLeft,
    Printer,
    RotateCw,
    Search,
    X,
    ZoomIn,
    ZoomOut,
} from '@lucide/vue';
import {
    clampPdfPage,
    input,
    normalizePdfRotation,
    parsePdfPage,
    PDF_ZOOM_MAX,
    PDF_ZOOM_MIN,
    pdfFileName,
    pdfKeyAction,
    pdfSearchText,
    pdfThumbnailSize,
    pdfViewer as pdfViewerRecipe,
    pdfZoomFromKey,
    pdfZoomKey,
    pdfZoomSteps,
    resolvePdfTools,
    setupToolbar,
    type PdfTool,
    type PdfZoom,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import {
    computed,
    nextTick,
    normalizeClass,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    useAttrs,
    useId,
    useTemplateRef,
    watch,
} from 'vue';
import Button from '../components/Button/Button.vue';
import Dialog from '../components/Dialog/Dialog.vue';
import DialogContent from '../components/Dialog/DialogContent.vue';
import Field from '../components/Field/Field.vue';
import PasswordInput from '../components/PasswordInput/PasswordInput.vue';
import Select from '../components/Select/Select.vue';
import Spinner from '../components/Spinner/Spinner.vue';
import Tabs from '../components/Tabs/Tabs.vue';
import TabsContent from '../components/Tabs/TabsContent.vue';
import TabsList from '../components/Tabs/TabsList.vue';
import TabsTrigger from '../components/Tabs/TabsTrigger.vue';
import Tree from '../components/Tree/Tree.vue';
import type { TreeNode } from '../components/Tree/types.js';
import { useLocale, useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';
import { initialPdfState, PdfController, type PdfOutlineItem, type PdfSource, type PdfState } from './engine.js';

export interface PdfViewerProps {
    /** The PDF: URL, ArrayBuffer/Uint8Array or Blob/File – loaded in the browser (the server renders the loading state) */
    src: PdfSource;
    /** Current page (1-based) – use with v-model:page */
    page?: number;
    /** Zoom: factor (1 = 100 %, 0.5–4), "page-width" (default) or "page-fit" – use with v-model:zoom */
    zoom?: PdfZoom;
    /** Rotation of all pages clockwise: 0, 90, 180 or 270 – use with v-model:rotation */
    rotation?: number;
    /** Side bar with thumbnails and the outline – use with v-model:sidebar */
    sidebar?: boolean;
    /** Toolbar: all tools (true, default), none (false) or a list, e.g. ['page', 'zoom', 'download'] */
    toolbar?: boolean | PdfTool[];
    /** Height of the viewer (CSS length, default "600px") */
    height?: string;
    /** Accessible name of the viewer (default "PDF document") */
    label?: string;
    /** File name for the download (default: the File's name, the end of the URL or "dokument.pdf") */
    fileName?: string;
    /** URL of pdf.js's worker, e.g. `import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'` (Vite) */
    workerSrc?: string;
    /** Folder of pdf.js's character maps (`pdfjs-dist/cmaps/`, with trailing slash) – for CJK text without fonts */
    cMapUrl?: string;
    /** Folder of pdf.js's standard fonts (`pdfjs-dist/standard_fonts/`, with trailing slash) – for fonts not embedded */
    standardFontDataUrl?: string;
    /** Selectable, searchable text over the pages – also what screen readers read (default true; switching redraws the pages) */
    textLayer?: boolean;
    /** Links and other annotations over the pages (default true; switching redraws the pages) */
    annotationLayer?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof pdfViewerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PdfViewerProps>(), {
    page: 1,
    zoom: 'page-width',
    rotation: 0,
    sidebar: undefined,
    toolbar: true,
    height: '600px',
    textLayer: true,
    annotationLayer: true,
});
const emit = defineEmits<{
    'update:page': [page: number];
    'update:zoom': [zoom: PdfZoom];
    'update:rotation': [rotation: number];
    'update:sidebar': [open: boolean];
    /** The document is shown */
    loaded: [details: { numPages: number }];
    /** The document could not be loaded (invalid, not found, password refused …) */
    error: [error: unknown];
}>();
const pdfViewer = useRecipe('pdfViewer', pdfViewerRecipe, () => props.classes);
const styles = computed(() => pdfViewer());
const field = input({ size: 'sm' });
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.pdfViewer;
const common = translations.common;
const locale = useLocale();
const id = useId();
const tools = computed(() => new Set(resolvePdfTools(props.toolbar)));

const state = reactive<PdfState>(initialPdfState(props.zoom, props.rotation, props.page));
const ready = computed(() => state.status === 'ready');
const root = useTemplateRef<HTMLElement>('root');
const container = useTemplateRef<HTMLDivElement>('container');
const pages = useTemplateRef<HTMLDivElement>('pages');
const toolbarElement = useTemplateRef<HTMLElement>('toolbarElement');
let controller: PdfController | undefined;

// Page field: the typed text until Enter or leaving the field
const pageText = ref(String(props.page));
const editingPage = ref(false);
watch(
    () => state.page,
    (page) => {
        if (!editingPage.value) pageText.value = String(page);
    }
);
function commitPage() {
    if (!editingPage.value) return;
    editingPage.value = false;
    const page = parsePdfPage(pageText.value, state.numPages);
    if (page) goTo(page);
    pageText.value = String(page ?? state.page);
}
function onPageKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault();
        commitPage();
    } else if (event.key === 'Escape') {
        editingPage.value = false;
        pageText.value = String(state.page);
    }
}

// Announcements of navigation by keyboard or buttons (not while scrolling)
const announcement = ref('');
function goTo(page: number) {
    if (!ready.value) return;
    const target = clampPdfPage(page, state.numPages);
    controller?.setPage(target);
    announcement.value = t.pageStatus(target, state.numPages);
}

// Zoom list: presets, the fixed steps and – when set from outside – the current factor
const percent = (value: number) =>
    new Intl.NumberFormat(locale.value.locale, { style: 'percent', maximumFractionDigits: 0 }).format(value);
const zoomKey = computed(() => pdfZoomKey(state.zoom));
const zoomItems = computed(() => {
    const steps =
        typeof state.zoom === 'number' && !pdfZoomSteps.includes(state.zoom)
            ? [...pdfZoomSteps, state.zoom].sort((a, b) => a - b)
            : pdfZoomSteps;
    return [
        { value: 'page-width', label: t.pageWidth },
        { value: 'page-fit', label: t.pageFit },
        ...steps.map((step) => ({ value: pdfZoomKey(step), label: percent(step) })),
    ];
});

// Search bar below the toolbar
const searchOpen = ref(false);
const query = ref('');
const caseSensitive = ref(false);
const searchField = useTemplateRef<HTMLInputElement>('searchField');
const searchButton = useTemplateRef<HTMLButtonElement>('searchButton');
const searchText = computed(() => pdfSearchText(state.search, query.value, t));
async function openSearch() {
    searchOpen.value = true;
    await nextTick();
    searchField.value?.focus();
    searchField.value?.select();
}
function closeSearch() {
    searchOpen.value = false;
    controller?.closeFind();
    void nextTick(() => searchButton.value?.focus());
}
function toggleSearch() {
    if (searchOpen.value) closeSearch();
    else void openSearch();
}
const runSearch = () => controller?.find(query.value, { caseSensitive: caseSensitive.value });
const findAgain = (previous: boolean) =>
    controller?.find(query.value, { caseSensitive: caseSensitive.value, previous, again: true });
function onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
        event.preventDefault();
        findAgain(event.shiftKey);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
    }
}
function toggleCase() {
    caseSensitive.value = !caseSensitive.value;
    runSearch();
}

// Side bar: thumbnails (drawn when they scroll into view) and the outline
const internalSidebar = ref(false);
const sidebarOpen = computed(() => props.sidebar ?? internalSidebar.value);
function toggleSidebar() {
    internalSidebar.value = !sidebarOpen.value;
    emit('update:sidebar', internalSidebar.value);
}
const sidebarTab = ref('thumbnails');
const THUMBNAIL_WIDTH = 120;
const thumbnailSize = computed(() =>
    pdfThumbnailSize(state.pageSize ?? { width: 595, height: 842 }, state.rotation, THUMBNAIL_WIDTH)
);
const pageNumbers = computed(() => Array.from({ length: state.numPages }, (_, index) => index + 1));
const canvases = new Map<number, HTMLCanvasElement>();
const drawn = new Set<number>();
let thumbnailObserver: IntersectionObserver | undefined;
function registerThumbnail(page: number, element: unknown) {
    const canvas = element as HTMLCanvasElement | null;
    const previous = canvases.get(page);
    if (previous && previous !== canvas) thumbnailObserver?.unobserve(previous);
    if (!canvas) {
        canvases.delete(page);
        return;
    }
    if (previous === canvas) return;
    canvases.set(page, canvas);
    drawn.delete(page);
    thumbnailObserver?.observe(canvas);
}
function observeThumbnails() {
    thumbnailObserver?.disconnect();
    thumbnailObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const page = Number((entry.target as HTMLElement).dataset.page);
                if (drawn.has(page)) continue;
                drawn.add(page);
                void controller?.renderThumbnail(page, entry.target as HTMLCanvasElement, THUMBNAIL_WIDTH);
            }
        },
        { rootMargin: '200px' }
    );
    for (const canvas of canvases.values()) thumbnailObserver.observe(canvas);
}
watch(
    () => state.rotation,
    () => {
        drawn.clear();
        observeThumbnails();
    }
);
const outlineIndex = computed(() => {
    const index = new Map<string, PdfOutlineItem>();
    const walk = (items: PdfOutlineItem[]) =>
        items.forEach((item) => {
            index.set(item.id, item);
            walk(item.children);
        });
    walk(state.outline);
    return index;
});
const outlineNodes = computed(() => {
    const toNodes = (items: PdfOutlineItem[]): TreeNode[] =>
        items.map((item) => ({
            id: item.id,
            label: item.label,
            ...(item.children.length ? { children: toNodes(item.children) } : {}),
        }));
    return toNodes(state.outline);
});
const outlineBranches = computed(() =>
    [...outlineIndex.value.values()].filter((item) => item.children.length).map((item) => item.id)
);
// Choosing an entry jumps there; the tree keeps no selection, so the same entry can be chosen again
function openOutline(ids: string[]) {
    const item = ids[0] ? outlineIndex.value.get(ids[0]) : undefined;
    if (item) controller?.openOutline(item);
}

// Full screen
const fullscreen = ref(false);
function toggleFullscreen() {
    if (document.fullscreenElement === root.value) void document.exitFullscreen();
    else void root.value?.requestFullscreen();
}
const onFullscreenChange = () => (fullscreen.value = !!root.value && document.fullscreenElement === root.value);

// Password prompt
const password = ref('');
function submitPassword() {
    controller?.submitPassword(password.value);
    password.value = '';
}
function onPasswordOpenChange(open: boolean) {
    if (!open && state.status === 'password') controller?.cancelPassword();
}

const errorText = computed(() =>
    state.error === 'invalid'
        ? t.invalid
        : state.error === 'missing'
          ? t.missing
          : state.error === 'password'
            ? t.passwordRequired
            : t.error
);

function onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || !root.value?.contains(event.target as Node)) return;
    const action = pdfKeyAction(event, !!container.value?.contains(event.target as Node));
    if (!action) return;
    if (action === 'find') {
        if (!tools.value.has('search') || !ready.value) return;
        event.preventDefault();
        void openSearch();
        return;
    }
    if (!ready.value) return;
    event.preventDefault();
    if (action === 'next') goTo(state.page + 1);
    else if (action === 'previous') goTo(state.page - 1);
    else if (action === 'first') goTo(1);
    else if (action === 'last') goTo(state.numPages);
    else if (action === 'zoomIn') controller?.zoomBy(1);
    else if (action === 'zoomOut') controller?.zoomBy(-1);
    else controller?.setZoom(1);
}

function open() {
    void controller?.open(
        props.src,
        { workerSrc: props.workerSrc, cMapUrl: props.cMapUrl, standardFontDataUrl: props.standardFontDataUrl },
        { page: props.page, zoom: props.zoom, rotation: props.rotation }
    );
}

let cleanupToolbar: (() => void) | undefined;
function connectToolbar() {
    cleanupToolbar?.();
    cleanupToolbar = toolbarElement.value
        ? setupToolbar(toolbarElement.value, 'horizontal', { textInputs: true })
        : undefined;
}
onMounted(() => {
    controller = new PdfController({
        container: container.value!,
        viewer: pages.value!,
        textLayer: props.textLayer,
        annotationLayer: props.annotationLayer,
        pageLabel: (page) => t.pageLabel(page),
        onChange: (patch) => Object.assign(state, patch),
        onError: (error) => emit('error', error),
    });
    connectToolbar();
    observeThumbnails();
    document.addEventListener('fullscreenchange', onFullscreenChange);
    open();
});
onBeforeUnmount(() => {
    controller?.destroy();
    cleanupToolbar?.();
    thumbnailObserver?.disconnect();
    document.removeEventListener('fullscreenchange', onFullscreenChange);
});
watch(
    () => [props.src, props.workerSrc, props.cMapUrl, props.standardFontDataUrl],
    () => {
        drawn.clear();
        open();
    }
);
watch(
    () => tools.value.size > 0,
    () => void nextTick(connectToolbar)
);
watch(
    () => locale.value,
    () => controller?.relabel()
);
watch(
    () => [props.textLayer, props.annotationLayer] as const,
    ([textLayer, annotationLayer]) => void controller?.setLayers({ textLayer, annotationLayer })
);

// Outside → viewer (controlled props) and viewer → outside (events)
watch(
    () => props.page,
    (page) => page !== state.page && controller?.setPage(page)
);
watch(
    () => props.zoom,
    (zoom) => zoom !== state.zoom && controller?.setZoom(zoom)
);
watch(
    () => props.rotation,
    (rotation) => normalizePdfRotation(rotation) !== state.rotation && controller?.setRotation(rotation)
);
watch(
    () => state.status,
    (status) => {
        if (status !== 'ready') return;
        announcement.value = t.loaded(state.numPages);
        emit('loaded', { numPages: state.numPages });
    }
);
watch(
    () => state.page,
    (page) => ready.value && page !== props.page && emit('update:page', page)
);
watch(
    () => state.zoom,
    (zoom) => ready.value && zoom !== props.zoom && emit('update:zoom', zoom)
);
watch(
    () => state.rotation,
    (rotation) => ready.value && rotation !== normalizePdfRotation(props.rotation) && emit('update:rotation', rotation)
);

defineExpose({
    /** Shows a page (1-based) */
    goToPage: (page: number) => goTo(page),
    /** Searches the document; the search bar shows the matches */
    search: async (text: string, options: { caseSensitive?: boolean } = {}) => {
        query.value = text;
        caseSensitive.value = !!options.caseSensitive;
        if (tools.value.has('search')) await openSearch();
        runSearch();
    },
    /** Opens the print dialog (pages rendered at 150 dpi) */
    print: () => controller?.print(),
    /** Saves the original file */
    download: () => controller?.download(pdfFileName(props.src, props.fileName, t.fileName)),
});
</script>

<template>
    <!--
        PDF viewer (pdf.js): a toolbar (role="toolbar", one tab stop, arrow keys inside), an optional side bar with
        thumbnails and the outline, and the pages – canvas with a text layer (selection, search, screen readers),
        links and the structure of tagged PDFs. In the page area Page Up/Down and Home/End change the page;
        Ctrl/⌘ + − 0 zoom and Ctrl/⌘+F opens the search while the focus is in the viewer.
    -->
    <div
        v-bind="{
            ...attrs,
            class: styles.base({ class: normalizeClass(attrs.class) }),
            style: [{ height: fullscreen ? '100%' : height }, attrs.style as never],
        }"
        ref="root"
        role="region"
        :aria-label="label ?? t.label"
        :data-fullscreen="fullscreen || undefined"
        :aria-busy="state.status === 'loading' || undefined"
        @keydown="onKeydown"
    >
        <div v-if="tools.size" ref="toolbarElement" role="toolbar" :aria-label="t.toolbar" :class="styles.toolbar()">
            <template v-if="tools.has('sidebar')">
                <button
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.sidebar"
                    :title="t.sidebar"
                    :aria-expanded="sidebarOpen"
                    :aria-controls="sidebarOpen ? `${id}sidebar` : undefined"
                    @click="toggleSidebar"
                >
                    <PanelLeft :class="styles.toolIcon()" aria-hidden="true" />
                </button>
                <span :class="styles.separator()" aria-hidden="true" />
            </template>
            <template v-if="tools.has('page')">
                <button
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.previousPage"
                    :title="t.previousPage"
                    :disabled="!ready"
                    :aria-disabled="ready && state.page <= 1 ? true : undefined"
                    @click="goTo(state.page - 1)"
                >
                    <ChevronUp :class="styles.toolIcon()" aria-hidden="true" />
                </button>
                <span :class="styles.pageField()">
                    <input
                        v-model="pageText"
                        type="text"
                        inputmode="numeric"
                        autocomplete="off"
                        :class="styles.pageInput()"
                        :aria-label="t.page"
                        :aria-describedby="`${id}pages`"
                        :disabled="!ready"
                        @input="editingPage = true"
                        @keydown="onPageKeydown"
                        @blur="commitPage"
                    />
                    <span :id="`${id}pages`">{{ t.ofPages(state.numPages) }}</span>
                </span>
                <button
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.nextPage"
                    :title="t.nextPage"
                    :disabled="!ready"
                    :aria-disabled="ready && state.page >= state.numPages ? true : undefined"
                    @click="goTo(state.page + 1)"
                >
                    <ChevronDown :class="styles.toolIcon()" aria-hidden="true" />
                </button>
                <span :class="styles.separator()" aria-hidden="true" />
            </template>
            <template v-if="tools.has('zoom')">
                <button
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.zoomOut"
                    :title="t.zoomOut"
                    :disabled="!ready"
                    :aria-disabled="ready && state.scale <= PDF_ZOOM_MIN ? true : undefined"
                    @click="controller?.zoomBy(-1)"
                >
                    <ZoomOut :class="styles.toolIcon()" aria-hidden="true" />
                </button>
                <Select
                    :class="styles.zoomSelect()"
                    size="sm"
                    standalone
                    :aria-label="t.zoom"
                    :items="zoomItems"
                    :model-value="zoomKey"
                    :disabled="!ready"
                    @update:model-value="$event && controller?.setZoom(pdfZoomFromKey($event))"
                />
                <button
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.zoomIn"
                    :title="t.zoomIn"
                    :disabled="!ready"
                    :aria-disabled="ready && state.scale >= PDF_ZOOM_MAX ? true : undefined"
                    @click="controller?.zoomBy(1)"
                >
                    <ZoomIn :class="styles.toolIcon()" aria-hidden="true" />
                </button>
            </template>
            <button
                v-if="tools.has('rotate')"
                type="button"
                :class="styles.tool()"
                :aria-label="t.rotate"
                :title="t.rotate"
                :disabled="!ready"
                @click="controller?.setRotation(state.rotation + 90)"
            >
                <RotateCw :class="styles.toolIcon()" aria-hidden="true" />
            </button>
            <div :class="styles.toolbarEnd()">
                <button
                    v-if="tools.has('search')"
                    ref="searchButton"
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.search"
                    :title="t.search"
                    aria-keyshortcuts="Control+F"
                    :aria-expanded="searchOpen"
                    :aria-controls="searchOpen ? `${id}search` : undefined"
                    :disabled="!ready"
                    @click="toggleSearch"
                >
                    <Search :class="styles.toolIcon()" aria-hidden="true" />
                </button>
                <button
                    v-if="tools.has('download')"
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.download"
                    :title="t.download"
                    :disabled="!ready"
                    @click="controller?.download(pdfFileName(src, fileName, t.fileName))"
                >
                    <Download :class="styles.toolIcon()" aria-hidden="true" />
                </button>
                <button
                    v-if="tools.has('print')"
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.print"
                    :title="t.print"
                    :disabled="!ready"
                    :aria-disabled="state.printing ? true : undefined"
                    @click="!state.printing && controller?.print()"
                >
                    <Printer :class="styles.toolIcon()" aria-hidden="true" />
                </button>
                <button
                    v-if="tools.has('fullscreen')"
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t.fullscreen"
                    :title="t.fullscreen"
                    :aria-pressed="fullscreen"
                    @click="toggleFullscreen"
                >
                    <component :is="fullscreen ? Minimize : Maximize" :class="styles.toolIcon()" aria-hidden="true" />
                </button>
            </div>
        </div>
        <div v-if="searchOpen" :id="`${id}search`" role="search" :class="styles.searchBar()" @keydown="onSearchKeydown">
            <div :class="field.base({ class: styles.searchField() })">
                <input
                    ref="searchField"
                    v-model="query"
                    type="search"
                    autocomplete="off"
                    :aria-label="t.searchField"
                    :class="field.control()"
                    @input="runSearch"
                />
            </div>
            <button
                type="button"
                :class="styles.tool()"
                :aria-label="t.matchCase"
                :title="t.matchCase"
                :aria-pressed="caseSensitive"
                @click="toggleCase"
            >
                <CaseSensitive :class="styles.toolIcon()" aria-hidden="true" />
            </button>
            <button
                type="button"
                :class="styles.tool()"
                :aria-label="t.previousMatch"
                :title="t.previousMatch"
                :disabled="!state.search.total"
                @click="findAgain(true)"
            >
                <ChevronUp :class="styles.toolIcon()" aria-hidden="true" />
            </button>
            <button
                type="button"
                :class="styles.tool()"
                :aria-label="t.nextMatch"
                :title="t.nextMatch"
                :disabled="!state.search.total"
                @click="findAgain(false)"
            >
                <ChevronDown :class="styles.toolIcon()" aria-hidden="true" />
            </button>
            <span role="status" :class="styles.searchStatus()">{{ searchText }}</span>
            <button
                type="button"
                :class="styles.tool()"
                :aria-label="t.closeSearch"
                :title="t.closeSearch"
                @click="closeSearch"
            >
                <X :class="styles.toolIcon()" aria-hidden="true" />
            </button>
        </div>
        <div :class="styles.body()">
            <div v-if="sidebarOpen" :id="`${id}sidebar`" :class="styles.sidebar()">
                <Tabs v-model="sidebarTab" :label="t.sidebar" :class="styles.sidebarTabs()">
                    <TabsList>
                        <TabsTrigger value="thumbnails">{{ t.thumbnails }}</TabsTrigger>
                        <TabsTrigger value="outline">{{ t.outline }}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="thumbnails" :class="styles.sidebarPanel()">
                        <div :class="styles.thumbnails()">
                            <button
                                v-for="number in pageNumbers"
                                :key="number"
                                type="button"
                                :class="styles.thumbnail()"
                                :aria-label="t.pageLabel(number)"
                                :aria-current="number === state.page ? 'page' : undefined"
                                @click="goTo(number)"
                            >
                                <canvas
                                    :ref="(element) => registerThumbnail(number, element)"
                                    :data-page="number"
                                    :class="styles.thumbnailCanvas()"
                                    :style="{ width: `${thumbnailSize.width}px`, height: `${thumbnailSize.height}px` }"
                                    aria-hidden="true"
                                />
                                <span aria-hidden="true">{{ number }}</span>
                            </button>
                        </div>
                    </TabsContent>
                    <TabsContent value="outline" :class="styles.sidebarPanel()">
                        <Tree
                            v-if="outlineNodes.length"
                            :class="styles.outline()"
                            :items="outlineNodes"
                            :label="t.outline"
                            selection-mode="single"
                            :selected-value="[]"
                            :default-expanded-value="outlineBranches"
                            @update:selected-value="openOutline"
                        />
                        <p v-else :class="styles.empty()">{{ t.noOutline }}</p>
                    </TabsContent>
                </Tabs>
            </div>
            <div :class="styles.viewport()">
                <!-- pdf.js renders into "pdfViewer" (its own class, styled by pdfjs-dist/legacy/web/pdf_viewer.css) -->
                <div ref="container" :class="styles.container()" tabindex="0" role="document" :aria-label="t.pages">
                    <div ref="pages" class="pdfViewer" />
                </div>
                <div v-if="state.status === 'loading'" :class="styles.status()">
                    <Spinner
                        size="lg"
                        :label="t.loading"
                        v-bind="state.progress !== null ? { value: Math.round(state.progress * 100) } : {}"
                    />
                    <span aria-hidden="true">{{ t.loading }}</span>
                </div>
                <div v-else-if="state.status === 'error'" :class="styles.status()">
                    <FileWarning :class="styles.errorIcon()" aria-hidden="true" />
                    <p role="alert" :class="styles.error()">{{ errorText }}</p>
                </div>
            </div>
        </div>
        <div role="status" :class="styles.srOnly()">{{ announcement }}</div>
        <Dialog :open="state.status === 'password'" @update:open="onPasswordOpenChange">
            <DialogContent
                :title="t.passwordTitle"
                :description="t.passwordDescription"
                size="sm"
                :portal-target="fullscreen ? root : undefined"
            >
                <form :id="`${id}password`" @submit.prevent="submitPassword">
                    <Field :label="t.passwordLabel" :error="state.passwordWrong ? t.passwordWrong : undefined">
                        <PasswordInput v-model="password" required />
                    </Field>
                </form>
                <template #footer>
                    <Button variant="outline" size="sm" @click="onPasswordOpenChange(false)">{{
                        common.cancel
                    }}</Button>
                    <Button size="sm" type="submit" :form="`${id}password`">{{ t.passwordSubmit }}</Button>
                </template>
            </DialogContent>
        </Dialog>
    </div>
</template>
