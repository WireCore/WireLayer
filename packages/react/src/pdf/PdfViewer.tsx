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
} from 'lucide-react';
import {
    useEffect,
    useId,
    useImperativeHandle,
    useRef,
    useState,
    type ComponentProps,
    type KeyboardEvent,
    type Ref,
} from 'react';
import { flushSync } from 'react-dom';
import { Button } from '../components/Button/Button.js';
import { Dialog, DialogContent } from '../components/Dialog/Dialog.js';
import { Field } from '../components/Field/Field.js';
import { useLocale, useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { PasswordInput } from '../components/PasswordInput/PasswordInput.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { Select } from '../components/Select/Select.js';
import { Spinner } from '../components/Spinner/Spinner.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/Tabs/Tabs.js';
import { Tree } from '../components/Tree/Tree.js';
import type { TreeNode } from '../components/Tree/types.js';
import { initialPdfState, PdfController, type PdfOutlineItem, type PdfSource, type PdfState } from './engine.js';

export interface PdfViewerProps extends Omit<ComponentProps<'div'>, 'children' | 'onError' | 'ref'> {
    /** The PDF: URL, ArrayBuffer/Uint8Array or Blob/File – loaded in the browser (the server renders the loading state) */
    src: PdfSource;
    /** Current page (1-based) – changing it shows that page */
    page?: number;
    onPageChange?: (page: number) => void;
    /** Zoom: factor (1 = 100 %, 0.5–4), "page-width" (default) or "page-fit" */
    zoom?: PdfZoom;
    onZoomChange?: (zoom: PdfZoom) => void;
    /** Rotation of all pages clockwise: 0, 90, 180 or 270 */
    rotation?: number;
    onRotationChange?: (rotation: number) => void;
    /** Side bar with thumbnails and the outline (controlled) */
    sidebar?: boolean;
    onSidebarChange?: (open: boolean) => void;
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
    /** The document is shown */
    onLoaded?: (details: { numPages: number }) => void;
    /** The document could not be loaded (invalid, not found, password refused …) */
    onError?: (error: unknown) => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof pdfViewerRecipe>;
    ref?: Ref<PdfViewerHandle>;
}

/** Methods of a PdfViewer (ref) */
export interface PdfViewerHandle {
    /** Shows a page (1-based) */
    goToPage(page: number): void;
    /** Searches the document; the search bar shows the matches */
    search(text: string, options?: { caseSensitive?: boolean }): void;
    /** Opens the print dialog (pages rendered at 150 dpi) */
    print(): Promise<void>;
    /** Saves the original file */
    download(): Promise<void>;
}

const THUMBNAIL_WIDTH = 120;

/**
 * PDF viewer (pdf.js): a toolbar (role="toolbar", one tab stop, arrow keys inside), an optional side bar with
 * thumbnails and the outline, and the pages – canvas with a text layer (selection, search, screen readers), links and
 * the structure of tagged PDFs. In the page area Page Up/Down and Home/End change the page; Ctrl/⌘ + − 0 zoom and
 * Ctrl/⌘+F opens the search while the focus is in the viewer.
 */
export function PdfViewer({
    src,
    page = 1,
    onPageChange,
    zoom = 'page-width',
    onZoomChange,
    rotation = 0,
    onRotationChange,
    sidebar,
    onSidebarChange,
    toolbar = true,
    height = '600px',
    label,
    fileName,
    workerSrc,
    cMapUrl,
    standardFontDataUrl,
    textLayer = true,
    annotationLayer = true,
    onLoaded,
    onError,
    classes,
    className,
    style,
    onKeyDown,
    ref,
    ...props
}: PdfViewerProps) {
    const pdfViewer = useRecipe('pdfViewer', pdfViewerRecipe, classes);
    const styles = pdfViewer();
    const field = input({ size: 'sm' });
    const translations = useTranslations();
    const t = translations.pdfViewer;
    const { locale } = useLocale();
    const id = useId();
    const tools = new Set(resolvePdfTools(toolbar));

    const [state, setState] = useState<PdfState>(() => initialPdfState(zoom, rotation, page));
    const ready = state.status === 'ready';
    const rootRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pagesRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<PdfController | null>(null);
    // The viewer's state for callbacks and effects (not read while rendering)
    const stateRef = useRef(state);
    // Latest props for the controller's callbacks
    const latest = useRef({ page, zoom, rotation, onPageChange, onZoomChange, onRotationChange, onLoaded, onError, t });
    useEffect(() => {
        latest.current = { page, zoom, rotation, onPageChange, onZoomChange, onRotationChange, onLoaded, onError, t };
    });

    // Announcements of navigation by keyboard or buttons (not while scrolling)
    const [announcement, setAnnouncement] = useState('');
    function goTo(target: number) {
        const current = stateRef.current;
        if (current.status !== 'ready') return;
        const number = clampPdfPage(target, current.numPages);
        controllerRef.current?.setPage(number);
        setAnnouncement(t.pageStatus(number, current.numPages));
    }

    // Page field: the typed text until Enter or leaving the field
    const [pageDraft, setPageDraft] = useState<string | null>(null);
    function commitPage() {
        if (pageDraft === null) return;
        const target = parsePdfPage(pageDraft, state.numPages);
        setPageDraft(null);
        if (target) goTo(target);
    }

    // Zoom list: presets, the fixed steps and – when set from outside – the current factor
    const percent = (value: number) =>
        new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(value);
    const steps =
        typeof state.zoom === 'number' && !pdfZoomSteps.includes(state.zoom)
            ? [...pdfZoomSteps, state.zoom].sort((a, b) => a - b)
            : pdfZoomSteps;
    const zoomItems = [
        { value: 'page-width', label: t.pageWidth },
        { value: 'page-fit', label: t.pageFit },
        ...steps.map((step) => ({ value: pdfZoomKey(step), label: percent(step) })),
    ];

    // Search bar below the toolbar
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const searchFieldRef = useRef<HTMLInputElement>(null);
    const searchButtonRef = useRef<HTMLButtonElement>(null);
    const searchText = pdfSearchText(state.search, query, t);
    // Rendered right away, so the focus can move at once
    function openSearch() {
        flushSync(() => setSearchOpen(true));
        searchFieldRef.current?.focus();
        searchFieldRef.current?.select();
    }
    function closeSearch() {
        flushSync(() => setSearchOpen(false));
        controllerRef.current?.closeFind();
        searchButtonRef.current?.focus();
    }
    const runSearch = (text: string, matchCase: boolean) =>
        controllerRef.current?.find(text, { caseSensitive: matchCase });
    const findAgain = (previous: boolean) =>
        controllerRef.current?.find(query, { caseSensitive, previous, again: true });
    function onSearchKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            findAgain(event.shiftKey);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            closeSearch();
        }
    }

    // Side bar: thumbnails (drawn when they scroll into view) and the outline
    const [internalSidebar, setInternalSidebar] = useState(false);
    const sidebarOpen = sidebar ?? internalSidebar;
    function toggleSidebar() {
        setInternalSidebar(!sidebarOpen);
        onSidebarChange?.(!sidebarOpen);
    }
    const [sidebarTab, setSidebarTab] = useState('thumbnails');
    const thumbnailSize = pdfThumbnailSize(
        state.pageSize ?? { width: 595, height: 842 },
        state.rotation,
        THUMBNAIL_WIDTH
    );
    const pageNumbers = Array.from({ length: state.numPages }, (_, index) => index + 1);
    const canvases = useRef(new Map<number, HTMLCanvasElement>());
    const drawn = useRef(new Set<number>());
    const thumbnailObserver = useRef<IntersectionObserver | null>(null);
    function registerThumbnail(number: number, canvas: HTMLCanvasElement | null) {
        const previous = canvases.current.get(number);
        if (previous && previous !== canvas) thumbnailObserver.current?.unobserve(previous);
        if (!canvas) {
            canvases.current.delete(number);
            return;
        }
        if (previous === canvas) return;
        canvases.current.set(number, canvas);
        drawn.current.delete(number);
        thumbnailObserver.current?.observe(canvas);
    }
    // Thumbnails are drawn anew for another document or rotation
    useEffect(() => {
        drawn.current.clear();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    const number = Number((entry.target as HTMLElement).dataset.page);
                    if (drawn.current.has(number)) continue;
                    drawn.current.add(number);
                    void controllerRef.current?.renderThumbnail(
                        number,
                        entry.target as HTMLCanvasElement,
                        THUMBNAIL_WIDTH
                    );
                }
            },
            { rootMargin: '200px' }
        );
        thumbnailObserver.current = observer;
        for (const canvas of canvases.current.values()) observer.observe(canvas);
        return () => observer.disconnect();
    }, [state.rotation, src]);
    const outlineIndex = new Map<string, PdfOutlineItem>();
    const outlineBranches: string[] = [];
    const toNodes = (items: PdfOutlineItem[]): TreeNode[] =>
        items.map((item) => {
            outlineIndex.set(item.id, item);
            if (item.children.length) outlineBranches.push(item.id);
            return {
                id: item.id,
                label: item.label,
                ...(item.children.length ? { children: toNodes(item.children) } : {}),
            };
        });
    const outlineNodes = toNodes(state.outline);
    // Choosing an entry jumps there; the tree keeps no selection, so the same entry can be chosen again
    function openOutline(ids: string[]) {
        const item = ids[0] ? outlineIndex.get(ids[0]) : undefined;
        if (item) controllerRef.current?.openOutline(item);
    }

    // Full screen
    // The root while it is shown full screen – the password dialog is rendered into it then
    const [fullscreenRoot, setFullscreenRoot] = useState<HTMLDivElement | null>(null);
    const fullscreen = !!fullscreenRoot;
    useEffect(() => {
        const onChange = () =>
            setFullscreenRoot(
                rootRef.current && document.fullscreenElement === rootRef.current ? rootRef.current : null
            );
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);
    function toggleFullscreen() {
        if (document.fullscreenElement === rootRef.current) void document.exitFullscreen();
        else void rootRef.current?.requestFullscreen();
    }

    // Password prompt
    const [password, setPassword] = useState('');
    function submitPassword() {
        controllerRef.current?.submitPassword(password);
        setPassword('');
    }
    function onPasswordOpenChange(open: boolean) {
        if (!open && stateRef.current.status === 'password') controllerRef.current?.cancelPassword();
    }

    const errorText =
        state.error === 'invalid'
            ? t.invalid
            : state.error === 'missing'
              ? t.missing
              : state.error === 'password'
                ? t.passwordRequired
                : t.error;

    function onRootKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        onKeyDown?.(event);
        // Portals (the password dialog) bubble here in React – only keys from inside the viewer count
        if (event.defaultPrevented || !rootRef.current?.contains(event.target as Node)) return;
        const action = pdfKeyAction(event, !!containerRef.current?.contains(event.target as Node));
        if (!action) return;
        if (action === 'find') {
            if (!tools.has('search') || !ready) return;
            event.preventDefault();
            openSearch();
            return;
        }
        if (!ready) return;
        event.preventDefault();
        const controller = controllerRef.current;
        if (action === 'next') goTo(state.page + 1);
        else if (action === 'previous') goTo(state.page - 1);
        else if (action === 'first') goTo(1);
        else if (action === 'last') goTo(state.numPages);
        else if (action === 'zoomIn') controller?.zoomBy(1);
        else if (action === 'zoomOut') controller?.zoomBy(-1);
        else controller?.setZoom(1);
    }

    // The controller lives as long as the component; pdf.js is loaded when the first document opens
    useEffect(() => {
        const controller = new PdfController({
            container: containerRef.current!,
            viewer: pagesRef.current!,
            textLayer,
            annotationLayer,
            pageLabel: (number) => latest.current.t.pageLabel(number),
            onChange: (patch) => {
                const previous = stateRef.current;
                const next = { ...previous, ...patch };
                stateRef.current = next;
                setState(next);
                // Viewer → outside, once the document is shown
                const props = latest.current;
                if (patch.status === 'ready' && previous.status !== 'ready') {
                    setAnnouncement(props.t.loaded(next.numPages));
                    props.onLoaded?.({ numPages: next.numPages });
                }
                if (next.status !== 'ready') return;
                if (patch.page !== undefined && patch.page !== previous.page && patch.page !== props.page)
                    props.onPageChange?.(patch.page);
                if (patch.zoom !== undefined && patch.zoom !== previous.zoom && patch.zoom !== props.zoom)
                    props.onZoomChange?.(patch.zoom);
                if (
                    patch.rotation !== undefined &&
                    patch.rotation !== previous.rotation &&
                    patch.rotation !== normalizePdfRotation(props.rotation)
                )
                    props.onRotationChange?.(patch.rotation);
            },
            onError: (error) => latest.current.onError?.(error),
        });
        controllerRef.current = controller;
        return () => {
            controller.destroy();
            controllerRef.current = null;
        };
        // Text and annotation layer: the start values; later changes go through setLayers (below)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        void controllerRef.current?.setLayers({ textLayer, annotationLayer });
    }, [textLayer, annotationLayer]);
    useEffect(() => {
        const { page: start, zoom: startZoom, rotation: startRotation } = latest.current;
        void controllerRef.current?.open(
            src,
            { workerSrc, cMapUrl, standardFontDataUrl },
            { page: start, zoom: startZoom, rotation: startRotation }
        );
    }, [src, workerSrc, cMapUrl, standardFontDataUrl]);
    useEffect(() => controllerRef.current?.relabel(), [locale]);

    // Outside → viewer
    useEffect(() => {
        if (page !== stateRef.current.page) controllerRef.current?.setPage(page);
    }, [page]);
    useEffect(() => {
        if (zoom !== stateRef.current.zoom) controllerRef.current?.setZoom(zoom);
    }, [zoom]);
    useEffect(() => {
        if (normalizePdfRotation(rotation) !== stateRef.current.rotation) controllerRef.current?.setRotation(rotation);
    }, [rotation]);

    const hasToolbar = tools.size > 0;
    useEffect(
        () => (toolbarRef.current ? setupToolbar(toolbarRef.current, 'horizontal', { textInputs: true }) : undefined),
        [hasToolbar]
    );

    useImperativeHandle(ref, () => ({
        goToPage: (number) => goTo(number),
        search: (text, options = {}) => {
            setQuery(text);
            setCaseSensitive(!!options.caseSensitive);
            if (tools.has('search')) openSearch();
            runSearch(text, !!options.caseSensitive);
        },
        print: async () => controllerRef.current?.print(),
        download: async () => controllerRef.current?.download(pdfFileName(src, fileName, t.fileName)),
    }));

    const thumbnailList = (
        <div className={styles.thumbnails()}>
            {pageNumbers.map((number) => (
                <button
                    key={number}
                    type="button"
                    className={styles.thumbnail()}
                    aria-label={t.pageLabel(number)}
                    aria-current={number === state.page ? 'page' : undefined}
                    onClick={() => goTo(number)}
                >
                    <canvas
                        ref={(canvas) => registerThumbnail(number, canvas)}
                        data-page={number}
                        className={styles.thumbnailCanvas()}
                        style={{ width: `${thumbnailSize.width}px`, height: `${thumbnailSize.height}px` }}
                        aria-hidden="true"
                    />
                    <span aria-hidden="true">{number}</span>
                </button>
            ))}
        </div>
    );

    return (
        <div
            {...props}
            ref={rootRef}
            role="region"
            aria-label={label ?? t.label}
            className={styles.base({ class: className })}
            style={{ height: fullscreen ? '100%' : height, ...style }}
            data-fullscreen={fullscreen || undefined}
            aria-busy={state.status === 'loading' || undefined}
            onKeyDown={onRootKeyDown}
        >
            {hasToolbar && (
                <div ref={toolbarRef} role="toolbar" aria-label={t.toolbar} className={styles.toolbar()}>
                    {tools.has('sidebar') && (
                        <>
                            <button
                                type="button"
                                className={styles.tool()}
                                aria-label={t.sidebar}
                                title={t.sidebar}
                                aria-expanded={sidebarOpen}
                                aria-controls={sidebarOpen ? `${id}sidebar` : undefined}
                                onClick={toggleSidebar}
                            >
                                <PanelLeft className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                            <span className={styles.separator()} aria-hidden="true" />
                        </>
                    )}
                    {tools.has('page') && (
                        <>
                            <button
                                type="button"
                                className={styles.tool()}
                                aria-label={t.previousPage}
                                title={t.previousPage}
                                disabled={!ready}
                                aria-disabled={ready && state.page <= 1 ? true : undefined}
                                onClick={() => goTo(state.page - 1)}
                            >
                                <ChevronUp className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                            <span className={styles.pageField()}>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    className={styles.pageInput()}
                                    aria-label={t.page}
                                    aria-describedby={`${id}pages`}
                                    disabled={!ready}
                                    value={pageDraft ?? String(state.page)}
                                    onChange={(event) => setPageDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            commitPage();
                                        } else if (event.key === 'Escape') setPageDraft(null);
                                    }}
                                    onBlur={commitPage}
                                />
                                <span id={`${id}pages`}>{t.ofPages(state.numPages)}</span>
                            </span>
                            <button
                                type="button"
                                className={styles.tool()}
                                aria-label={t.nextPage}
                                title={t.nextPage}
                                disabled={!ready}
                                aria-disabled={ready && state.page >= state.numPages ? true : undefined}
                                onClick={() => goTo(state.page + 1)}
                            >
                                <ChevronDown className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                            <span className={styles.separator()} aria-hidden="true" />
                        </>
                    )}
                    {tools.has('zoom') && (
                        <>
                            <button
                                type="button"
                                className={styles.tool()}
                                aria-label={t.zoomOut}
                                title={t.zoomOut}
                                disabled={!ready}
                                aria-disabled={ready && state.scale <= PDF_ZOOM_MIN ? true : undefined}
                                onClick={() => controllerRef.current?.zoomBy(-1)}
                            >
                                <ZoomOut className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                            <Select
                                className={styles.zoomSelect()}
                                size="sm"
                                standalone
                                aria-label={t.zoom}
                                items={zoomItems}
                                value={pdfZoomKey(state.zoom)}
                                disabled={!ready}
                                onValueChange={(key) => key && controllerRef.current?.setZoom(pdfZoomFromKey(key))}
                            />
                            <button
                                type="button"
                                className={styles.tool()}
                                aria-label={t.zoomIn}
                                title={t.zoomIn}
                                disabled={!ready}
                                aria-disabled={ready && state.scale >= PDF_ZOOM_MAX ? true : undefined}
                                onClick={() => controllerRef.current?.zoomBy(1)}
                            >
                                <ZoomIn className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                        </>
                    )}
                    {tools.has('rotate') && (
                        <button
                            type="button"
                            className={styles.tool()}
                            aria-label={t.rotate}
                            title={t.rotate}
                            disabled={!ready}
                            onClick={() => controllerRef.current?.setRotation(state.rotation + 90)}
                        >
                            <RotateCw className={styles.toolIcon()} aria-hidden="true" />
                        </button>
                    )}
                    <div className={styles.toolbarEnd()}>
                        {tools.has('search') && (
                            <button
                                ref={searchButtonRef}
                                type="button"
                                className={styles.tool()}
                                aria-label={t.search}
                                title={t.search}
                                aria-keyshortcuts="Control+F"
                                aria-expanded={searchOpen}
                                aria-controls={searchOpen ? `${id}search` : undefined}
                                disabled={!ready}
                                onClick={() => (searchOpen ? closeSearch() : openSearch())}
                            >
                                <Search className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                        )}
                        {tools.has('download') && (
                            <button
                                type="button"
                                className={styles.tool()}
                                aria-label={t.download}
                                title={t.download}
                                disabled={!ready}
                                onClick={() => controllerRef.current?.download(pdfFileName(src, fileName, t.fileName))}
                            >
                                <Download className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                        )}
                        {tools.has('print') && (
                            <button
                                type="button"
                                className={styles.tool()}
                                aria-label={t.print}
                                title={t.print}
                                disabled={!ready}
                                aria-disabled={state.printing ? true : undefined}
                                onClick={() => !state.printing && controllerRef.current?.print()}
                            >
                                <Printer className={styles.toolIcon()} aria-hidden="true" />
                            </button>
                        )}
                        {tools.has('fullscreen') && (
                            <button
                                type="button"
                                className={styles.tool()}
                                aria-label={t.fullscreen}
                                title={t.fullscreen}
                                aria-pressed={fullscreen}
                                onClick={toggleFullscreen}
                            >
                                {fullscreen ? (
                                    <Minimize className={styles.toolIcon()} aria-hidden="true" />
                                ) : (
                                    <Maximize className={styles.toolIcon()} aria-hidden="true" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {searchOpen && (
                <div id={`${id}search`} role="search" className={styles.searchBar()} onKeyDown={onSearchKeyDown}>
                    <div className={field.base({ class: styles.searchField() })}>
                        <input
                            ref={searchFieldRef}
                            type="search"
                            autoComplete="off"
                            aria-label={t.searchField}
                            className={field.control()}
                            value={query}
                            onChange={(event) => {
                                setQuery(event.target.value);
                                runSearch(event.target.value, caseSensitive);
                            }}
                        />
                    </div>
                    <button
                        type="button"
                        className={styles.tool()}
                        aria-label={t.matchCase}
                        title={t.matchCase}
                        aria-pressed={caseSensitive}
                        onClick={() => {
                            setCaseSensitive(!caseSensitive);
                            runSearch(query, !caseSensitive);
                        }}
                    >
                        <CaseSensitive className={styles.toolIcon()} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className={styles.tool()}
                        aria-label={t.previousMatch}
                        title={t.previousMatch}
                        aria-disabled={!state.search.total || undefined}
                        onClick={() => state.search.total && findAgain(true)}
                    >
                        <ChevronUp className={styles.toolIcon()} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className={styles.tool()}
                        aria-label={t.nextMatch}
                        title={t.nextMatch}
                        aria-disabled={!state.search.total || undefined}
                        onClick={() => state.search.total && findAgain(false)}
                    >
                        <ChevronDown className={styles.toolIcon()} aria-hidden="true" />
                    </button>
                    <span role="status" className={styles.searchStatus()}>
                        {searchText}
                    </span>
                    <button
                        type="button"
                        className={styles.tool()}
                        aria-label={t.closeSearch}
                        title={t.closeSearch}
                        onClick={closeSearch}
                    >
                        <X className={styles.toolIcon()} aria-hidden="true" />
                    </button>
                </div>
            )}
            <div className={styles.body()}>
                {sidebarOpen && (
                    <div id={`${id}sidebar`} className={styles.sidebar()}>
                        <Tabs
                            value={sidebarTab}
                            onValueChange={(value) => value && setSidebarTab(value)}
                            label={t.sidebar}
                            className={styles.sidebarTabs()}
                        >
                            <TabsList>
                                <TabsTrigger value="thumbnails">{t.thumbnails}</TabsTrigger>
                                <TabsTrigger value="outline">{t.outline}</TabsTrigger>
                            </TabsList>
                            <TabsContent value="thumbnails" className={styles.sidebarPanel()}>
                                {thumbnailList}
                            </TabsContent>
                            <TabsContent value="outline" className={styles.sidebarPanel()}>
                                {outlineNodes.length ? (
                                    <Tree
                                        className={styles.outline()}
                                        items={outlineNodes}
                                        label={t.outline}
                                        selectionMode="single"
                                        selectedValue={[]}
                                        defaultExpandedValue={outlineBranches}
                                        onSelectionChange={openOutline}
                                    />
                                ) : (
                                    <p className={styles.empty()}>{t.noOutline}</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
                <div className={styles.viewport()}>
                    {/* pdf.js renders into "pdfViewer" (its own class, styled by pdfjs-dist/legacy/web/pdf_viewer.css) */}
                    <div
                        ref={containerRef}
                        className={styles.container()}
                        tabIndex={0}
                        role="document"
                        aria-label={t.pages}
                    >
                        <div ref={pagesRef} className="pdfViewer" />
                    </div>
                    {state.status === 'loading' ? (
                        <div className={styles.status()}>
                            <Spinner
                                size="lg"
                                label={t.loading}
                                {...(state.progress !== null ? { value: Math.round(state.progress * 100) } : {})}
                            />
                            <span aria-hidden="true">{t.loading}</span>
                        </div>
                    ) : state.status === 'error' ? (
                        <div className={styles.status()}>
                            <FileWarning className={styles.errorIcon()} aria-hidden="true" />
                            <p role="alert" className={styles.error()}>
                                {errorText}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
            <div role="status" className={styles.srOnly()}>
                {announcement}
            </div>
            <Dialog open={state.status === 'password'} onOpenChange={onPasswordOpenChange}>
                <DialogContent
                    title={t.passwordTitle}
                    description={t.passwordDescription}
                    size="sm"
                    portalTarget={fullscreenRoot}
                    footer={
                        <>
                            <Button variant="outline" size="sm" onClick={() => onPasswordOpenChange(false)}>
                                {translations.common.cancel}
                            </Button>
                            <Button size="sm" type="submit" form={`${id}password`}>
                                {t.passwordSubmit}
                            </Button>
                        </>
                    }
                >
                    <form
                        id={`${id}password`}
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitPassword();
                        }}
                    >
                        <Field label={t.passwordLabel} error={state.passwordWrong ? t.passwordWrong : undefined}>
                            <PasswordInput
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                        </Field>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
