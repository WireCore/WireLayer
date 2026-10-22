import {
    addIsoDays,
    dayStrip,
    durationToParts,
    durationUnit,
    formatDuration,
    formatOffset,
    formatTime,
    fromWallIso,
    inTimeRange,
    isoWeek,
    localeDateOrder,
    localeWeekInfo,
    parsePastedRange,
    parsePastedDate,
    parseIsoDuration,
    parseQuarter,
    parseTimeText,
    partsToDuration,
    periodEnd,
    periodPreset,
    periodStart,
    quarterEnd,
    quarterOf,
    quarterStart,
    rowWeekNumber,
    shiftMonth,
    shiftQuarter,
    splitDuration,
    startOfIsoWeekRow,
    timeGridSlots,
    timeSlots,
    timeWithZoneOffset,
    timeZoneLabel,
    timeZoneOffset,
    toIsoDuration,
    toWallIso,
    toZonedIso,
    withZoneOffset,
    zonedTime,
    zonedToInstant,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Framework-neutral date and time logic of @wirecore/wirelayer-recipes (date-time.ts)

describe('ISO weeks', () => {
    it.each([
        ['2026-10-20', 2026, 43],
        ['2026-01-01', 2026, 1],
        ['2027-01-01', 2026, 53],
        ['2024-12-30', 2025, 1],
        ['2021-01-03', 2020, 53],
        ['2026-12-28', 2026, 53],
    ])('%s is week %i/%i', (date, year, week) => {
        expect(isoWeek(date)).toEqual({ year, week });
    });

    it('takes Date objects and the Thursday of a row', () => {
        expect(isoWeek(new Date(2026, 9, 20))).toEqual({ year: 2026, week: 43 });
        // A row starting on Sunday (en-US): the week of its Monday
        expect(rowWeekNumber(dayStrip('2026-10-18', 7))).toBe(43);
        expect(rowWeekNumber(dayStrip('2026-10-19', 7))).toBe(43);
    });

    it('first day and weekend follow the locale', () => {
        expect(localeWeekInfo('de-DE')).toEqual({ firstDay: 1, weekend: [6, 0] });
        expect(localeWeekInfo('en-US').firstDay).toBe(0);
        expect(startOfIsoWeekRow('2026-10-22', 1)).toBe('2026-10-19');
        expect(startOfIsoWeekRow('2026-10-22', 0)).toBe('2026-10-18');
        expect(addIsoDays('2026-10-31', 1)).toBe('2026-11-01');
    });
});

describe('pasted dates', () => {
    const now = new Date(2026, 9, 21);
    it.each([
        ['20.10.2026', 'de-DE', '2026-10-20'],
        ['20.10.26', 'de-DE', '2026-10-20'],
        ['1.2.2027', 'de-DE', '2027-02-01'],
        ['2026-10-20', 'de-DE', '2026-10-20'],
        ['2026/10/20', 'de-DE', '2026-10-20'],
        ['10/20/2026', 'en-US', '2026-10-20'],
        ['20/10/2026', 'en-GB', '2026-10-20'],
        ['20. Oktober 2026', 'de-DE', '2026-10-20'],
        ['Oct 20, 2026', 'en-US', '2026-10-20'],
        ['3. Mär. 2026', 'de-DE', '2026-03-03'],
        ['31.02.2026', 'de-DE', null],
        ['20.13.2026', 'de-DE', null],
        ['morgen', 'de-DE', null],
        ['', 'de-DE', null],
    ])('%s (%s) → %s', (text, locale, expected) => {
        expect(parsePastedDate(text, locale, false, now)).toBe(expected);
    });

    it('reads the time with withTime', () => {
        expect(parsePastedDate('20.10.2026 14:30', 'de-DE', true, now)).toBe('2026-10-20T14:30');
        expect(parsePastedDate('20.10.2026, 9.15 Uhr', 'de-DE', true, now)).toBe('2026-10-20T09:15');
        expect(parsePastedDate('10/20/2026 2:30 PM', 'en-US', true, now)).toBe('2026-10-20T14:30');
        expect(parsePastedDate('2026-10-20T14:30:00', 'de-DE', true, now)).toBe('2026-10-20T14:30');
        expect(parsePastedDate('20.10.2026', 'de-DE', true, now)).toBe('2026-10-20T00:00');
    });

    it('reads ranges in any order', () => {
        expect(parsePastedRange('20.10.2026 – 24.10.2026', 'de-DE', false, now)).toEqual({
            start: '2026-10-20',
            end: '2026-10-24',
        });
        expect(parsePastedRange('24.10.2026 bis 20.10.2026', 'de-DE')).toEqual({
            start: '2026-10-20',
            end: '2026-10-24',
        });
        expect(parsePastedRange('2026-10-20 - 2026-10-24')).toEqual({ start: '2026-10-20', end: '2026-10-24' });
        expect(parsePastedRange('20.10.2026')).toBeNull();
        expect(localeDateOrder('en-US')).toEqual(['month', 'day', 'year']);
    });
});

describe('values as Date', () => {
    it('Date and offsets become the wall-clock ISO, and back', () => {
        expect(toWallIso(new Date(2026, 9, 20, 14, 30), false)).toBe('2026-10-20');
        expect(toWallIso(new Date(2026, 9, 20, 14, 30), true)).toBe('2026-10-20T14:30');
        expect(toWallIso('2026-10-20T12:30Z', true, 'Europe/Berlin')).toBe('2026-10-20T14:30');
        expect(toWallIso('2026-10-20T14:30', true, 'Europe/Berlin')).toBe('2026-10-20T14:30');
        expect(toWallIso('2026-10-20T14:30', false)).toBe('2026-10-20');
        expect(toWallIso('no date', false)).toBeNull();
        expect(fromWallIso('2026-10-20', { valueType: 'date' })).toEqual(new Date(2026, 9, 20));
        expect(fromWallIso('2026-10-20T14:30', { withTime: true, timeZone: 'Europe/Berlin' })).toBe(
            '2026-10-20T14:30+02:00'
        );
        expect(
            (
                fromWallIso('2026-10-20T14:30', {
                    withTime: true,
                    timeZone: 'Europe/Berlin',
                    valueType: 'date',
                }) as Date
            ).toISOString()
        ).toBe('2026-10-20T12:30:00.000Z');
        expect(fromWallIso(null)).toBeNull();
    });
});

describe('quarters and period presets', () => {
    it('reads, shifts and spans quarters', () => {
        expect(quarterOf('2026-10-20')).toBe('2026-Q4');
        expect(parseQuarter('Q4 2026')).toEqual({ year: 2026, quarter: 4 });
        expect(parseQuarter('2026-Q1')).toEqual({ year: 2026, quarter: 1 });
        expect(parseQuarter('3/2026')).toEqual({ year: 2026, quarter: 3 });
        expect(parseQuarter('2. Quartal 2026')).toEqual({ year: 2026, quarter: 2 });
        expect(parseQuarter('Q5 2026')).toBeNull();
        expect(quarterStart('2026-Q4')).toBe('2026-10-01');
        expect(quarterEnd('2026-Q1')).toBe('2026-03-31');
        expect(shiftQuarter('2026-Q4', 1)).toBe('2027-Q1');
        expect(shiftQuarter('2026-Q1', -1)).toBe('2025-Q4');
        expect(shiftMonth('2026-01', -1)).toBe('2025-12');
        expect(periodStart('2026', 'year')).toBe('2026-01-01');
        expect(periodEnd('2028-02', 'month')).toBe('2028-02-29');
    });

    it('presets give ranges in the period format', () => {
        const today = '2026-10-21';
        expect(periodPreset('thisQuarter', 'quarter', today)).toEqual({ start: '2026-Q4', end: '2026-Q4' });
        expect(periodPreset('lastQuarter', 'quarter', today)).toEqual({ start: '2026-Q3', end: '2026-Q3' });
        expect(periodPreset('lastQuarter', 'month', today)).toEqual({ start: '2026-07', end: '2026-09' });
        expect(periodPreset('thisYear', 'month', today)).toEqual({ start: '2026-01', end: '2026-12' });
        expect(periodPreset('last12Months', 'month', today)).toEqual({ start: '2025-11', end: '2026-10' });
        expect(periodPreset('last4Quarters', 'quarter', today)).toEqual({ start: '2026-Q1', end: '2026-Q4' });
        expect(periodPreset('lastYear', 'year', today)).toEqual({ start: '2025', end: '2025' });
        expect(periodPreset('last3Years', 'year', today)).toEqual({ start: '2024', end: '2026' });
        expect(periodPreset('lastMonth', 'year', today)).toBeNull();
        expect(periodPreset('lastQuarter', 'quarter', '2026-02-10')).toEqual({ start: '2025-Q4', end: '2025-Q4' });
    });
});

describe('times', () => {
    it('lists, reads and formats times', () => {
        expect(timeSlots(30, '09:00', '10:30')).toEqual(['09:00', '09:30', '10:00', '10:30']);
        expect(timeSlots(15, '09:00', '09:30', true)).toEqual(['09:00:00', '09:15:00', '09:30:00']);
        expect(parseTimeText('1430')).toBe('14:30');
        expect(parseTimeText('2:30 PM')).toBe('14:30');
        expect(parseTimeText('12:15 am')).toBe('00:15');
        expect(parseTimeText('14.30 Uhr')).toBe('14:30');
        expect(parseTimeText('14:30:15', true)).toBe('14:30:15');
        expect(parseTimeText('25:00')).toBeNull();
        expect(formatTime('14:30', 'de-DE')).toBe('14:30');
        expect(formatTime('14:30', 'de-DE', { hourCycle: 'h12' })).toMatch(/^02:30\s?PM$/);
        expect(formatTime('14:30:15', 'de-DE', { withSeconds: true })).toBe('14:30:15');
    });

    it('slots for bookings stop before the end; ranges include both ends', () => {
        expect(timeGridSlots('09:00', '11:00', 30)).toEqual(['09:00', '09:30', '10:00', '10:30']);
        expect(timeGridSlots('09:00', '09:00', 30)).toEqual([]);
        expect(inTimeRange('10:00', { start: '09:30', end: '10:30' })).toBe(true);
        expect(inTimeRange('11:00', { start: '09:30', end: '10:30' })).toBe(false);
        expect(inTimeRange('09:30', { start: '09:30', end: null })).toBe(true);
    });
});

describe('time zones', () => {
    it('offsets and wall-clock times', () => {
        expect(timeZoneOffset(new Date('2026-07-01T12:00Z'), 'Europe/Berlin')).toBe(120);
        expect(timeZoneOffset(new Date('2026-01-01T12:00Z'), 'Europe/Berlin')).toBe(60);
        expect(timeZoneOffset(new Date('2026-01-01T12:00Z'), 'Asia/Kolkata')).toBe(330);
        expect(timeZoneOffset(new Date('2026-01-01T12:00Z'), 'America/New_York')).toBe(-300);
        expect(toZonedIso(new Date('2026-10-20T12:30Z'), 'Europe/Berlin')).toBe('2026-10-20T14:30');
        expect(toZonedIso(new Date('2026-12-31T23:30Z'), 'Asia/Tokyo')).toBe('2027-01-01T08:30');
        expect(formatOffset(-330)).toBe('-05:30');
        expect(formatOffset(0)).toBe('Z');
        expect(withZoneOffset('2026-10-20T14:30', 'UTC')).toBe('2026-10-20T14:30Z');
        expect(withZoneOffset('2026-01-20T14:30', 'Asia/Kolkata')).toBe('2026-01-20T14:30+05:30');
    });

    it('spring forward: a time in the gap moves on by the gap', () => {
        // Berlin, 29.03.2026: 02:00 → 03:00
        expect(zonedToInstant('2026-03-29T01:59', 'Europe/Berlin').toISOString()).toBe('2026-03-29T00:59:00.000Z');
        expect(zonedToInstant('2026-03-29T02:30', 'Europe/Berlin').toISOString()).toBe('2026-03-29T01:30:00.000Z');
        expect(withZoneOffset('2026-03-29T02:30', 'Europe/Berlin')).toBe('2026-03-29T03:30+02:00');
        expect(zonedToInstant('2026-03-29T03:00', 'Europe/Berlin').toISOString()).toBe('2026-03-29T01:00:00.000Z');
        // New York, 08.03.2026: 02:00 → 03:00
        expect(withZoneOffset('2026-03-08T02:15', 'America/New_York')).toBe('2026-03-08T03:15-04:00');
    });

    it('fall back: a time in the overlap is the earlier one', () => {
        // Berlin, 25.10.2026: 03:00 → 02:00, 02:30 exists twice
        expect(zonedToInstant('2026-10-25T02:30', 'Europe/Berlin').toISOString()).toBe('2026-10-25T00:30:00.000Z');
        expect(withZoneOffset('2026-10-25T02:30', 'Europe/Berlin')).toBe('2026-10-25T02:30+02:00');
        expect(withZoneOffset('2026-10-25T03:30', 'Europe/Berlin')).toBe('2026-10-25T03:30+01:00');
        expect(toZonedIso(new Date('2026-10-25T01:30Z'), 'Europe/Berlin')).toBe('2026-10-25T02:30');
        expect(withZoneOffset('2026-11-01T01:30', 'America/New_York')).toBe('2026-11-01T01:30-04:00');
    });

    it('times of day carry the offset of their date', () => {
        expect(timeWithZoneOffset('14:30', 'Europe/Berlin', '2026-07-01')).toBe('14:30+02:00');
        expect(timeWithZoneOffset('14:30', 'Europe/Berlin', '2026-01-01')).toBe('14:30+01:00');
        expect(zonedTime('12:30Z', 'Europe/Berlin', '2026-07-01')).toBe('14:30');
        expect(zonedTime('14:30', 'Europe/Berlin', '2026-07-01')).toBe('14:30');
        expect(timeZoneLabel('Europe/Berlin', 'de-DE', new Date('2026-07-01T12:00Z'))).toBe('MESZ');
        expect(timeZoneLabel('Nowhere/Place')).toBe('Nowhere/Place');
    });
});

describe('durations', () => {
    it('reads and writes ISO 8601', () => {
        expect(parseIsoDuration('PT2H30M')).toEqual({ days: 0, hours: 2, minutes: 30, seconds: 0 });
        expect(parseIsoDuration('P1DT2H')).toEqual({ days: 1, hours: 2, minutes: 0, seconds: 0 });
        expect(parseIsoDuration('PT90M')).toEqual({ days: 0, hours: 1, minutes: 30, seconds: 0 });
        expect(parseIsoDuration('P1W')).toEqual({ days: 7, hours: 0, minutes: 0, seconds: 0 });
        expect(parseIsoDuration('P1M')).toBeNull();
        expect(parseIsoDuration('PT')).toBeNull();
        expect(toIsoDuration({ days: 0, hours: 26, minutes: 5, seconds: 0 })).toBe('PT26H5M');
        expect(toIsoDuration({ days: 1, hours: 0, minutes: 0, seconds: 0 })).toBe('P1D');
        expect(toIsoDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 })).toBe('PT0S');
    });

    it('converts minutes, seconds and ISO; hours go past 24 without days', () => {
        expect(durationToParts(1590, 'minutes')).toEqual({ days: 0, hours: 26, minutes: 30, seconds: 0 });
        expect(durationToParts(1590, 'minutes', true)).toEqual({ days: 1, hours: 2, minutes: 30, seconds: 0 });
        expect(durationToParts(3725, 'seconds')).toEqual({ days: 0, hours: 1, minutes: 2, seconds: 5 });
        expect(durationToParts('P1DT1H', 'iso')).toEqual({ days: 0, hours: 25, minutes: 0, seconds: 0 });
        expect(durationToParts(null)).toBeNull();
        const parts = splitDuration(9000);
        expect(partsToDuration(parts, 'minutes')).toBe(150);
        expect(partsToDuration(parts, 'seconds')).toBe(9000);
        expect(partsToDuration(parts, 'iso')).toBe('PT2H30M');
    });

    it('formats for the eye and the ear', () => {
        const parts = { days: 0, hours: 2, minutes: 30, seconds: 0 };
        expect(formatDuration(parts, 'de-DE')).toBe('2 Stunden 30 Minuten');
        expect(formatDuration({ ...parts, hours: 1, minutes: 1 }, 'de-DE')).toBe('1 Stunde 1 Minute');
        expect(formatDuration(parts, 'en-US')).toBe('2 hours 30 minutes');
        expect(formatDuration(parts, 'de-DE', 'short')).toBe('2 Std. 30 Min.');
        expect(formatDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 }, 'de-DE')).toBe('0 Minuten');
        expect(durationUnit(2, 'hour', 'de-DE', 'short')).toBe('Std.');
    });
});
