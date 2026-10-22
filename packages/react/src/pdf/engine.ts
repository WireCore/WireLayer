// The PdfViewer's engine on pdf.js – the same file in @wirecore/wirelayer-vue and @wirecore/wirelayer-react (a parity test compares them).
// pdfjs-dist (optional peer dependency, Apache-2.0) is imported on first use in the browser only, as the legacy build
// (polyfilled for older Safari and Firefox versions). Its PDFViewer renders the visible pages (plus a buffer) with
// canvas, text layer, annotation layer and – for tagged PDFs – the structure tree for screen readers.

import {
    clampPdfPage,
    clampPdfZoom,
    downloadBytes,
    normalizePdfRotation,
    pdfPrintDocument,
    pdfZoomStep,
    type PdfSearchStatus,
    type PdfZoom,
} from '@wirecore/wirelayer-recipes';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import type { EventBus, PDFFindController, PDFLinkService, PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer.mjs';

/** A PDF: URL (string or URL), bytes (ArrayBuffer, Uint8Array) or a Blob/File */
export type PdfSource = string | URL | ArrayBuffer | Uint8Array | Blob;

/** Files pdf.js loads besides the document */
export interface PdfAssets {
    /** URL of pdf.js's worker (`pdfjs-dist/legacy/build/pdf.worker.min.mjs`) – sets GlobalWorkerOptions.workerSrc */
    workerSrc?: string;
    /** Folder (with trailing slash) of the character maps (`pdfjs-dist/cmaps/`) for CJK fonts without embedding */
    cMapUrl?: string;
    /** Folder (with trailing slash) of the standard fonts (`pdfjs-dist/standard_fonts/`) for fonts without embedding */
    standardFontDataUrl?: string;
}

/** An entry of the document's outline (bookmarks) */
export interface PdfOutlineItem {
    id: string;
    label: string;
    /** pdf.js destination inside the document */
    dest: unknown;
    /** Link to elsewhere */
    url: string | null;
    children: PdfOutlineItem[];
}

/** Why a document could not be shown */
export type PdfErrorKind = 'invalid' | 'missing' | 'password' | 'unknown';

export interface PdfState {
    status: 'loading' | 'password' | 'ready' | 'error';
    /** Share loaded (0–1), null while the size is unknown */
    progress: number | null;
    numPages: number;
    page: number;
    /** Current factor (also for the fitted zooms) */
    scale: number;
    zoom: PdfZoom;
    rotation: number;
    outline: PdfOutlineItem[];
    /** Size of the first page (PDF units, without the viewer's rotation) – placeholder for thumbnails */
    pageSize: { width: number; height: number } | null;
    /** The password prompt follows a wrong password */
    passwordWrong: boolean;
    error: PdfErrorKind | null;
    search: PdfSearchStatus;
    /** Printing is being prepared: the page being rendered */
    printing: { page: number; count: number } | null;
}

/** Start state – also what the server renders */
export const initialPdfState = (zoom: PdfZoom = 'page-width', rotation = 0, page = 1): PdfState => ({
    status: 'loading',
    progress: null,
    numPages: 0,
    page,
    scale: typeof zoom === 'number' ? zoom : 1,
    zoom,
    rotation: normalizePdfRotation(rotation),
    outline: [],
    pageSize: null,
    passwordWrong: false,
    error: null,
    search: { state: 'idle', current: 0, total: 0 },
    printing: null,
});

export interface PdfControllerOptions {
    /** Scrolling element – must be absolutely positioned (pdf.js) */
    container: HTMLDivElement;
    /** The element inside that holds the pages (class "pdfViewer") */
    viewer: HTMLDivElement;
    textLayer: boolean;
    annotationLayer: boolean;
    /** Accessible name of a page ("Page 3") */
    pageLabel: (page: number) => string;
    onChange: (patch: Partial<PdfState>) => void;
    /** A document could not be loaded */
    onError: (error: unknown) => void;
}

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
type PdfJsViewer = typeof import('pdfjs-dist/legacy/web/pdf_viewer.mjs');
type DocumentInitParameters = Exclude<Parameters<PdfJs['getDocument']>[0], string | URL | ArrayBuffer | Uint8Array>;

let libraries: Promise<{ pdfjs: PdfJs; viewer: PdfJsViewer }> | undefined;
function loadLibraries() {
    libraries ??= (async () => {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        // pdf_viewer.mjs reads the API from this global when it is evaluated
        (globalThis as { pdfjsLib?: unknown }).pdfjsLib = pdfjs;
        const viewer = await import('pdfjs-dist/legacy/web/pdf_viewer.mjs');
        return { pdfjs, viewer };
    })().catch((error: unknown) => {
        libraries = undefined;
        throw error;
    });
    return libraries;
}

/** Bytes for pdf.js: copied, because pdf.js hands them to its worker (the caller's buffer would be detached) */
async function documentSource(source: PdfSource): Promise<DocumentInitParameters> {
    if (typeof source === 'string' || source instanceof URL) return { url: source };
    if (source instanceof Blob) return { data: new Uint8Array(await source.arrayBuffer()) };
    if (source instanceof ArrayBuffer) return { data: new Uint8Array(source.slice(0)) };
    return { data: source.slice() };
}

let outlineIds = 0;
interface RawOutline {
    title: string;
    dest: unknown;
    url: string | null;
    items: RawOutline[];
}
const toOutline = (items: RawOutline[]): PdfOutlineItem[] =>
    items.map((item) => ({
        id: `pdf-outline-${++outlineIds}`,
        label: item.title,
        dest: item.dest,
        url: item.url,
        children: toOutline(item.items ?? []),
    }));

const FIND_STATES = ['found', 'notFound', 'wrapped', 'pending'] as const;
/** Print resolution: 150 dpi (PDF units are 1/72 inch) */
const PRINT_SCALE = 150 / 72;

/** Drives one pdf.js viewer: loading, navigation, zoom, rotation, search, thumbnails, download and printing */
export class PdfController {
    readonly #options: PdfControllerOptions;
    /** Ends the listeners of the current pdf.js viewer (a new one is made when the layers change) */
    #viewerAbort?: AbortController;
    #layers: { textLayer: boolean; annotationLayer: boolean };
    #pdfjs?: PdfJs;
    #viewer?: PDFViewer;
    #eventBus?: EventBus;
    #linkService?: PDFLinkService;
    #findController?: PDFFindController;
    #task?: PDFDocumentLoadingTask;
    #document?: PDFDocumentProxy;
    #password?: (password: string) => void;
    #passwordCancelled = false;
    #observer?: MutationObserver;
    #request = 0;
    #initial: { page: number; zoom: PdfZoom; rotation: number } = { page: 1, zoom: 'page-width', rotation: 0 };
    #search: PdfSearchStatus = { state: 'idle', current: 0, total: 0 };
    #thumbnails = new WeakMap<HTMLCanvasElement, RenderTask>();
    #printing = false;

    constructor(options: PdfControllerOptions) {
        this.#options = options;
        this.#layers = { textLayer: options.textLayer, annotationLayer: options.annotationLayer };
    }

    /**
     * Switches the text and annotation layer: pdf.js sets them when its viewer is made, so a shown document gets a
     * new viewer and keeps page, zoom and rotation
     */
    async setLayers(layers: { textLayer: boolean; annotationLayer: boolean }) {
        if (layers.textLayer === this.#layers.textLayer && layers.annotationLayer === this.#layers.annotationLayer)
            return;
        this.#layers = { ...layers };
        const viewer = this.#viewer;
        if (!viewer) return;
        const libs = await loadLibraries();
        if (this.#viewer !== viewer) return;
        const document = this.#document;
        if (document)
            this.#initial = {
                page: viewer.currentPageNumber,
                zoom: (viewer.currentScaleValue === 'page-width' || viewer.currentScaleValue === 'page-fit'
                    ? viewer.currentScaleValue
                    : viewer.currentScale) as PdfZoom,
                rotation: viewer.pagesRotation,
            };
        this.#findController?.setDocument(null as never);
        viewer.setDocument(null as never);
        this.#linkService?.setDocument(null, null);
        this.#createViewer(libs);
        if (!document) return;
        this.#linkService!.setDocument(document, null);
        this.#findController!.setDocument(document);
        this.#viewer!.setDocument(document);
    }

    get document(): PDFDocumentProxy | undefined {
        return this.#document;
    }

    /** Loads a document; the view starts at `initial` (page, zoom, rotation) */
    async open(source: PdfSource, assets: PdfAssets, initial: { page: number; zoom: PdfZoom; rotation: number }) {
        const request = ++this.#request;
        this.#initial = initial;
        await this.#close();
        this.#options.onChange({ ...initialPdfState(initial.zoom, initial.rotation, initial.page) });
        try {
            const { pdfjs } = await this.#setup();
            if (request !== this.#request) return;
            if (assets.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = assets.workerSrc;
            const params: DocumentInitParameters = {
                ...(await documentSource(source)),
                cMapUrl: assets.cMapUrl,
                cMapPacked: true,
                standardFontDataUrl: assets.standardFontDataUrl,
            };
            if (request !== this.#request) return;
            this.#passwordCancelled = false;
            const task = pdfjs.getDocument(params);
            this.#task = task;
            task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
                if (request === this.#request)
                    this.#options.onChange({ progress: total ? Math.min(1, loaded / total) : null });
            };
            task.onPassword = (update: (password: string) => void, reason: number) => {
                if (request !== this.#request) return;
                this.#password = update;
                this.#options.onChange({
                    status: 'password',
                    passwordWrong: reason === pdfjs.PasswordResponses.INCORRECT_PASSWORD,
                });
            };
            const document = await task.promise;
            if (request !== this.#request) {
                void task.destroy();
                return;
            }
            this.#document = document;
            this.#password = undefined;
            this.#linkService!.setDocument(document, null);
            this.#findController!.setDocument(document);
            this.#viewer!.setDocument(document);
            void document.getOutline().then((outline) => {
                if (request === this.#request)
                    this.#options.onChange({ outline: toOutline((outline ?? []) as RawOutline[]) });
            });
            void document.getPage(1).then((page) => {
                if (request !== this.#request) return;
                const { width, height } = page.getViewport({ scale: 1, rotation: page.rotate });
                this.#options.onChange({ pageSize: { width, height } });
            });
        } catch (error) {
            if (request !== this.#request) return;
            // pdf.js leaves the body of a failed response unread, so the request stays open until the task is destroyed
            void this.#task?.destroy();
            this.#task = undefined;
            const name = (error as { name?: string } | null)?.name;
            const kind =
                this.#passwordCancelled || name === 'PasswordException'
                    ? 'password'
                    : name === 'InvalidPDFException'
                      ? 'invalid'
                      : name === 'ResponseException' && (error as { missing?: boolean }).missing
                        ? 'missing'
                        : 'unknown';
            this.#options.onChange({ status: 'error', error: kind, progress: null });
            this.#options.onError(error);
        }
    }

    /** Answers the password prompt */
    submitPassword(password: string) {
        this.#password?.(password);
    }

    /** Gives up at the password prompt: the document stays closed */
    cancelPassword() {
        this.#passwordCancelled = true;
        this.#password = undefined;
        void this.#task?.destroy();
    }

    setPage(page: number) {
        if (!this.#document || !this.#viewer) return;
        this.#viewer.currentPageNumber = clampPdfPage(page, this.#document.numPages);
    }

    setZoom(zoom: PdfZoom) {
        if (!this.#document || !this.#viewer) return;
        const value = clampPdfZoom(zoom);
        this.#viewer.currentScaleValue = typeof value === 'number' ? String(value) : value;
    }

    /** One zoom step in (1) or out (−1) */
    zoomBy(direction: 1 | -1) {
        if (this.#viewer) this.setZoom(pdfZoomStep(this.#viewer.currentScale, direction));
    }

    setRotation(rotation: number) {
        if (!this.#document || !this.#viewer) return;
        this.#viewer.pagesRotation = normalizePdfRotation(rotation);
    }

    /** Searches the text (highlighting every match); `again` goes to the next (or previous) match of the same text */
    find(query: string, options: { caseSensitive?: boolean; previous?: boolean; again?: boolean } = {}) {
        if (!this.#eventBus) return;
        if (!query.trim()) return this.closeFind();
        this.#eventBus.dispatch('find', {
            source: this,
            type: options.again ? 'again' : '',
            query,
            caseSensitive: !!options.caseSensitive,
            entireWord: false,
            highlightAll: true,
            findPrevious: !!options.previous,
            matchDiacritics: false,
        });
    }

    /** Ends the search and removes the highlights */
    closeFind() {
        this.#eventBus?.dispatch('findbarclose', { source: this });
        this.#setSearch({ state: 'idle', current: 0, total: 0 });
    }

    /** Jumps to an outline entry (or opens its link in a new tab) */
    openOutline(item: PdfOutlineItem) {
        if (item.dest) void this.#linkService?.goToDestination(item.dest as string);
        else if (item.url) window.open(item.url, '_blank', 'noopener,noreferrer');
    }

    /** Draws a page small into a canvas of the given CSS width (sharp on high-density screens) */
    async renderThumbnail(pageNumber: number, canvas: HTMLCanvasElement, width: number) {
        const document = this.#document;
        if (!document) return;
        this.#thumbnails.get(canvas)?.cancel();
        const page = await document.getPage(pageNumber);
        const rotation = (page.rotate + (this.#viewer?.pagesRotation ?? 0)) % 360;
        const natural = page.getViewport({ scale: 1, rotation });
        const ratio = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: (width / natural.width) * ratio, rotation });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${Math.floor(viewport.height / ratio)}px`;
        const task = page.render({ canvas, viewport });
        this.#thumbnails.set(canvas, task);
        try {
            await task.promise;
        } catch (error) {
            if ((error as { name?: string }).name !== 'RenderingCancelledException') throw error;
        }
    }

    /** Saves the original file */
    async download(fileName: string) {
        if (!this.#document) return;
        downloadBytes(fileName, await this.#document.getData(), 'application/pdf');
    }

    /** Renders every page at 150 dpi into a hidden frame and opens the browser's print dialog */
    async print() {
        const document = this.#document;
        const pdfjs = this.#pdfjs;
        if (!document || !pdfjs || this.#printing) return;
        this.#printing = true;
        const pages: { url: string; width: number; height: number }[] = [];
        try {
            for (let number = 1; number <= document.numPages; number++) {
                this.#options.onChange({ printing: { page: number, count: document.numPages } });
                const page = await document.getPage(number);
                const rotation = (page.rotate + (this.#viewer?.pagesRotation ?? 0)) % 360;
                const viewport = page.getViewport({ scale: PRINT_SCALE, rotation });
                const canvas = window.document.createElement('canvas');
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                await page.render({
                    canvas,
                    viewport,
                    intent: 'print',
                    annotationMode: pdfjs.AnnotationMode.ENABLE_STORAGE,
                }).promise;
                const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
                // Free the canvas memory right away
                canvas.width = canvas.height = 0;
                // Every page printed in its own size (portrait and landscape mixed)
                if (blob)
                    pages.push({
                        url: URL.createObjectURL(blob),
                        width: viewport.width / PRINT_SCALE,
                        height: viewport.height / PRINT_SCALE,
                    });
            }
            this.#options.onChange({ printing: null });
            await printImages(pages);
        } finally {
            for (const { url } of pages) URL.revokeObjectURL(url);
            this.#printing = false;
            this.#options.onChange({ printing: null });
        }
    }

    /** Sets the pages' accessible names again (after a language change) */
    relabel() {
        for (const page of this.#options.viewer.querySelectorAll<HTMLElement>('.page[data-page-number]'))
            page.setAttribute('aria-label', this.#options.pageLabel(Number(page.dataset.pageNumber)));
    }

    destroy() {
        this.#request++;
        void this.#close();
        this.#observer?.disconnect();
        this.#viewerAbort?.abort();
    }

    async #close() {
        const task = this.#task;
        this.#task = undefined;
        this.#password = undefined;
        if (this.#document) {
            this.#findController?.setDocument(null as never);
            this.#viewer?.setDocument(null as never);
            this.#linkService?.setDocument(null, null);
            this.#document = undefined;
        }
        this.#search = { state: 'idle', current: 0, total: 0 };
        await task?.destroy();
    }

    async #setup() {
        const libs = await loadLibraries();
        if (!this.#viewer) this.#createViewer(libs);
        return libs;
    }

    #createViewer(libs: { pdfjs: PdfJs; viewer: PdfJsViewer }) {
        const { pdfjs, viewer: lib } = libs;
        const { container, viewer, onChange } = this.#options;
        const { textLayer, annotationLayer } = this.#layers;
        this.#pdfjs = pdfjs;
        this.#viewerAbort?.abort();
        const viewerAbort = new AbortController();
        this.#viewerAbort = viewerAbort;
        const eventBus = new lib.EventBus();
        const linkService = new lib.PDFLinkService({
            eventBus,
            externalLinkTarget: lib.LinkTarget.BLANK,
            externalLinkRel: 'noopener noreferrer nofollow',
        });
        const findController = new lib.PDFFindController({ eventBus, linkService, updateMatchesCountOnProgress: true });
        const viewerOptions = {
            container,
            viewer,
            eventBus,
            linkService,
            findController,
            textLayerMode: textLayer ? 1 : 0,
            annotationMode: annotationLayer ? pdfjs.AnnotationMode.ENABLE : pdfjs.AnnotationMode.DISABLE,
            // Our own names for the pages (below) instead of pdf.js's English texts
            l10n: silentL10n as never,
            // Not in pdf.js's types, but read: ends its resize observer and scroll listener
            abortSignal: viewerAbort.signal,
        };
        this.#viewer = new lib.PDFViewer(viewerOptions);
        linkService.setViewer(this.#viewer);
        this.#eventBus = eventBus;
        this.#linkService = linkService;
        this.#findController = findController;

        eventBus.on('pagesinit', () => {
            const { page, zoom, rotation } = this.#initial;
            this.setZoom(zoom);
            if (rotation) this.setRotation(rotation);
            if (page > 1) this.setPage(page);
            const numPages = this.#document?.numPages ?? 0;
            onChange({ status: 'ready', numPages, progress: 1, error: null, passwordWrong: false });
        });
        eventBus.on('pagechanging', ({ pageNumber }: { pageNumber: number }) => onChange({ page: pageNumber }));
        eventBus.on('scalechanging', ({ scale, presetValue }: { scale: number; presetValue?: string }) =>
            onChange({
                scale,
                zoom: presetValue === 'page-width' || presetValue === 'page-fit' ? presetValue : scale,
            })
        );
        eventBus.on('rotationchanging', ({ pagesRotation }: { pagesRotation: number }) =>
            onChange({ rotation: pagesRotation })
        );
        eventBus.on(
            'updatefindmatchescount',
            ({ matchesCount }: { matchesCount: { current: number; total: number } }) =>
                this.#setSearch({ ...this.#search, current: matchesCount.current, total: matchesCount.total })
        );
        eventBus.on(
            'updatefindcontrolstate',
            ({
                state,
                previous,
                matchesCount,
            }: {
                state: number;
                previous?: boolean;
                matchesCount?: { current: number; total: number };
            }) =>
                this.#setSearch({
                    state: FIND_STATES[state] ?? 'idle',
                    previous: !!previous,
                    current: matchesCount?.current ?? this.#search.current,
                    total: matchesCount?.total ?? this.#search.total,
                })
        );
        // Pages appear while scrolling: name each new one
        if (!this.#observer) {
            this.#observer = new MutationObserver(() => this.relabel());
            this.#observer.observe(viewer, { childList: true });
        }
    }

    #setSearch(search: PdfSearchStatus) {
        this.#search = search;
        this.#options.onChange({ search });
    }
}

/** pdf.js's localisation, unused: the viewer names the pages itself */
const silentL10n = {
    getLanguage: () => 'en',
    getDirection: () => 'ltr',
    get: async () => '',
    translate: async () => {},
    translateOnce: async () => {},
    destroy: async () => {},
    pause: () => {},
    resume: () => {},
};

/** Prints images (one per page, in its size) from a hidden frame; resolves once the print dialog is closed */
function printImages(pages: { url: string; width: number; height: number }[]): Promise<void> {
    return new Promise((resolve) => {
        const frame = document.createElement('iframe');
        frame.setAttribute('aria-hidden', 'true');
        frame.tabIndex = -1;
        Object.assign(frame.style, {
            position: 'fixed',
            right: '0',
            bottom: '0',
            width: '0',
            height: '0',
            border: '0',
        });
        frame.srcdoc = pdfPrintDocument(pages);
        let finished = false;
        const done = () => {
            if (finished) return;
            finished = true;
            frame.remove();
            resolve();
        };
        frame.addEventListener('load', async () => {
            const view = frame.contentWindow;
            if (!view) return done();
            await Promise.all([...view.document.images].map((image) => image.decode().catch(() => {})));
            view.addEventListener('afterprint', done, { once: true });
            view.focus();
            view.print();
            // Browsers without a blocking print() or without afterprint in frames: clean up later
            setTimeout(done, 60_000);
        });
        document.body.append(frame);
    });
}
