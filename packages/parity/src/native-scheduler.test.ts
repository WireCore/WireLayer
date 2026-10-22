import {
    agendaSections,
    compareEvents,
    dragMinutes,
    formatDayRange,
    ganttBarPercent,
    ganttExtent,
    parseLocal,
    schedulerWeeks,
    stepProgress,
    timeGridMinutes,
    timeGridOffset,
    visibleDays,
    type SchedulerEvent,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Shared logic of the React Native Scheduler and Gantt (@wirecore/wirelayer-native) – agenda, compact month, time grid, task list

const events: SchedulerEvent[] = [
    { id: 'standup', title: 'Standup', start: '2026-10-21T09:00', end: '2026-10-21T09:15' },
    { id: 'workshop', title: 'Workshop', start: '2026-10-21T09:00', end: '2026-10-21T12:00' },
    { id: 'holiday', title: 'Holiday', start: '2026-10-22', end: '2026-10-22', allDay: true, background: true },
    { id: 'fair', title: 'Trade fair', start: '2026-10-21', end: '2026-10-22', allDay: true },
    { id: 'review', title: 'Review', start: '2026-10-23T14:00', end: '2026-10-23T15:00' },
];
const days = ['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24'].map(parseLocal);

describe('scheduler agenda', () => {
    it('lists all-day events first, then by start, the longer one first', () => {
        const sorted = [...events].filter((event) => !event.background).sort(compareEvents);
        expect(sorted.map((event) => event.id)).toEqual(['fair', 'workshop', 'standup', 'review']);
    });

    it('groups the events per day, leaves out background events and empty days', () => {
        const sections = agendaSections(events, days);
        expect(sections.map((section) => section.key)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23']);
        expect(sections.map((section) => section.events.map((event) => event.id))).toEqual([
            ['fair', 'workshop', 'standup'],
            ['fair'],
            ['review'],
        ]);
        expect(agendaSections([], days)).toEqual([]);
    });
});

describe('scheduler compact month', () => {
    it('splits the days of the month into weeks', () => {
        const weeks = schedulerWeeks(visibleDays('month', parseLocal('2026-10-21'), 1));
        expect(weeks).toHaveLength(5);
        expect(weeks.every((week) => week.length === 7)).toBe(true);
        expect(weeks[0]![0]!.toDateString()).toBe(parseLocal('2026-09-28').toDateString());
        expect(weeks[4]![6]!.toDateString()).toBe(parseLocal('2026-11-01').toDateString());
    });

    it('takes shorter weeks without weekends', () => {
        const workdays = visibleDays('week', parseLocal('2026-10-21'), 1).slice(0, 5);
        expect(schedulerWeeks([...workdays, ...workdays], 5).map((week) => week.length)).toEqual([5, 5]);
    });
});

describe('scheduler time grid', () => {
    it('finds the time at a position, floored to the step and kept in the visible hours', () => {
        // 56 pt per hour from 07:00 to 19:00, steps of 30 minutes
        expect(timeGridMinutes(0, 56, 7, 19, 30)).toBe(7 * 60);
        expect(timeGridMinutes(84, 56, 7, 19, 30)).toBe(8 * 60 + 30);
        expect(timeGridMinutes(83, 56, 7, 19, 30)).toBe(8 * 60);
        expect(timeGridMinutes(-10, 56, 7, 19, 30)).toBe(7 * 60);
        // The last step starts at 18:30
        expect(timeGridMinutes(10_000, 56, 7, 19, 30)).toBe(18 * 60 + 30);
    });

    it('places a time in the grid', () => {
        expect(timeGridOffset('08:30', 56, 7)).toBe(84);
        expect(timeGridOffset(9 * 60, 60, 8)).toBe(60);
        expect(timeGridOffset('06:00', 56, 7)).toBe(0);
    });

    it('turns a dragged distance into minutes in steps', () => {
        expect(dragMinutes(42, 56, 15)).toBe(45);
        expect(dragMinutes(-20, 56, 30)).toBe(-30);
        expect(dragMinutes(5, 56, 30)).toBe(0);
        expect(dragMinutes(-5, 56, 30)).toBe(0);
    });
});

describe('range of days in words', () => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const first = parseLocal('2026-10-19');
    const last = parseLocal('2026-10-25');

    it('uses formatRange, one day is just that day', () => {
        const format = new Intl.DateTimeFormat('de-DE', options);
        expect(formatDayRange(first, last, 'de-DE')).toBe(format.formatRange(first, last));
        expect(formatDayRange(first, parseLocal('2026-10-19T18:00'), 'de-DE')).toBe(format.format(first));
    });

    it('joins both days where the engine has no formatRange (Hermes)', () => {
        const prototype = Intl.DateTimeFormat.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'formatRange')!;
        Object.defineProperty(prototype, 'formatRange', { value: undefined, configurable: true, writable: true });
        try {
            const format = new Intl.DateTimeFormat('de-DE', options);
            expect(formatDayRange(first, last, 'de-DE')).toBe(`${format.format(first)} – ${format.format(last)}`);
        } finally {
            Object.defineProperty(prototype, 'formatRange', descriptor);
        }
    });
});

describe('gantt task list', () => {
    const tasks = [
        { id: 'a', name: 'Concept', start: '2026-10-01', end: '2026-10-05' },
        { id: 'b', name: 'Implementation', start: '2026-10-06', end: '2026-10-10' },
        { id: 'm', name: 'Acceptance', start: '2026-10-10', end: '2026-10-10', milestone: true },
    ];

    it('spans all tasks, both ends counted', () => {
        expect(ganttExtent(tasks)).toEqual({ start: '2026-10-01', end: '2026-10-10', days: 10 });
        expect(ganttExtent([])).toBeNull();
    });

    it('places the bars in percent of the span, milestones in the middle of their day', () => {
        const extent = ganttExtent(tasks)!;
        expect(ganttBarPercent(tasks[0]!, extent)).toEqual({ offset: 0, width: 50 });
        expect(ganttBarPercent(tasks[1]!, extent)).toEqual({ offset: 50, width: 50 });
        expect(ganttBarPercent(tasks[2]!, extent)).toEqual({ offset: 95, width: 0 });
        // Beyond the span: cut at its end
        expect(ganttBarPercent({ start: '2026-10-08', end: '2026-10-15' }, extent)).toEqual({ offset: 70, width: 30 });
    });

    it('steps the progress within 0–100', () => {
        expect(stepProgress(45, 10)).toBe(55);
        expect(stepProgress(95, 10)).toBe(100);
        expect(stepProgress(5, -10)).toBe(0);
        expect(stepProgress(33.4, 0)).toBe(33);
    });
});
