import { maskIsComplete, maskIsNumeric, maskPlaceholder, maskValue, unmaskValue } from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

describe('mask helpers', () => {
    const iban = 'DE99 9999 9999 9999 9999 99';

    it('inserts separators and prefixes while typing', () => {
        expect(maskValue('89', iban)).toBe('DE89');
        expect(maskValue('891', iban)).toBe('DE89 1');
        expect(maskValue('DE89 1234', iban)).toBe('DE89 1234');
        expect(maskValue('89123412341234123412', iban)).toBe('DE89 1234 1234 1234 1234 12');
    });

    it('skips characters that do not fit and keeps typed separators', () => {
        expect(maskValue('12a34', '99/99')).toBe('12/34');
        expect(maskValue('12/', '99/99')).toBe('12/');
        expect(maskValue('ma12', 'aa-99')).toBe('ma-12');
        expect(maskValue('m1a', 'aa-99')).toBe('ma');
    });

    it('escapes token characters with a backslash', () => {
        expect(maskValue('1701234567', '+4\\9 999 9999999')).toBe('+49 170 1234567');
        expect(maskPlaceholder('+4\\9 999')).toBe('+49 ___');
        expect(maskIsNumeric('+4\\9 999')).toBe(true);
        expect(maskIsNumeric('aa-99')).toBe(false);
    });

    it('returns only the typed characters', () => {
        expect(unmaskValue('DE89 1234', iban)).toBe('891234');
        expect(unmaskValue('+49 170', '+4\\9 999')).toBe('170');
    });

    it('knows when every required slot is filled; the rest after ? is optional', () => {
        expect(maskIsComplete('1234', '99999')).toBe(false);
        expect(maskIsComplete('12345', '99999')).toBe(true);
        expect(maskValue('123456789', '99999?-9999')).toBe('12345-6789');
        expect(maskValue('12345', '99999?-9999')).toBe('12345');
        expect(maskIsComplete('12345', '99999?-9999')).toBe(true);
        expect(maskIsComplete('12345-67', '99999?-9999')).toBe(true);
        expect(maskPlaceholder('99999?-9999')).toBe('_____-____');
        // An escaped question mark stays a character
        expect(maskValue('12', '9\\?9')).toBe('1?2');
    });

    it('uses its own slot character and tokens', () => {
        expect(maskPlaceholder('99/99', '#')).toBe('##/##');
        const hex = { h: /[0-9a-f]/i };
        expect(maskValue('fzz9a', 'hh-hh', hex)).toBe('f9-a');
        expect(maskIsNumeric('hh', hex)).toBe(false);
        expect(unmaskValue('f9-a', 'hh-hh', hex)).toBe('f9a');
        expect(maskIsComplete('f9-ab', 'hh-hh', hex)).toBe(true);
    });
});
