// Phone numbers for PhoneInput: country codes, formatting per country, E.164 and a length check.
// A small, extendable table of common countries – no full numbering plan (that would need libphonenumber).

import { defaultLocale } from './i18n.js';

export interface PhoneCountry {
    /** ISO 3166-1 alpha-2, e.g. "DE" */
    code: string;
    /** Country calling code without "+", e.g. "49" */
    dial: string;
    /** Grouping of the national number: "x" is a digit, other characters are kept, e.g. "xxx xxxxxxxx" */
    pattern: string;
    /** Fewest and most digits of the national number (without trunk prefix) */
    length: [min: number, max: number];
    /** National trunk prefix that is dropped in the international format (default "0"; "" when kept or none) */
    trunk?: string;
}

const country = (code: string, dial: string, pattern: string, min: number, max: number, trunk?: string) =>
    ({ code, dial, pattern, length: [min, max], ...(trunk === undefined ? {} : { trunk }) }) satisfies PhoneCountry;

/** About 60 common countries; extend with PhoneInput's `countries` */
export const phoneCountries: PhoneCountry[] = [
    country('DE', '49', 'xxx xxxxxxxx', 6, 11),
    country('AT', '43', 'xxx xxxxxxx', 6, 13),
    country('CH', '41', 'xx xxx xx xx', 9, 9),
    country('LI', '423', 'xxx xx xx', 7, 9, ''),
    country('LU', '352', 'xxx xxx xxx', 6, 11, ''),
    country('FR', '33', 'x xx xx xx xx', 9, 9),
    country('BE', '32', 'xxx xx xx xx', 8, 9),
    country('NL', '31', 'x xxxxxxxx', 9, 9),
    country('IT', '39', 'xxx xxx xxxx', 6, 11, ''),
    country('ES', '34', 'xxx xx xx xx', 9, 9, ''),
    country('PT', '351', 'xxx xxx xxx', 9, 9, ''),
    country('GB', '44', 'xxxx xxxxxx', 9, 10),
    country('IE', '353', 'xx xxx xxxx', 7, 9),
    country('DK', '45', 'xx xx xx xx', 8, 8, ''),
    country('SE', '46', 'xx xxx xx xx', 7, 10),
    country('NO', '47', 'xxx xx xxx', 8, 8, ''),
    country('FI', '358', 'xx xxx xxxx', 5, 12),
    country('IS', '354', 'xxx xxxx', 7, 9, ''),
    country('PL', '48', 'xxx xxx xxx', 9, 9, ''),
    country('CZ', '420', 'xxx xxx xxx', 9, 9, ''),
    country('SK', '421', 'xxx xxx xxx', 9, 9),
    country('HU', '36', 'xx xxx xxxx', 8, 9, '06'),
    country('SI', '386', 'xx xxx xxx', 8, 8),
    country('HR', '385', 'xx xxx xxxx', 8, 9),
    country('RS', '381', 'xx xxx xxxx', 8, 9),
    country('RO', '40', 'xxx xxx xxx', 9, 9),
    country('BG', '359', 'xx xxx xxxx', 8, 9),
    country('GR', '30', 'xxx xxx xxxx', 10, 10, ''),
    country('CY', '357', 'xx xxxxxx', 8, 8, ''),
    country('MT', '356', 'xxxx xxxx', 8, 8, ''),
    country('EE', '372', 'xxxx xxxx', 7, 8, ''),
    country('LV', '371', 'xx xxx xxx', 8, 8, ''),
    country('LT', '370', 'xxx xxxxx', 8, 8, '8'),
    country('UA', '380', 'xx xxx xx xx', 9, 9),
    country('TR', '90', 'xxx xxx xx xx', 10, 10),
    country('RU', '7', 'xxx xxx-xx-xx', 10, 10, '8'),
    country('IL', '972', 'xx-xxx-xxxx', 8, 9),
    country('AE', '971', 'xx xxx xxxx', 8, 9),
    country('SA', '966', 'xx xxx xxxx', 9, 9),
    country('QA', '974', 'xxxx xxxx', 8, 8, ''),
    country('EG', '20', 'xxx xxx xxxx', 9, 10),
    country('MA', '212', 'xxx-xxxxxx', 9, 9),
    country('NG', '234', 'xxx xxx xxxx', 10, 10),
    country('KE', '254', 'xxx xxxxxx', 9, 9),
    country('ZA', '27', 'xx xxx xxxx', 9, 9),
    country('US', '1', '(xxx) xxx-xxxx', 10, 10, ''),
    country('CA', '1', '(xxx) xxx-xxxx', 10, 10, ''),
    country('MX', '52', 'xx xxxx xxxx', 10, 10, ''),
    country('BR', '55', 'xx xxxxx-xxxx', 10, 11),
    country('AR', '54', 'xx xxxx-xxxx', 10, 11),
    country('CL', '56', 'x xxxx xxxx', 9, 9, ''),
    country('CO', '57', 'xxx xxx xxxx', 10, 10, ''),
    country('PE', '51', 'xxx xxx xxx', 8, 9, ''),
    country('AU', '61', 'x xxxx xxxx', 9, 9),
    country('NZ', '64', 'xx xxx xxxx', 8, 10),
    country('JP', '81', 'xx-xxxx-xxxx', 9, 10),
    country('KR', '82', 'xx-xxxx-xxxx', 9, 10),
    country('CN', '86', 'xxx xxxx xxxx', 11, 11, ''),
    country('HK', '852', 'xxxx xxxx', 8, 8, ''),
    country('TW', '886', 'xxx xxx xxx', 9, 9),
    country('SG', '65', 'xxxx xxxx', 8, 8, ''),
    country('IN', '91', 'xxxxx xxxxx', 10, 10),
    country('TH', '66', 'xx xxx xxxx', 8, 9),
    country('VN', '84', 'xxx xxx xxxx', 9, 10),
    country('ID', '62', 'xxx-xxxx-xxxx', 9, 12),
    country('MY', '60', 'xx-xxx xxxx', 9, 10),
    country('PH', '63', 'xxx xxx xxxx', 10, 10),
];

