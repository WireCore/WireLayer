import {
    applyEventChange,
    checkEventDrop,
    closedTimes,
    criticalPath,
    daysRange,
    dependencyCycle,
    dependencyPath,
    describeRecurrence,
    expandRecurrence,
    formatRecurrenceRule,
    ganttRows,
    ganttScale,
    ganttSpans,
    layoutTimeline,
    messages,
    parseICalendar,
    parseLocal,
    parseRecurrenceRule,
    schedulerColumns,
    schedulerDays,
    shiftTask,
    taskDuration,
    timelineOffset,
    timelineSegments,
    timelineTimeAt,
    resourcePage,
    toICalendar,
    vTimeZone,
    withZoneOffset,
    type GanttTask,
    type SchedulerEvent,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';
import { de as german } from '@wirecore/wirelayer-recipes/locales/de';

// Scheduler, series, iCalendar and Gantt logic of @wirecore/wirelayer-recipes – framework-neutral, shared by Vue and React

const starts = (events: SchedulerEvent[]) => events.map((event) => event.start);
const series = (rrule: string, start: string, end: string, extra: Partial<SchedulerEvent> = {}): SchedulerEvent => ({
    id: 's',
    title: 'Series',
    start,
    end,
    rrule,
    ...extra,
});

describe('recurrence rules', () => {
    it('reads and writes rules', () => {
        const rule = parseRecurrenceRule('RRULE:FREQ=MONTHLY;INTERVAL=2;BYDAY=2MO,-1FR;COUNT=10;WKST=SU')!;
        expect(rule).toEqual({
            freq: 'MONTHLY',
            interval: 2,
            byDay: [
                { day: 1, nth: 2 },
                { day: 5, nth: -1 },
            ],
            count: 10,
            weekStart: 0,
        });
        expect(formatRecurrenceRule(rule)).toBe('FREQ=MONTHLY;INTERVAL=2;BYDAY=2MO,-1FR;COUNT=10;WKST=SU');
        expect(parseRecurrenceRule('FREQ=HOURLY')).toBeNull();
        expect(parseRecurrenceRule('FREQ=DAILY;UNTIL=20261231T235959Z')!.until).toBe('2026-12-31T23:59:59Z');
    });

    it('weekly on several days, every other week', () => {
        const event = series('FREQ=WEEKLY;BYDAY=MO,WE', '2026-10-05T09:00', '2026-10-05T09:30');
        expect(starts(expandRecurrence(event, { start: '2026-10-01', end: '2026-11-01' }))).toEqual([
            '2026-10-05T09:00',
            '2026-10-07T09:00',
            '2026-10-12T09:00',
            '2026-10-14T09:00',
            '2026-10-19T09:00',
            '2026-10-21T09:00',
            '2026-10-26T09:00',
            '2026-10-28T09:00',
        ]);
        const biweekly = series('FREQ=WEEKLY;INTERVAL=2;BYDAY=FR', '2026-10-02T14:00', '2026-10-02T15:00');
        expect(starts(expandRecurrence(biweekly, { start: '2026-10-01', end: '2026-11-01' }))).toEqual([
            '2026-10-02T14:00',
            '2026-10-16T14:00',
            '2026-10-30T14:00',
        ]);
    });

    it('the 2nd Monday of the month, the 5th Monday only where there is one', () => {
        const second = series('FREQ=MONTHLY;BYDAY=2MO;COUNT=4', '2026-10-12T10:00', '2026-10-12T11:00');
        expect(starts(expandRecurrence(second, { start: '2026-01-01', end: '2028-01-01' }))).toEqual([
            '2026-10-12T10:00',
            '2026-11-09T10:00',
            '2026-12-14T10:00',
            '2027-01-11T10:00',
        ]);
        const fifth = series('FREQ=MONTHLY;BYDAY=5MO', '2026-03-30T10:00', '2026-03-30T11:00');
        expect(starts(expandRecurrence(fifth, { start: '2026-01-01', end: '2027-01-01' }))).toEqual([
            '2026-03-30T10:00',
            '2026-06-29T10:00',
            '2026-08-31T10:00',
            '2026-11-30T10:00',
        ]);
        const lastFriday = series('FREQ=MONTHLY;BYDAY=-1FR', '2026-10-30T16:00', '2026-10-30T17:00');
        expect(starts(expandRecurrence(lastFriday, { start: '2026-10-01', end: '2027-01-01' }))).toEqual([
            '2026-10-30T16:00',
            '2026-11-27T16:00',
            '2026-12-25T16:00',
        ]);
    });

    it('the end of the month: the 31st skips short months, -1 is always the last day; 29 February only in leap years', () => {
        const range = { start: '2026-01-01', end: '2026-07-01' };
        const on31 = series('FREQ=MONTHLY', '2026-01-31', '2026-01-31', { allDay: true });
        expect(starts(expandRecurrence(on31, range))).toEqual(['2026-01-31', '2026-03-31', '2026-05-31']);
        const last = series('FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=4', '2026-01-31', '2026-01-31', { allDay: true });
        expect(starts(expandRecurrence(last, range))).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
        const leap = series('FREQ=YEARLY', '2024-02-29', '2024-02-29', { allDay: true });
        expect(starts(expandRecurrence(leap, { start: '2024-01-01', end: '2030-01-01' }))).toEqual([
            '2024-02-29',
            '2028-02-29',
        ]);
    });

    it('keeps the wall-clock time across the summer-time change in the time zone', () => {
        const daily = series('FREQ=DAILY', '2026-10-23T09:00', '2026-10-23T10:00');
        const autumn = expandRecurrence(daily, { start: '2026-10-24', end: '2026-10-27' }, 'Europe/Berlin');
        expect(autumn.map((event) => [event.start, event.end])).toEqual([
            ['2026-10-24T09:00', '2026-10-24T10:00'],
            ['2026-10-25T09:00', '2026-10-25T10:00'],
            ['2026-10-26T09:00', '2026-10-26T10:00'],
        ]);
        expect(withZoneOffset(autumn[0]!.start, 'Europe/Berlin')).toBe('2026-10-24T09:00+02:00');
        expect(withZoneOffset(autumn[2]!.start, 'Europe/Berlin')).toBe('2026-10-26T09:00+01:00');
        // 02:30 does not exist on 29 March in Berlin: that occurrence moves on by the gap
        const night = series('FREQ=DAILY;COUNT=3', '2026-03-28T02:30', '2026-03-28T03:00');
        expect(starts(expandRecurrence(night, { start: '2026-03-01', end: '2026-04-01' }, 'Europe/Berlin'))).toEqual([
            '2026-03-28T02:30',
            '2026-03-29T03:30',
            '2026-03-30T02:30',
        ]);
    });

    it('UNTIL, left-out and changed occurrences; COUNT counts left-out ones', () => {
        const event = series('FREQ=WEEKLY;UNTIL=20261020', '2026-10-05T09:00', '2026-10-05T10:00', {
            exdate: ['2026-10-12T09:00'],
            overrides: { '2026-10-19T09:00': { start: '2026-10-19T11:00', end: '2026-10-19T12:00', title: 'Later' } },
        });
        const occurrences = expandRecurrence(event, { start: '2026-10-01', end: '2026-11-01' });
        expect(occurrences.map(({ id, start, title }) => ({ id, start, title }))).toEqual([
            { id: 's@2026-10-05T09:00', start: '2026-10-05T09:00', title: 'Series' },
            { id: 's@2026-10-19T09:00', start: '2026-10-19T11:00', title: 'Later' },
        ]);
        expect(occurrences[1]).toMatchObject({ seriesId: 's', recurrenceId: '2026-10-19T09:00' });
        expect(occurrences[1]!.rrule).toBeUndefined();
        const counted = series('FREQ=DAILY;COUNT=3', '2026-10-05T09:00', '2026-10-05T10:00', {
            exdate: ['2026-10-06'],
        });
        expect(starts(expandRecurrence(counted, { start: '2026-10-01', end: '2026-11-01' }))).toEqual([
            '2026-10-05T09:00',
            '2026-10-07T09:00',
        ]);
    });

    it('describes rules in German and English', () => {
        const de = (rule: string, start?: string) => describeRecurrence(rule, german, 'de-DE', start);
        expect(de('FREQ=MONTHLY;BYDAY=2MO')).toBe('Jeden 2. Montag im Monat');
        expect(de('FREQ=MONTHLY;BYDAY=-1FR')).toBe('Jeden letzten Freitag im Monat');
        expect(de('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE')).toBe('Alle 2 Wochen am Montag und Mittwoch');
        expect(de('FREQ=WEEKLY', '2026-10-23')).toBe('Wöchentlich am Freitag');
        expect(de('FREQ=DAILY;COUNT=5')).toBe('Täglich, 5 Mal');
        expect(de('FREQ=DAILY;INTERVAL=3;COUNT=1')).toBe('Alle 3 Tage, einmal');
        expect(de('FREQ=MONTHLY;BYMONTHDAY=15;UNTIL=20261231')).toBe('Monatlich am 15., bis 31.12.2026');
        expect(de('FREQ=YEARLY', '2026-12-24')).toBe('Jährlich am 24. Dezember');
        expect(de('FREQ=YEARLY;BYMONTH=5;BYDAY=2SU')).toBe('Jährlich am 2. Sonntag im Mai');
        const en = (rule: string) => describeRecurrence(rule, messages.en, 'en-US');
        expect(en('FREQ=MONTHLY;BYDAY=2MO')).toBe('Every 2nd Monday of the month');
        expect(en('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=6')).toBe('Every 2 weeks on Monday and Wednesday, 6 times');
    });

    it('applies a change to one occurrence, the whole series or a single event', () => {
        const base = series('FREQ=WEEKLY', '2026-10-05T09:00', '2026-10-05T10:00', { exdate: ['2026-10-12T09:00'] });
        const plain: SchedulerEvent = { id: 'p', title: 'Single', start: '2026-10-06T08:00', end: '2026-10-06T09:00' };
        const [occurrence] = expandRecurrence(base, { start: '2026-10-19', end: '2026-10-20' });
        const only = applyEventChange([base, plain], {
            event: occurrence!,
            start: '2026-10-19T11:00',
            end: '2026-10-19T12:00',
            resourceId: 'room-2',
            scope: 'occurrence',
        });
        expect(only[0]!.overrides).toEqual({
            '2026-10-19T09:00': { start: '2026-10-19T11:00', end: '2026-10-19T12:00', resourceId: 'room-2' },
        });
        const all = applyEventChange([base, plain], {
            event: occurrence!,
            start: '2026-10-20T09:30',
            end: '2026-10-20T10:30',
            scope: 'series',
        });
        expect(all[0]).toMatchObject({
            start: '2026-10-06T09:30',
            end: '2026-10-06T10:30',
            exdate: ['2026-10-13T09:30'],
        });
        const single = applyEventChange([base, plain], {
            event: plain,
            start: '2026-10-07T08:00',
            end: '2026-10-07T09:00',
        });
        expect(single[1]).toEqual({ ...plain, start: '2026-10-07T08:00', end: '2026-10-07T09:00' });
    });
});

describe('iCalendar', () => {
    const events: SchedulerEvent[] = [
        {
            id: 'kickoff',
            title: 'Kick-off; Planning, Budget\nand Rooms',
            start: '2026-10-20T10:00',
            end: '2026-10-20T11:30',
            tone: 'success',
            resourceId: 'room-1',
        },
        { id: 'fair', title: 'Trade fair', start: '2026-10-21', end: '2026-10-23', allDay: true },
        {
            id: 'jour-fixe',
            title: 'Weekly sync with a very long title (café included) that runs past 75 characters and has to be folded',
            start: '2026-10-05T09:00',
            end: '2026-10-05T09:30',
            rrule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=10',
            exdate: ['2026-10-12T09:00'],
            overrides: { '2026-10-19T09:00': { start: '2026-10-19T10:00', end: '2026-10-19T10:30' } },
        },
    ];

    it('writes VEVENTs with folded lines and reads them back unchanged', () => {
        const text = toICalendar(events, { now: new Date('2026-10-01T00:00Z'), name: 'Team' });
        const lines = text.split('\r\n');
        expect(lines[0]).toBe('BEGIN:VCALENDAR');
        expect(lines).toContain('DTSTART;VALUE=DATE:20261021');
        expect(lines).toContain('DTEND;VALUE=DATE:20261024');
        expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10');
        expect(lines).toContain('EXDATE:20261012T090000');
        expect(lines).toContain('RECURRENCE-ID:20261019T090000');
        expect(lines).toContain('SUMMARY:Kick-off\\; Planning\\, Budget\\nand Rooms');
        expect(lines.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
        expect(lines.some((line) => line.startsWith(' '))).toBe(true);
        expect(parseICalendar(text)).toEqual(events);
    });

    it('converts UTC and TZID times into the time zone, also through the offsets of a VTIMEZONE', () => {
        const text = [
            'BEGIN:VCALENDAR',
            'BEGIN:VTIMEZONE',
            'TZID:W. Europe Standard Time',
            'BEGIN:STANDARD',
            'DTSTART:16010101T030000',
            'TZOFFSETFROM:+0200',
            'TZOFFSETTO:+0100',
            'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
            'END:STANDARD',
            'BEGIN:DAYLIGHT',
            'DTSTART:16010101T020000',
            'TZOFFSETFROM:+0100',
            'TZOFFSETTO:+0200',
            'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
            'END:DAYLIGHT',
            'END:VTIMEZONE',
            'BEGIN:VEVENT',
            'UID:a',
            'SUMMARY:UTC',
            'DTSTART:20261020T080000Z',
            'DURATION:PT1H30M',
            'END:VEVENT',
            'BEGIN:VEVENT',
            'UID:b',
            'SUMMARY:Berlin',
            'DTSTART;TZID=Europe/Berlin:20261020T100000',
            'DTEND;TZID=Europe/Berlin:20261020T110000',
            'END:VEVENT',
            'BEGIN:VEVENT',
            'UID:c',
            'SUMMARY:Winter',
            'DTSTART;TZID="W. Europe Standard Time":20260115T100000',
            'DTEND;TZID="W. Europe Standard Time":20260115T110000',
            'END:VEVENT',
            'BEGIN:VEVENT',
            'UID:d',
            'SUMMARY:Summer',
            'DTSTART;TZID="W. Europe Standard Time":20260715T100000',
            'DTEND;TZID="W. Europe Standard Time":20260715T110000',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');
        const parsed = parseICalendar(text, { timeZone: 'UTC' });
        expect(parsed.map(({ id, start, end }) => ({ id, start, end }))).toEqual([
            { id: 'a', start: '2026-10-20T08:00', end: '2026-10-20T09:30' },
            { id: 'b', start: '2026-10-20T08:00', end: '2026-10-20T09:00' },
            { id: 'c', start: '2026-01-15T09:00', end: '2026-01-15T10:00' },
            { id: 'd', start: '2026-07-15T08:00', end: '2026-07-15T09:00' },
        ]);
        expect(parseICalendar(text, { timeZone: 'America/New_York' })[1]!.start).toBe('2026-10-20T04:00');
    });

    it('writes times with offset as UTC and wall-clock times with TZID', () => {
        const text = toICalendar(
            [
                { id: 'x', title: 'A', start: '2026-10-20T10:00+02:00', end: '2026-10-20T11:00+02:00' },
                { id: 'y', title: 'B', start: '2026-10-20T10:00', end: '2026-10-20T11:00' },
            ],
            { timeZone: 'Europe/Berlin', now: new Date('2026-10-01T00:00Z') }
        );
        expect(text).toContain('DTSTART:20261020T080000Z');
        expect(text).toContain('DTSTART;TZID=Europe/Berlin:20261020T100000');
        // The zone is described (VTIMEZONE) before the events, with the changes of 2026
        expect(text).toContain(
            [
                'BEGIN:VTIMEZONE',
                'TZID:Europe/Berlin',
                'BEGIN:DAYLIGHT',
                'DTSTART:20260329T020000',
                'TZOFFSETFROM:+0100',
                'TZOFFSETTO:+0200',
                'END:DAYLIGHT',
                'BEGIN:STANDARD',
                'DTSTART:20261025T030000',
                'TZOFFSETFROM:+0200',
                'TZOFFSETTO:+0100',
                'END:STANDARD',
                'END:VTIMEZONE',
            ].join('\r\n')
        );
        expect(text.indexOf('END:VTIMEZONE')).toBeLessThan(text.indexOf('BEGIN:VEVENT'));
        // An Outlook-like zone name is read through the offsets of the VTIMEZONE
        const renamed = text.replaceAll('Europe/Berlin', 'W. Europe Standard Time');
        expect(parseICalendar(renamed, { timeZone: 'UTC' })[1]!.start).toBe('2026-10-20T08:00');
    });

    it('vTimeZone: zones without changes, southern hemisphere, unknown names', () => {
        expect(vTimeZone('Asia/Tokyo', 2026, 2026)).toEqual([
            'BEGIN:VTIMEZONE',
            'TZID:Asia/Tokyo',
            'BEGIN:STANDARD',
            'DTSTART:20260101T090000',
            'TZOFFSETFROM:+0900',
            'TZOFFSETTO:+0900',
            'END:STANDARD',
            'END:VTIMEZONE',
        ]);
        const sydney = vTimeZone('Australia/Sydney', 2026, 2026).join('\n');
        expect(sydney).toContain('BEGIN:STANDARD\nDTSTART:20260405T030000\nTZOFFSETFROM:+1100\nTZOFFSETTO:+1000');
        expect(sydney).toContain('BEGIN:DAYLIGHT\nDTSTART:20261004T020000\nTZOFFSETFROM:+1000\nTZOFFSETTO:+1100');
        expect(vTimeZone('Mars/Olympus', 2026, 2026)).toEqual([]);
    });
});

describe('Scheduler logic', () => {
    it('days of the views: hidden weekends, the month of the timeline and the year', () => {
        const date = parseLocal('2026-10-21');
        expect(schedulerDays('week', date, { hideWeekends: true }).map((day) => day.getDay())).toEqual([1, 2, 3, 4, 5]);
        expect(schedulerDays('month', date, { hideWeekends: true }).length % 5).toBe(0);
        expect(schedulerDays('timeline', date, { timelineRange: 'month' })).toHaveLength(31);
        expect(schedulerDays('year', date)).toHaveLength(365);
        expect(daysRange(schedulerDays('week', date))).toEqual({ start: '2026-10-19', end: '2026-10-26' });
    });

    it('resourcePage: a page of resources, kept in range', () => {
        const list = ['a', 'b', 'c', 'd', 'e'];
        expect(resourcePage(list, 0, 2)).toEqual({ items: ['a', 'b'], page: 0, pageCount: 3, from: 1, to: 2 });
        expect(resourcePage(list, 9, 2)).toEqual({ items: ['e'], page: 2, pageCount: 3, from: 5, to: 5 });
        expect(resourcePage(list, 1)).toEqual({ items: list, page: 0, pageCount: 1, from: 1, to: 5 });
        expect(resourcePage(list, 1, 10).pageCount).toBe(1);
    });

    it('resource columns grouped by date or by resource', () => {
        const days = schedulerDays('week', parseLocal('2026-10-21')).slice(0, 2);
        const resources = [
            { id: 'a', label: 'Anna' },
            { id: 'b', label: 'Ben' },
        ];
        const label = (columns: ReturnType<typeof schedulerColumns>) =>
            columns.map((column) => `${column.day.getDate()}${column.resource?.id}`);
        expect(label(schedulerColumns(days, resources))).toEqual(['19a', '19b', '20a', '20b']);
        expect(label(schedulerColumns(days, resources, 'resource'))).toEqual(['19a', '20a', '19b', '20b']);
        expect(schedulerColumns(days)).toHaveLength(2);
    });

    it('closed times outside the business hours of the weekday', () => {
        const hours = [{ days: [1, 2, 3, 4, 5], start: '08:00', end: '17:00' }];
        const monday = parseLocal('2026-10-19');
        expect(closedTimes(hours, monday, 7, 19)).toEqual([
            { top: 0, height: (1 / 12) * 100 },
            { top: (10 / 12) * 100, height: (2 / 12) * 100 },
        ]);
        expect(closedTimes(hours, parseLocal('2026-10-24'), 7, 19)).toEqual([{ top: 0, height: 100 }]);
        expect(closedTimes(undefined, monday, 7, 19)).toEqual([]);
    });

    it('rules for dropping: canDrop, canResize and no overlap per resource', () => {
        const events: SchedulerEvent[] = [
            { id: 'a', title: 'A', start: '2026-10-20T09:00', end: '2026-10-20T10:00', resourceId: 'r1' },
            { id: 'b', title: 'B', start: '2026-10-20T10:00', end: '2026-10-20T11:00', resourceId: 'r2' },
            { id: 'h', title: 'Holiday', start: '2026-10-20', end: '2026-10-20', allDay: true, background: true },
        ];
        const check = (start: string, end: string, resourceId: string, extra = {}) =>
            checkEventDrop({ events, event: events[0]!, start, end, resourceId, preventOverlap: true, ...extra });
        expect(check('2026-10-20T10:00', '2026-10-20T11:00', 'r1')).toBeNull();
        expect(check('2026-10-20T10:30', '2026-10-20T11:30', 'r2')).toEqual({ reason: 'overlap', conflict: events[1] });
        expect(check('2026-10-20T11:00', '2026-10-20T12:00', 'r2')).toBeNull();
        expect(check('2026-10-20T10:00', '2026-10-20T11:00', 'r1', { canDrop: () => false })).toEqual({
            reason: 'rule',
        });
        expect(
            check('2026-10-20T09:00', '2026-10-20T12:00', 'r1', {
                resize: true,
                canResize: () => false,
                canDrop: () => true,
            })
        ).toEqual({ reason: 'rule' });
    });

    it('timeline: positions on an axis without weekends, lanes for overlapping events', () => {
        const days = schedulerDays('timeline', parseLocal('2026-10-21'), { hideWeekends: true });
        const segments = timelineSegments(days, 'week', 8, 18);
        expect(timelineOffset(segments, parseLocal('2026-10-20T12:00'))).toBe(1440 + 720);
        // Saturday is not on the axis: it snaps to the end
        expect(timelineOffset(segments, parseLocal('2026-10-24T12:00'))).toBe(5 * 1440);
        expect(timelineTimeAt(segments, 1440 + 720)).toEqual(parseLocal('2026-10-20T12:00'));
        const daySegments = timelineSegments([parseLocal('2026-10-20')], 'day', 8, 18);
        expect(timelineOffset(daySegments, parseLocal('2026-10-20T09:30'))).toBe(90);
        const items = layoutTimeline(
            [
                { id: 'a', title: 'A', start: '2026-10-20T09:00', end: '2026-10-20T11:00' },
                { id: 'b', title: 'B', start: '2026-10-20T10:00', end: '2026-10-20T12:00' },
                { id: 'c', title: 'C', start: '2026-10-20T11:00', end: '2026-10-20T12:00' },
            ],
            daySegments
        );
        expect(items.map((item) => [item.event.id, item.offset, item.length, item.lane, item.lanes])).toEqual([
            ['a', 60, 120, 0, 2],
            ['b', 120, 120, 1, 2],
            ['c', 180, 60, 0, 2],
        ]);
    });
});

describe('Gantt logic', () => {
    const tasks: GanttTask[] = [
        { id: 'plan', name: 'Planning', start: '2026-10-19', end: '2026-10-30' },
        { id: 'a', name: 'Concept', start: '2026-10-19', end: '2026-10-21', parentId: 'plan', progress: 100 },
        {
            id: 'b',
            name: 'Design',
            start: '2026-10-22',
            end: '2026-10-23',
            parentId: 'plan',
            dependencies: ['a'],
            progress: 50,
        },
        { id: 'c', name: 'Alignment', start: '2026-10-22', end: '2026-10-22', parentId: 'plan', dependencies: ['a'] },
        {
            id: 'd',
            name: 'Approval',
            start: '2026-10-26',
            end: '2026-10-26',
            milestone: true,
            dependencies: ['b', 'c'],
        },
    ];

    it('rows of the task list with groups, spans and weighted progress', () => {
        expect(ganttRows(tasks, ['plan']).map((row) => [row.task.id, row.level, row.posinset, row.setsize])).toEqual([
            ['plan', 1, 1, 2],
            ['a', 2, 1, 3],
            ['b', 2, 2, 3],
            ['c', 2, 3, 3],
            ['d', 1, 2, 2],
        ]);
        const collapsed = ganttRows(tasks, []);
        expect(collapsed.map((row) => row.task.id)).toEqual(['plan', 'd']);
        expect(collapsed[0]).toMatchObject({
            hasChildren: true,
            expanded: false,
            start: '2026-10-19',
            end: '2026-10-23',
        });
        // (3 days × 100 + 2 × 50 + 1 × 0) / 6
        expect(ganttSpans(tasks).get('plan')!.progress).toBe(67);
        expect(taskDuration(tasks[1]!)).toBe(3);
        expect(taskDuration(tasks[4]!)).toBe(0);
    });

    it('the critical path follows the dependencies without slack', () => {
        expect([...criticalPath(tasks)].sort()).toEqual(['a', 'b', 'd']);
        // A cycle leaves its tasks out
        const cyclic: GanttTask[] = [
            { id: 'x', name: 'X', start: '2026-10-19', end: '2026-10-19', dependencies: ['y'] },
            { id: 'y', name: 'Y', start: '2026-10-20', end: '2026-10-20', dependencies: ['x'] },
            { id: 'z', name: 'Z', start: '2026-10-19', end: '2026-10-25' },
        ];
        expect([...criticalPath(cyclic)]).toEqual(['z']);
    });

    it('new dependencies must not close a cycle', () => {
        expect(dependencyCycle(tasks, 'd', 'a')).toBe(true);
        expect(dependencyCycle(tasks, 'a', 'a')).toBe(true);
        expect(dependencyCycle(tasks, 'a', 'b')).toBe(true);
        expect(dependencyCycle(tasks, 'c', 'b')).toBe(false);
    });

    it('scale per zoom, bars moved and resized, arrow paths', () => {
        const scale = ganttScale(tasks, 'week', 'de-DE', german);
        expect(scale.start).toBe('2026-10-19');
        expect(scale.bottom.map((unit) => unit.label)).toEqual(['KW 43', 'KW 44', 'KW 45']);
        expect(scale.top.map((unit) => unit.label)).toEqual(['Oktober 2026', 'November 2026']);
        expect(ganttScale(tasks, 'quarter', 'de-DE', german).bottom[0]).toEqual({
            start: '2026-10-01',
            days: 92,
            label: 'Q4',
        });
        expect(shiftTask(tasks[1]!, 2)).toEqual({ start: '2026-10-21', end: '2026-10-23' });
        expect(shiftTask(tasks[1]!, -5, true)).toEqual({ start: '2026-10-19', end: '2026-10-19' });
        expect(dependencyPath({ x: 0, width: 40, row: 0 }, { x: 80, row: 2 }, 40)).toEqual({
            line: 'M 40 20 H 48 V 100 H 80',
            head: 'M 80 100 l -6 -4 v 8 z',
        });
        expect(dependencyPath({ x: 0, width: 40, row: 0 }, { x: 20, row: 1 }, 40).line).toBe(
            'M 40 20 H 48 V 40 H 12 V 60 H 20'
        );
    });
});
