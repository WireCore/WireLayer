// @vitest-environment node
import { readFileSync } from 'node:fs';
import {
    clampPdfPage,
    clampPdfZoom,
    normalizePdfRotation,
    parsePdfPage,
    pdfFileName,
    pdfKeyAction,
    pdfPrintDocument,
    pdfSearchText,
    pdfThumbnailSize,
    pdfZoomFromKey,
    pdfZoomKey,
    pdfZoomStep,
    resolvePdfTools,
    translations,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// PdfViewer logic without pdf.js: zoom steps, page numbers, rotation, keyboard, search status, file names

describe('pdf zoom', () => {
    it('steps to the next fixed zoom, from any factor, within 50–400 %', () => {
        expect(pdfZoomStep(1, 1)).toBe(1.25);
        expect(pdfZoomStep(1, -1)).toBe(0.75);
        // From a fitted zoom (e.g. page width at 137 %)
        expect(pdfZoomStep(1.37, 1)).toBe(1.5);
        expect(pdfZoomStep(1.37, -1)).toBe(1.25);
        expect(pdfZoomStep(4, 1)).toBe(4);
        expect(pdfZoomStep(0.5, -1)).toBe(0.5);
        expect(pdfZoomStep(0.2, 1)).toBe(0.5);
        expect(pdfZoomStep(9, -1)).toBe(4);
    });

    it('clamps factors, keeps presets, maps list keys both ways', () => {
        expect(clampPdfZoom(10)).toBe(4);
        expect(clampPdfZoom(0.1)).toBe(0.5);
        expect(clampPdfZoom(Number.NaN)).toBe(1);
        expect(clampPdfZoom('page-fit')).toBe('page-fit');
        expect(pdfZoomKey(1.25)).toBe('1.25');
        expect(pdfZoomFromKey('1.25')).toBe(1.25);
        expect(pdfZoomFromKey('page-width')).toBe('page-width');
        expect(pdfZoomFromKey('99')).toBe(4);
    });
});

describe('pdf pages and rotation', () => {
    it('clamps and parses page numbers', () => {
        expect(clampPdfPage(0, 12)).toBe(1);
        expect(clampPdfPage(13, 12)).toBe(12);
        expect(clampPdfPage(2.6, 12)).toBe(3);
        expect(clampPdfPage(5, 0)).toBe(1);
        expect(parsePdfPage(' 7 ', 12)).toBe(7);
        expect(parsePdfPage('99', 12)).toBe(12);
        expect(parsePdfPage('abc', 12)).toBeNull();
        expect(parsePdfPage('', 12)).toBeNull();
    });

    it('normalises rotations to quarter turns', () => {
        expect(normalizePdfRotation(0)).toBe(0);
        expect(normalizePdfRotation(450)).toBe(90);
        expect(normalizePdfRotation(-90)).toBe(270);
        expect(normalizePdfRotation(100)).toBe(90);
        expect(normalizePdfRotation(Number.NaN)).toBe(0);
    });

    it('thumbnail size follows the page and the rotation', () => {
        expect(pdfThumbnailSize({ width: 595, height: 842 }, 0, 120)).toEqual({ width: 120, height: 170 });
        expect(pdfThumbnailSize({ width: 595, height: 842 }, 90, 120)).toEqual({ width: 120, height: 85 });
    });
});

describe('pdf keyboard', () => {
    it('Ctrl/⌘ zoom and find anywhere in the viewer', () => {
        expect(pdfKeyAction({ key: '+', ctrlKey: true }, false)).toBe('zoomIn');
        expect(pdfKeyAction({ key: '=', metaKey: true }, false)).toBe('zoomIn');
        expect(pdfKeyAction({ key: '-', ctrlKey: true }, true)).toBe('zoomOut');
        expect(pdfKeyAction({ key: '0', ctrlKey: true }, false)).toBe('zoomReset');
        expect(pdfKeyAction({ key: 'f', ctrlKey: true }, false)).toBe('find');
        expect(pdfKeyAction({ key: 'F', metaKey: true }, false)).toBe('find');
        expect(pdfKeyAction({ key: 'f', ctrlKey: true, shiftKey: true }, false)).toBeUndefined();
        expect(pdfKeyAction({ key: 'f', ctrlKey: true, altKey: true }, false)).toBeUndefined();
    });

    it('page keys only in the page area', () => {
        expect(pdfKeyAction({ key: 'PageDown' }, true)).toBe('next');
        expect(pdfKeyAction({ key: 'PageUp' }, true)).toBe('previous');
        expect(pdfKeyAction({ key: 'Home' }, true)).toBe('first');
        expect(pdfKeyAction({ key: 'End' }, true)).toBe('last');
        // In the toolbar Home/End move between the tools, in fields the caret
        expect(pdfKeyAction({ key: 'Home' }, false)).toBeUndefined();
        expect(pdfKeyAction({ key: 'End', shiftKey: true }, true)).toBeUndefined();
        expect(pdfKeyAction({ key: 'ArrowDown' }, true)).toBeUndefined();
    });
});

describe('pdf search status', () => {
    const t = translations.pdfViewer;
    it('counts matches and notes when the search wrapped around', () => {
        expect(pdfSearchText({ state: 'idle', current: 0, total: 0 }, 'x', t)).toBe('');
        expect(pdfSearchText({ state: 'found', current: 1, total: 3 }, '', t)).toBe('');
        expect(pdfSearchText({ state: 'pending', current: 0, total: 0 }, 'Pro', t)).toBe('Searching …');
        expect(pdfSearchText({ state: 'pending', current: 1, total: 2 }, 'Pro', t)).toBe('Match 1 of 2');
        expect(pdfSearchText({ state: 'notFound', current: 0, total: 0 }, 'xyz', t)).toBe('No matches');
        expect(pdfSearchText({ state: 'found', current: 2, total: 3 }, 'Proposal', t)).toBe('Match 2 of 3');
        expect(pdfSearchText({ state: 'wrapped', current: 1, total: 3 }, 'Proposal', t)).toBe(
            'Match 1 of 3 – continued from the start'
        );
        expect(pdfSearchText({ state: 'wrapped', current: 3, total: 3, previous: true }, 'Proposal', t)).toBe(
            'Match 3 of 3 – continued from the end'
        );
    });
});

describe('pdf tools and file names', () => {
    it('resolves the toolbar in its fixed order', () => {
        expect(resolvePdfTools(true)).toHaveLength(8);
        expect(resolvePdfTools(false)).toEqual([]);
        expect(resolvePdfTools(['download', 'page'])).toEqual(['page', 'download']);
    });

    it('names the download after the file, the URL or a fallback', () => {
        expect(pdfFileName('/files/Proposal%202027.pdf?v=2')).toBe('Proposal 2027.pdf');
        expect(pdfFileName('https://example.com/api/doc/42')).toBe('42.pdf');
        expect(pdfFileName(new URL('https://example.com/a/b.pdf#page=2'))).toBe('b.pdf');
        expect(pdfFileName('blob:https://example.com/123')).toBe('document.pdf');
        expect(pdfFileName(new Uint8Array(1))).toBe('document.pdf');
        expect(pdfFileName({ name: 'Scan' }, undefined, 'document.pdf')).toBe('Scan.pdf');
        expect(pdfFileName('/x.pdf', 'Invoice')).toBe('Invoice.pdf');
        expect(pdfFileName('/%E0%A4%A.pdf')).toBe('%E0%A4%A.pdf');
    });
});

describe('pdf engine', () => {
    it('is the same file in @wirecore/wirelayer-vue and @wirecore/wirelayer-react', () => {
        const read = (pkg: string) => readFileSync(new URL(`../../${pkg}/src/pdf/engine.ts`, import.meta.url), 'utf8');
        expect(read('react')).toBe(read('vue'));
    });
});

describe('pdfPrintDocument', () => {
    it('prints every page in its own size (named pages), the first size as default', () => {
        const html = pdfPrintDocument([
            { url: 'blob:a', width: 595.28, height: 841.89 },
            { url: 'blob:b', width: 841.89, height: 595.28 },
            { url: 'blob:c', width: 595.28, height: 841.89 },
        ]);
        expect(html).toContain('@page{size:595.28pt 841.89pt;margin:0}');
        expect(html).toContain('@page s0{size:595.28pt 841.89pt;margin:0}.s0{page:s0}');
        expect(html).toContain('@page s1{size:841.89pt 595.28pt;margin:0}.s1{page:s1}');
        expect(html).toContain(
            '<img src="blob:a" alt="" class="s0"><img src="blob:b" alt="" class="s1"><img src="blob:c" alt="" class="s0">'
        );
    });
});
