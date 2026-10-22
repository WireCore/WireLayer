import { numberInputKey, numberSeparators, parseLocaleNumber } from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

describe('number input helpers', () => {
    it('knows the separators of a locale', () => {
        expect(numberSeparators('de-DE')).toEqual({ decimal: ',', group: '.' });
        expect(numberSeparators('en-US')).toEqual({ decimal: '.', group: ',' });
    });

    it('reads comma and dot as decimal separator in every locale', () => {
        for (const locale of ['de-DE', 'en-US']) {
            expect(parseLocaleNumber('1234,5', locale)).toBe(1234.5);
            expect(parseLocaleNumber('1234.5', locale)).toBe(1234.5);
            expect(parseLocaleNumber('1.234,5', locale)).toBe(1234.5);
            expect(parseLocaleNumber('1,234.5', locale)).toBe(1234.5);
            expect(parseLocaleNumber('0,75', locale)).toBe(0.75);
            expect(parseLocaleNumber('1.234.567', locale)).toBe(1234567);
        }
    });

    it('takes one separator before three digits as group separator only where the locale groups with it', () => {
        expect(parseLocaleNumber('1.500', 'de-DE')).toBe(1500);
        expect(parseLocaleNumber('1,500', 'de-DE')).toBe(1.5);
        expect(parseLocaleNumber('1,500', 'en-US')).toBe(1500);
        expect(parseLocaleNumber('1.500', 'en-US')).toBe(1.5);
    });

    it('ignores currency, units and spaces, keeps the sign and returns null without digits', () => {
        expect(parseLocaleNumber('12.500,00 €', 'de-DE')).toBe(12500);
        expect(parseLocaleNumber('-3,5 kg', 'de-DE')).toBe(-3.5);
        expect(parseLocaleNumber('−2.5', 'en-US')).toBe(-2.5);
        expect(parseLocaleNumber('', 'de-DE')).toBeNull();
        expect(parseLocaleNumber('abc', 'de-DE')).toBeNull();
    });

    it('turns "." and "," into the decimal separator of the locale and blocks what is not allowed', () => {
        expect(numberInputKey('.', '12', 'de-DE')).toEqual({ insert: ',' });
        expect(numberInputKey(',', '12', 'en-US')).toEqual({ insert: '.' });
        expect(numberInputKey('.', '12,5', 'de-DE')).toBe('block');
        expect(numberInputKey(',', '12', 'de-DE', { allowDecimal: false })).toBe('block');
        expect(numberInputKey('-', '12', 'de-DE', { allowNegative: false })).toBe('block');
        expect(numberInputKey('-', '12', 'de-DE')).toBeUndefined();
        expect(numberInputKey('5', '12', 'de-DE')).toBeUndefined();
    });
});
