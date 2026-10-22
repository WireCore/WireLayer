import '@testing-library/jest-dom/vitest';
import { cleanup as cleanupReact } from '@testing-library/react';
import { cleanup as cleanupVue } from '@testing-library/vue';
import { afterEach, vi } from 'vitest';

// jsdom has no layout APIs; Ark's positioning (Select, Menu, Tooltip …) needs these to exist.
// (Not in the SSR test, which runs without a DOM.)
globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
};
// Ark's carousel tracks the slides in view
globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
} as unknown as typeof IntersectionObserver;
// Chart: no canvas drawing in jsdom (the data table still renders), reduced motion is queried
if (typeof HTMLCanvasElement !== 'undefined') HTMLCanvasElement.prototype.getContext = () => null;
if (typeof window !== 'undefined')
    window.matchMedia ??= (query: string) =>
        ({
            matches: false,
            media: query,
            addEventListener() {},
            removeEventListener() {},
        }) as unknown as MediaQueryList;
if (typeof Element !== 'undefined') Element.prototype.scrollTo ??= () => {};
// The editor (ProseMirror) measures the selection when it scrolls it into view
if (typeof Range !== 'undefined') {
    Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList;
    Range.prototype.getBoundingClientRect ??= () => new DOMRect();
}
// Resize handles (Splitter, AppShell) capture the pointer while dragging
if (typeof Element !== 'undefined') {
    Element.prototype.setPointerCapture ??= () => {};
    Element.prototype.releasePointerCapture ??= () => {};
    Element.prototype.hasPointerCapture ??= () => false;
}

// PdfViewer: pdf.js is a stub whose documents never finish loading – the DOM and axe cases see the loading state the
// server renders, every time (the real viewer is tested in the browser, e2e/pdf.spec.ts)
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
    GlobalWorkerOptions: {},
    AnnotationMode: { DISABLE: 0, ENABLE: 1, ENABLE_FORMS: 2, ENABLE_STORAGE: 3 },
    PasswordResponses: { NEED_PASSWORD: 1, INCORRECT_PASSWORD: 2 },
    getDocument: () => ({ promise: new Promise(() => {}), destroy: async () => {} }),
}));
vi.mock('pdfjs-dist/legacy/web/pdf_viewer.mjs', () => {
    class Stub {
        on() {}
        dispatch() {}
        setViewer() {}
        setDocument() {}
    }
    return { EventBus: Stub, PDFLinkService: Stub, PDFFindController: Stub, PDFViewer: Stub, LinkTarget: { BLANK: 2 } };
});

afterEach(() => {
    cleanupReact();
    cleanupVue();
});
