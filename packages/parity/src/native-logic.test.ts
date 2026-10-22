import {
    namedDateRange,
    paginationItems,
    qrCodePath,
    responsiveColumnCount,
    watermarkBackground,
    watermarkTile,
    phoneCountries,
    pinInputChange,
    pointsToPath,
    searchPhoneCountries,
    signatureSvg,
    UploadQueue,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Shared logic added for the React Native components (@wirecore/wirelayer-native) – framework-neutral in @wirecore/wirelayer-recipes

describe('pin input boxes', () => {
    it('a typed character fills the box and moves on; the wrong type is dropped', () => {
        expect(pinInputChange([], 0, '4', 4)).toEqual({ chars: ['4', '', '', ''], focus: 1 });
        expect(pinInputChange(['4', '', '', ''], 1, 'x', 4)).toEqual({ chars: ['4', '', '', ''], focus: 1 });
        expect(pinInputChange(['4', '', '', ''], 1, 'x', 4, 'alphanumeric')).toEqual({
            chars: ['4', 'x', '', ''],
            focus: 2,
        });
        expect(pinInputChange([], 0, 'ä', 2, 'alphabetic').chars).toEqual(['ä', '']);
    });

    it('typing into a filled box keeps the new character, a pasted code fills from there', () => {
        expect(pinInputChange(['1', '2', '3', '4'], 1, '27', 4)).toEqual({ chars: ['1', '7', '3', '4'], focus: 2 });
        expect(pinInputChange(['1', '2', '3', '4'], 1, '72', 4)).toEqual({ chars: ['1', '7', '3', '4'], focus: 2 });
        expect(pinInputChange([], 0, '123 456', 6)).toEqual({ chars: ['1', '2', '3', '4', '5', '6'], focus: 5 });
        // Longer than the rest of the boxes: cut off, the focus stays on the last box
        expect(pinInputChange([], 2, '98765', 4)).toEqual({ chars: ['', '', '9', '8'], focus: 3 });
    });

    it('an emptied box stays empty in the middle', () => {
        expect(pinInputChange(['1', '2', '3', '4'], 1, '', 4)).toEqual({ chars: ['1', '', '3', '4'], focus: 1 });
    });
});

describe('phone country search', () => {
    it('finds by name in the locale, code and calling code; name starts first', () => {
        expect(searchPhoneCountries('öster', phoneCountries, 'de-DE').map((entry) => entry.code)).toEqual(['AT']);
        expect(searchPhoneCountries('aus', phoneCountries, 'en-US')[0]?.code).toBe('AT');
        expect(searchPhoneCountries('de', phoneCountries, 'de-DE')[0]?.code).toBe('DE');
        expect(searchPhoneCountries('+41', phoneCountries, 'de-DE')[0]?.code).toBe('CH');
        expect(searchPhoneCountries('0043', phoneCountries, 'de-DE')[0]?.code).toBe('AT');
        expect(searchPhoneCountries('', phoneCountries)).toHaveLength(phoneCountries.length);
        expect(searchPhoneCountries('xyz', phoneCountries)).toEqual([]);
    });
});

describe('signature strokes', () => {
    it('points become a path of lines, a single point a dot', () => {
        expect(
            pointsToPath([
                { x: 1.04, y: 2 },
                { x: 3, y: 4.56 },
            ])
        ).toBe('M1 2 L3 4.6');
        expect(pointsToPath([{ x: 5, y: 5 }])).toBe('M5 5 L5 5');
        expect(pointsToPath([])).toBe('');
    });

    it('strokes become an SVG data URL with the ink colour; nothing without strokes', () => {
        const url = signatureSvg(['M1 2 L3 4'], { width: 300, height: 120, color: '#123456' });
        const svg = decodeURIComponent(url.replace('data:image/svg+xml;charset=utf-8,', ''));
        expect(svg).toContain('viewBox="0 0 300 120"');
        expect(svg).toContain('stroke="#123456"');
        expect(svg).toContain('<path d="M1 2 L3 4"/>');
        expect(signatureSvg([], { width: 300, height: 120 })).toBe('');
    });
});

describe('named date ranges', () => {
    const today = '2026-10-21'; // a Wednesday
    it('weeks, months, quarters and years around today', () => {
        expect(namedDateRange('thisWeek', today)).toEqual({ start: '2026-10-19', end: '2026-10-25' });
        expect(namedDateRange('thisWeek', today, 0)).toEqual({ start: '2026-10-18', end: '2026-10-24' });
        expect(namedDateRange('lastWeek', today)).toEqual({ start: '2026-10-12', end: '2026-10-18' });
        expect(namedDateRange('thisMonth', today)).toEqual({ start: '2026-10-01', end: '2026-10-31' });
        expect(namedDateRange('lastMonth', today)).toEqual({ start: '2026-09-01', end: '2026-09-30' });
        expect(namedDateRange('thisQuarter', today)).toEqual({ start: '2026-10-01', end: '2026-12-31' });
        expect(namedDateRange('lastQuarter', today)).toEqual({ start: '2026-07-01', end: '2026-09-30' });
        expect(namedDateRange('lastYear', today)).toEqual({ start: '2025-01-01', end: '2025-12-31' });
    });

    it('the last N days end today; the presets of presetDateRange and unknown names', () => {
        expect(namedDateRange('last7Days', today)).toEqual({ start: '2026-10-15', end: '2026-10-21' });
        expect(namedDateRange('last3Months', today)).toEqual({ start: '2026-08-01', end: '2026-10-31' });
        expect(namedDateRange('nextWeek', today)).toBeNull();
    });
});

describe('upload queue with other file objects', () => {
    it('React Native files ({ uri, name }) upload with progress like browser files', async () => {
        const file = { uri: 'file:///a.pdf', name: 'a.pdf' };
        const states: string[] = [];
        const queue = new UploadQueue<typeof file>(
            async (_file, { onProgress }) => {
                onProgress(50);
            },
            (map) => states.push(`${map.get(file)?.status}:${map.get(file)?.progress}`)
        );
        queue.add([file]);
        await queue.start(file);
        expect(states).toEqual(['pending:0', 'uploading:0', 'uploading:50', 'done:100']);
    });
});

describe('pagination items', () => {
    it('boundaries, siblings and gaps; a gap of one page shows the page', () => {
        expect(paginationItems(1, 24)).toEqual([1, 2, 'ellipsis', 24]);
        expect(paginationItems(5, 24)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 24]);
        expect(paginationItems(3, 24)).toEqual([1, 2, 3, 4, 'ellipsis', 24]);
        expect(paginationItems(24, 24, 1, 2)).toEqual([1, 2, 'ellipsis', 23, 24]);
        expect(paginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('a single page and pages out of range', () => {
        expect(paginationItems(1, 1)).toEqual([1]);
        expect(paginationItems(9, 0)).toEqual([1]);
        expect(paginationItems(30, 5, 0, 1)).toEqual([1, 'ellipsis', 5]);
    });
});

describe('QR code path', () => {
    it('one rectangle per run of dark modules in a row', () => {
        expect(
            qrCodePath([
                [true, true, false, true],
                [false, false, false, false],
                [false, true, true, true],
            ])
        ).toBe('M0,0h2v1h-2zM3,0h1v1h-1zM1,2h3v1h-3z');
        expect(qrCodePath([[false]])).toBe('');
    });
});

describe('responsive column count', () => {
    it('takes the largest breakpoint the width reaches', () => {
        const columns = { base: 1, sm: 2, lg: 3 };
        expect(responsiveColumnCount(columns, 390)).toBe(1);
        expect(responsiveColumnCount(columns, 700)).toBe(2);
        expect(responsiveColumnCount(columns, 1100)).toBe(3);
        expect(responsiveColumnCount(4, 200)).toBe(4);
        expect(responsiveColumnCount({ md: 2 }, 500)).toBe(1);
    });
});

describe('watermark tile', () => {
    it('measures text lines and images like the web background', () => {
        expect(watermarkTile({ text: ['Draft', 'North Utilities'], fontSize: 10, gap: [20, 10] })).toMatchObject({
            width: Math.ceil(15 * 6 + 20),
            height: Math.ceil(2 * 14 + 10),
            lines: ['Draft', 'North Utilities'],
        });
        expect(watermarkTile({ image: 'logo.png' })).toMatchObject({ width: 120 + 96, height: 64 + 72 });
        // The web background keeps its size
        expect(watermarkBackground({ text: 'Draft' }).backgroundSize).toBe(
            `${watermarkTile({ text: 'Draft' }).width}px ${watermarkTile({ text: 'Draft' }).height}px`
        );
    });
});
