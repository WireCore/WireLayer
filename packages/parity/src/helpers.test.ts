import { highlightChunks, scrollEdges, snapToMarks } from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Framework-free helpers of the display and navigation components

describe('highlightChunks', () => {
    const marked = (chunks: ReturnType<typeof highlightChunks>) =>
        chunks.filter((chunk) => chunk.match).map((chunk) => `${chunk.text}#${chunk.term}`);

    it('marks every hit, ignoring case, and keeps the text in between', () => {
        const chunks = highlightChunks('Server web-01, Backup-Server', 'server');
        expect(chunks.map((chunk) => chunk.text).join('')).toBe('Server web-01, Backup-Server');
        expect(marked(chunks)).toEqual(['Server#0', 'Server#0']);
        expect(marked(highlightChunks('a b a', 'a', { matchAll: false }))).toEqual(['a#0']);
        expect(marked(highlightChunks('Server', 'server', { ignoreCase: false }))).toEqual([]);
    });

    it('only marks whole words when asked', () => {
        expect(marked(highlightChunks('Webserver and Server', 'server', { wholeWord: true }))).toEqual(['Server#0']);
        expect(marked(highlightChunks('Größe: groß', 'groß', { wholeWord: true }))).toEqual(['groß#0']);
    });

    it('finds words regardless of accents and keeps the original spelling', () => {
        const chunks = highlightChunks('Müller and Muller', 'muller', { ignoreAccents: true });
        expect(marked(chunks)).toEqual(['Müller#0', 'Muller#0']);
        expect(marked(highlightChunks('Café', 'cafe', { ignoreAccents: true }))).toEqual(['Café#0']);
        expect(marked(highlightChunks('Müller', 'muller'))).toEqual([]);
    });

    it('tells the search terms apart (for their colours), longer terms first', () => {
        const chunks = highlightChunks('web-01 and web', ['web', 'web-01']);
        expect(marked(chunks)).toEqual(['web-01#1', 'web#0']);
        expect(highlightChunks('Text', ['', ' '])).toEqual([{ text: 'Text', match: false }]);
    });
});

describe('snapToMarks', () => {
    const marks = [0, 25, 50, 100];

    it('takes the nearest mark when dragging', () => {
        expect(snapToMarks([60], [0], marks)).toEqual([50]);
        expect(snapToMarks([90], [0], marks)).toEqual([100]);
    });

    it('moves at least one mark in the direction of a small step (arrow keys)', () => {
        expect(snapToMarks([51], [50], marks)).toEqual([100]);
        expect(snapToMarks([49], [50], marks)).toEqual([25]);
        expect(snapToMarks([101], [100], marks)).toEqual([100]);
        expect(snapToMarks([24, 51], [25, 50], marks)).toEqual([0, 100]);
    });
});

describe('scrollEdges', () => {
    it('knows whether there is more towards the start and the end, also right-to-left', () => {
        expect(scrollEdges({ scrollLeft: 0, clientWidth: 100, scrollWidth: 300 })).toEqual({ start: false, end: true });
        expect(scrollEdges({ scrollLeft: 200, clientWidth: 100, scrollWidth: 300 })).toEqual({
            start: true,
            end: false,
        });
        expect(scrollEdges({ scrollLeft: -50, clientWidth: 100, scrollWidth: 300 })).toEqual({
            start: true,
            end: true,
        });
        expect(scrollEdges({ scrollLeft: 0, clientWidth: 100, scrollWidth: 100 })).toEqual({
            start: false,
            end: false,
        });
    });
});