/** The country with this ISO code (any case) in `countries` */
export function findPhoneCountry(code: string | undefined, countries: readonly PhoneCountry[] = phoneCountries) {
    const upper = code?.toUpperCase();
    return countries.find((entry) => entry.code === upper);
}

/** Flag emoji of an ISO code ("DE" → 🇩🇪) – regional indicator letters, shown as letters where fonts lack flags */
export function countryFlag(code: string): string {
    return [...code.toUpperCase()].map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65)).join('');
}

/** Name of a country in the locale ("DE" → "Germany"); the code when Intl does not know it */
export function countryName(code: string, locale: string): string {
    try {
        return new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? code;
    } catch {
        return code;
    }
}

/**
 * Countries matching a search (country picker): by name in the locale, ISO code or calling code ("de", "deu",
 * "+49", "49"), ignoring case and accents; names starting with the text come first, the order stays otherwise
 */
export function searchPhoneCountries(
    query: string,
    countries: readonly PhoneCountry[] = phoneCountries,
    locale = defaultLocale
): PhoneCountry[] {
    const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
    const text = fold(query.trim());
    if (!text) return [...countries];
    const dial = text.replace(/^\+|^00/, '');
    const scored = countries.flatMap((entry, index) => {
        const name = fold(countryName(entry.code, locale));
        const rank =
            entry.code.toLowerCase() === text || (/^\d+$/.test(dial) && entry.dial === dial)
                ? 0
                : name.startsWith(text)
                  ? 1
                  : name.includes(text) || (/^\d+$/.test(dial) && entry.dial.startsWith(dial))
                    ? 2
                    : -1;
        return rank < 0 ? [] : [{ entry, rank, index }];
    });
    return scored.sort((a, b) => a.rank - b.rank || a.index - b.index).map(({ entry }) => entry);
}

/** Digits of a national number as typed: other characters and the trunk prefix ("0") dropped */
export function nationalDigits(text: string, country: PhoneCountry): string {
    const digits = text.replace(/\D/g, '');
    const trunk = country.trunk ?? '0';
    return trunk && digits.startsWith(trunk) ? digits.slice(trunk.length) : digits;
}

/** Groups national digits by the country's pattern ("30123456" → "301 23456"); extra digits are appended */
export function formatPhoneNumber(digits: string, country: PhoneCountry): string {
    let index = 0;
    let result = '';
    for (const char of country.pattern) {
        if (index >= digits.length) break;
        if (char === 'x') result += digits[index++];
        else result += char;
    }
    return (result + digits.slice(index)).replace(/[^\d)]+$/, '');
}

/** "+49 30 123456" style international number in E.164 ("+4930123456"); "" without digits */
export function toE164(digits: string, country: PhoneCountry): string {
    return digits ? `+${country.dial}${digits}` : '';
}

/** Number of national digits fits the country's range */
export function isValidPhoneNumber(digits: string, country: PhoneCountry): boolean {
    return /^\d+$/.test(digits) && digits.length >= country.length[0] && digits.length <= country.length[1];
}

/**
 * Splits a number into country and national digits: international ("+49…", "0049…") by the longest matching
 * calling code – shared codes (+1) keep `fallback` when it has that code; national numbers belong to `fallback`.
 * An international start without a known code yet ("+4") is `pending`.
 */
export function parsePhoneNumber(
    text: string,
    fallback: PhoneCountry,
    countries: readonly PhoneCountry[] = phoneCountries
): { country: PhoneCountry; digits: string; pending?: boolean } {
    const trimmed = text.trim();
    const international = trimmed.startsWith('+') || trimmed.startsWith('00');
    if (!international) return { country: fallback, digits: nationalDigits(trimmed, fallback) };
    const all = trimmed.replace(/\D/g, '').replace(/^00/, '');
    for (let size = 3; size >= 1; size--) {
        const dial = all.slice(0, size);
        const matching = countries.filter((entry) => entry.dial === dial);
        if (!matching.length) continue;
        const chosen = matching.find((entry) => entry.code === fallback.code) ?? matching[0]!;
        return { country: chosen, digits: all.slice(size) };
    }
    // No calling code (yet), e.g. while typing "+4": `pending`, the text stays as typed
    return { country: fallback, digits: '', pending: true };
}

/** Caret position in formatted text right after the `digits`-th digit (keeps the caret while formatting) */
export function caretAfterDigits(formatted: string, digits: number): number {
    if (digits <= 0) return 0;
    let seen = 0;
    for (let index = 0; index < formatted.length; index++) {
        if (/\d/.test(formatted[index]!) && ++seen === digits) return index + 1;
    }
    return formatted.length;
}

/** An example number in the country's format as placeholder ("030 12345678" style: 1, 2, 3 …) */
export function phonePlaceholder(country: PhoneCountry): string {
    const digits = Array.from({ length: country.length[1] }, (_, index) => String((index + 1) % 10)).join('');
    return formatPhoneNumber(digits, country);
}
