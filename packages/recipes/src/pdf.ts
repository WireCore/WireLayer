import { tv } from './tv.js';

// PDF viewer (@wirecore/wirelayer-vue/pdf, @wirecore/wirelayer-react/pdf on pdf.js): the frame, toolbar and side bar, and the logic both
// frameworks share – zoom steps, page numbers, rotation, keyboard and search status. pdf.js itself is loaded by the
// viewer packages; nothing here depends on it.

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

export const pdfViewer = tv({
    slots: {
        base: 'relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-card text-fg data-fullscreen:rounded-none data-fullscreen:border-0',
        toolbar: 'flex flex-wrap items-center gap-0.5 border-b border-line bg-card p-1',
        /** Tools at the end of the toolbar (search, download, print, full screen) */
        toolbarEnd: 'ms-auto flex flex-wrap items-center gap-0.5',
        separator: 'mx-1 h-5 w-px bg-line',
        // 32 × 32 px targets; pressed and expanded tools are tinted
        tool: [
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-line hover:text-fg',
            'aria-pressed:bg-line aria-pressed:text-fg aria-expanded:bg-line aria-expanded:text-fg',
            // aria-disabled at a limit (first page, 400 %): stays focusable in the toolbar
            'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
            'aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent',
            'forced-colors:aria-pressed:outline-1 forced-colors:aria-pressed:outline-[Highlight]',
            focusRing,
        ],
        toolIcon: 'size-4',
        /** Page number field with "of 12" */
        pageField: 'flex items-center gap-1.5 px-1 text-sm text-muted tabular-nums',
        pageInput: [
            'h-8 w-12 rounded-md border border-line-strong bg-bg px-1 text-center text-sm text-fg tabular-nums',
            'disabled:cursor-not-allowed disabled:opacity-40',
            'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
        ],
        /** Added to the Select for the zoom */
        zoomSelect: 'w-36',
        /** Search bar below the toolbar */
        searchBar: 'flex flex-wrap items-center gap-1.5 border-b border-line bg-card p-1.5',
        /** Added to the input recipe's base for the search field */
        searchField: 'min-w-40 flex-1',
        searchStatus: 'min-w-0 px-1 text-sm text-muted tabular-nums',
        /** Side bar and pages */
        body: 'relative flex min-h-0 flex-1',
        sidebar: 'flex w-52 shrink-0 flex-col overflow-hidden border-e border-line bg-card',
        /** Added to the Tabs inside the side bar */
        sidebarTabs: 'flex min-h-0 flex-1 flex-col',
        sidebarPanel: 'min-h-0 flex-1 overflow-y-auto',
        thumbnails: 'flex flex-col items-center gap-2 p-3',
        thumbnail: [
            'flex cursor-pointer flex-col items-center gap-1 rounded-md p-1.5 text-xs text-muted hover:bg-line hover:text-fg',
            'aria-current:bg-primary/10 aria-current:text-fg forced-colors:aria-current:outline-2 forced-colors:aria-current:outline-[Highlight]',
            focusRing,
        ],
        /** Canvas of a thumbnail; white like paper until the page is drawn */
        thumbnailCanvas: 'block bg-white shadow-sm ring-1 ring-line',
        outline: 'p-2',
        /** "No table of contents" */
        empty: 'p-3 text-sm text-muted',
        /** Positioned frame for the scrolling page area (pdf.js needs an absolutely positioned container) */
        viewport: 'relative min-w-0 flex-1 bg-bg-2',
        container: [
            'absolute inset-0 overflow-auto outline-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        /** Loading, password and error state over the page area */
        status: 'absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted',
        progress: 'w-full max-w-64',
        error: 'max-w-md text-danger',
        errorIcon: 'size-6 text-danger',
        srOnly: 'sr-only',
    },
});

/** Zoom of the PdfViewer: a factor (1 = 100 %), fitted to the page width or the whole page */
export type PdfZoom = number | 'page-width' | 'page-fit';
/** Tools of the PdfViewer's toolbar */
export type PdfTool = 'sidebar' | 'page' | 'zoom' | 'rotate' | 'search' | 'download' | 'print' | 'fullscreen';
/** All tools in their order in the toolbar */
export const pdfTools: readonly PdfTool[] = [
    'sidebar',
    'page',
    'zoom',
    'rotate',
    'search',
    'download',
    'print',
    'fullscreen',
];
/** Fixed zoom steps (50–400 %) for −/+ and the zoom list */
export const pdfZoomSteps: readonly number[] = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
export const PDF_ZOOM_MIN = 0.5;
export const PDF_ZOOM_MAX = 4;

/** The tools shown: `true` all, `false` none, a list in the toolbar's order (unknown names are ignored) */
export function resolvePdfTools(toolbar: boolean | readonly PdfTool[]): PdfTool[] {
    if (toolbar === true) return [...pdfTools];
    if (!toolbar) return [];
    return pdfTools.filter((tool) => toolbar.includes(tool));
}

/** The next zoom step above (1) or below (−1) the current factor, within 50–400 % */
export function pdfZoomStep(scale: number, direction: 1 | -1): number {
    const epsilon = 0.001;
    const step =
        direction > 0
            ? pdfZoomSteps.find((value) => value > scale + epsilon)
            : [...pdfZoomSteps].reverse().find((value) => value < scale - epsilon);
    return step ?? (direction > 0 ? PDF_ZOOM_MAX : PDF_ZOOM_MIN);
}

/** A zoom within 50–400 % (presets stay) */
export function clampPdfZoom(zoom: PdfZoom): PdfZoom {
    if (typeof zoom !== 'number') return zoom;
    return Number.isFinite(zoom) ? Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, zoom)) : 1;
}

/** Key of a zoom in the zoom list: the preset or the factor as text ("1.25") */
export const pdfZoomKey = (zoom: PdfZoom): string => String(zoom);
/** The zoom of a key from the zoom list */
export const pdfZoomFromKey = (key: string): PdfZoom =>
    key === 'page-width' || key === 'page-fit' ? key : clampPdfZoom(Number(key));

/** A page number within 1…count (at least 1) */
export function clampPdfPage(page: number, count: number): number {
    if (!Number.isFinite(page)) return 1;
    return Math.min(Math.max(1, count), Math.max(1, Math.round(page)));
}

/** The page typed into the page field, or null when it is no number */
export function parsePdfPage(text: string, count: number): number | null {
    const value = Number.parseInt(text.trim(), 10);
    return Number.isNaN(value) ? null : clampPdfPage(value, count);
}

/** A rotation as 0, 90, 180 or 270 degrees (clockwise; other angles snap to the nearest quarter turn) */
export function normalizePdfRotation(rotation: number): 0 | 90 | 180 | 270 {
    const quarter = Number.isFinite(rotation) ? Math.round(rotation / 90) : 0;
    return ((((quarter % 4) + 4) % 4) * 90) as 0 | 90 | 180 | 270;
}

/** Size of a thumbnail of the given width for a page of `width` × `height` (PDF units), turned by `rotation` */
export function pdfThumbnailSize(
    page: { width: number; height: number },
    rotation: number,
    width: number
): { width: number; height: number } {
    const turned = normalizePdfRotation(rotation) % 180 !== 0;
    const [pageWidth, pageHeight] = turned ? [page.height, page.width] : [page.width, page.height];
    return { width, height: Math.round((width * pageHeight) / pageWidth) };
}

/** A command of the viewer's keyboard */
export type PdfKeyAction = 'next' | 'previous' | 'first' | 'last' | 'zoomIn' | 'zoomOut' | 'zoomReset' | 'find';

interface KeyInput {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
}

/**
 * The command of a key press inside the viewer: Ctrl/⌘ with + − 0 zoom, Ctrl/⌘+F opens the search; in the page area
 * (`inPages`) Page Up/Down change the page, Home/End go to the first/last page.
 */
export function pdfKeyAction(event: KeyInput, inPages: boolean): PdfKeyAction | undefined {
    if (event.altKey) return undefined;
    if (event.ctrlKey || event.metaKey) {
        if (event.key === '+' || event.key === '=') return 'zoomIn';
        if (event.key === '-' || event.key === '_') return 'zoomOut';
        if (event.key === '0') return 'zoomReset';
        if (event.key.toLowerCase() === 'f' && !event.shiftKey) return 'find';
        return undefined;
    }
    if (!inPages || event.shiftKey) return undefined;
    switch (event.key) {
        case 'PageDown':
            return 'next';
        case 'PageUp':
            return 'previous';
        case 'Home':
            return 'first';
        case 'End':
            return 'last';
        default:
            return undefined;
    }
}

/** State of a search in the document */
export interface PdfSearchStatus {
    state: 'idle' | 'pending' | 'found' | 'notFound' | 'wrapped';
    /** Number of the current match (1-based, 0 without one) */
    current: number;
    total: number;
    /** The search went backwards (relevant when it wrapped around) */
    previous?: boolean;
}

/** Texts of the search status (from the translations) */
export interface PdfSearchTexts {
    searching: string;
    noMatches: string;
    matches: (current: number, total: number) => string;
    wrappedTop: string;
    wrappedBottom: string;
}

/** The status line of the search: "Match 2 of 5", "No matches", with a note when it continued at the other end */
export function pdfSearchText(status: PdfSearchStatus, query: string, texts: PdfSearchTexts): string {
    if (!query.trim() || status.state === 'idle') return '';
    if (status.state === 'pending' && !status.total) return texts.searching;
    if (status.state === 'notFound' || !status.total) return texts.noMatches;
    const matches = texts.matches(Math.max(1, status.current), status.total);
    if (status.state !== 'wrapped') return matches;
    return `${matches} – ${status.previous ? texts.wrappedTop : texts.wrappedBottom}`;
}

/** File name for the download: the given name, a File's name, the last part of a URL, otherwise "document.pdf" */
export function pdfFileName(source: unknown, fileName?: string, fallback = 'document.pdf'): string {
    const withExtension = (name: string) => (/\.pdf$/i.test(name) ? name : `${name}.pdf`);
    if (fileName) return withExtension(fileName);
    const named = (source as { name?: unknown } | null)?.name;
    if (typeof named === 'string' && named) return withExtension(named);
    if (typeof source === 'string' || source instanceof URL) {
        const text = String(source);
        if (text.startsWith('data:') || text.startsWith('blob:')) return fallback;
        const path = text.split(/[?#]/)[0]!;
        const part = path.split('/').pop() ?? '';
        let last = part;
        try {
            last = decodeURIComponent(part);
        } catch {
            // Malformed escapes: keep the name as written
        }
        if (last) return withExtension(last);
    }
    return fallback;
}

/**
 * The document of a print frame: one image per page, each on a printed page of its own size (CSS named pages; in
 * browsers without them every page takes the size of the first). Sizes in PDF points (1/72 inch).
 */
export function pdfPrintDocument(pages: readonly { url: string; width: number; height: number }[]): string {
    const sizes: string[] = [];
    const images = pages.map(({ url, width, height }) => {
        const size = `${Math.round(width * 100) / 100}pt ${Math.round(height * 100) / 100}pt`;
        let index = sizes.indexOf(size);
        if (index < 0) index = sizes.push(size) - 1;
        return `<img src="${url.replace(/"/g, '&quot;')}" alt="" class="s${index}">`;
    });
    const named = sizes
        .map((size, index) => `@page s${index}{size:${size};margin:0}.s${index}{page:s${index}}`)
        .join('');
    return `<!doctype html><html><head><style>@page{size:${sizes[0] ?? 'auto'};margin:0}${named}html,body{margin:0}img{display:block;width:100%;height:auto;break-after:page}img:last-child{break-after:auto}</style></head><body>${images.join('')}</body></html>`;
}
