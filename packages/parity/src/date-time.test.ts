import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Date and time: value types, paste, clear, button bar, week numbers, months, own days, deselect, quarters,
// durations, time zones, time slots and the day strip – the same in Vue and React

const paste = (element: Element, text: string) => fireEvent.paste(element, { clipboardData: { getData: () => text } });

describe.each(frameworks)('%s', (framework) => {
    const onValue = framework === 'vue' ? 'onUpdate:modelValue' : 'onValueChange';

    describe('DatePicker', () => {
        it('takes a Date and hands out Dates with valueType "date"; pasted German dates are read', async () => {
            const change = vi.fn();
            await render(
                framework,
                el(
                    'LocaleProvider',
                    { locale: 'de-DE' },
                    el('DatePicker', {
                        defaultValue: new Date(2026, 9, 20),
                        valueType: 'date',
                        'aria-label': 'Appointment',
                        [onValue]: change,
                    })
                )
            );
            const group = screen.getByRole('group', { name: 'Appointment' });
            expect(
                within(group)
                    .getAllByRole('spinbutton')
                    .map((part) => part.textContent)
            ).toEqual(['20', '10', '2026']);
            paste(within(group).getByRole('spinbutton', { name: 'Tag' }), '21.10.2026');
            await waitFor(() => expect(change).toHaveBeenLastCalledWith(new Date(2026, 9, 21)));
        });

        it('reads pasted ISO dates with time in the time zone and adds its offset', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('DatePicker', {
                    withTime: true,
                    timeZone: 'Europe/Berlin',
                    showTimeZone: true,
                    'aria-label': 'Appointment',
                    [onValue]: change,
                })
            );
            const group = screen.getByRole('group', { name: 'Appointment' });
            paste(within(group).getByRole('spinbutton', { name: 'Day' }), '2026-10-20T14:30');
            await waitFor(() => expect(change).toHaveBeenLastCalledWith('2026-10-20T14:30+02:00'));
            expect(group).toHaveAccessibleDescription('Time zone: Central European Summer Time');
        });

        it('clearable false leaves out the clear button', async () => {
            await render(framework, el('DatePicker', { defaultValue: '2026-10-20', 'aria-label': 'A' }));
            expect(screen.getByRole('button', { name: 'Clear date' })).toBeInTheDocument();
            document.body.innerHTML = '';
            await render(
                framework,
                el('DatePicker', { defaultValue: '2026-10-20', clearable: false, 'aria-label': 'B' })
            );
            expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument();
        });

        it('the button bar clears the date', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('DatePicker', {
                    defaultValue: '2026-10-20',
                    showButtonBar: true,
                    'aria-label': 'T',
                    [onValue]: change,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
            expect(await screen.findByRole('button', { name: 'Today' })).toBeInTheDocument();
            await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
            await waitFor(() => expect(change).toHaveBeenLastCalledWith(null));
        });

        it('several dates: listed in the field, a day toggles', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('DatePicker', {
                    selectionMode: 'multiple',
                    defaultValue: ['2026-10-20', '2026-10-22'],
                    'aria-label': 'Appointments',
                    [onValue]: change,
                })
            );
            const trigger = screen.getByRole('button', { name: 'Open calendar' });
            expect(trigger).toHaveAccessibleDescription('10/20/2026, 10/22/2026');
            await userEvent.click(trigger);
            await userEvent.click(await screen.findByRole('button', { name: /^Friday, October 23, 2026/ }));
            await waitFor(() => expect(change).toHaveBeenLastCalledWith(['2026-10-20', '2026-10-22', '2026-10-23']));
        });
    });

    describe('Calendar', () => {
        it('week numbers: a named column and one row header per week (ISO weeks)', async () => {
            const container = await render(
                framework,
                el('Calendar', { defaultValue: ['2026-10-20'], showWeekNumbers: true })
            );
            // Ark hides the weekday row from screen readers (the days carry the full date); the week column too
            const header = container.querySelector('thead th abbr');
            expect(header).toHaveTextContent('Wk');
            expect(header).toHaveAttribute('title', 'Calendar week');
            const weeks = screen.getAllByRole('rowheader');
            expect(weeks.map((week) => week.textContent?.trim())).toEqual(['40', '41', '42', '43', '44']);
            expect(weeks[3]).toHaveAccessibleName('Week 43');
        });

        it('weeks starting on Sunday keep the ISO number of their Monday', async () => {
            const container = await render(
                framework,
                el('Calendar', { defaultValue: ['2026-10-20'], showWeekNumbers: true, firstDayOfWeek: 0 })
            );
            expect(container.querySelectorAll('thead th')[1]).toHaveTextContent('Sun');
            expect(screen.getAllByRole('rowheader').map((week) => week.textContent?.trim())).toEqual([
                '40',
                '41',
                '42',
                '43',
                '44',
            ]);
        });

        it('two months side by side, each with its title; days of the other month are empty', async () => {
            await render(framework, el('Calendar', { defaultValue: ['2026-10-20'], numberOfMonths: 2 }));
            expect(screen.getAllByRole('grid')).toHaveLength(2);
            expect(screen.getByText('November 2026')).toBeInTheDocument();
            // A day of the neighbour month shows up in its own month only – the first grid has empty cells instead
            expect(screen.getAllByRole('button', { name: /^Sunday, November 1, 2026/ })).toHaveLength(1);
            const first = screen.getAllByRole('grid')[0]!;
            expect(within(first).queryByRole('button', { name: /November 2026/ })).not.toBeInTheDocument();
            expect([...first.querySelectorAll('td')].filter((cell) => !cell.textContent).length).toBeGreaterThan(0);
        });

        it('own day content, today without highlight, own weekend days', async () => {
            await render(
                framework,
                el('Calendar', {
                    defaultValue: ['2026-10-20'],
                    highlightToday: false,
                    weekendDays: [5, 6],
                    $scoped: {
                        day: {
                            react: 'renderDay',
                            args: (date: string, state: Record<string, unknown>) => ({ date, ...state }),
                            render: ({ date, day, selected }: { date: string; day: number; selected: boolean }) =>
                                el('span', { 'data-date': date }, `${day}${selected ? '!' : ''}`),
                        },
                    },
                })
            );
            const day = screen.getByRole('button', { name: /^Selected: Tuesday, October 20, 2026/ });
            expect(day).toHaveTextContent('20!');
            expect(day).toHaveClass('data-today:font-normal');
            const friday = screen.getByRole('button', { name: /^Friday, October 23, 2026/ });
            expect(friday.closest('td')).toHaveAttribute('data-weekend');
            const sunday = screen.getByRole('button', { name: /^Sunday, October 25, 2026/ });
            expect(sunday.closest('td')).not.toHaveAttribute('data-weekend');
        });

        it('allowDeselect: the chosen day again clears it (click and keyboard)', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('Calendar', { defaultValue: ['2026-10-20'], allowDeselect: true, [onValue]: change })
            );
            await userEvent.click(screen.getByRole('button', { name: /^Selected: Tuesday, October 20, 2026/ }));
            await waitFor(() => expect(change).toHaveBeenLastCalledWith([]));
            const day = screen.getByRole('button', { name: /^Wednesday, October 21, 2026/ });
            await userEvent.click(day);
            await waitFor(() => expect(change).toHaveBeenLastCalledWith(['2026-10-21']));
            day.focus();
            await userEvent.keyboard('{Enter}');
            await waitFor(() => expect(change).toHaveBeenLastCalledWith([]));
        });

        it('excluded dates cannot be chosen; Date values in and out', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('Calendar', {
                    defaultValue: [new Date(2026, 9, 20)],
                    valueType: 'date',
                    excludeDates: [new Date(2026, 9, 22)],
                    [onValue]: change,
                })
            );
            expect(screen.getByRole('button', { name: /October 22, 2026/ })).toHaveAttribute('aria-disabled', 'true');
            await userEvent.click(screen.getByRole('button', { name: /^Wednesday, October 21, 2026/ }));
            await waitFor(() => expect(change).toHaveBeenLastCalledWith([new Date(2026, 9, 21)]));
        });
    });

    describe('DateRangePicker', () => {
        it('reads a pasted range', async () => {
            const change = vi.fn();
            await render(framework, el('DateRangePicker', { 'aria-label': 'Vacation', [onValue]: change }));
            const start = screen.getByRole('group', { name: 'Vacation, Start' });
            paste(within(start).getByRole('spinbutton', { name: 'Day' }), '10/20/2026 – 10/24/2026');
            await waitFor(() => expect(change).toHaveBeenLastCalledWith({ start: '2026-10-20', end: '2026-10-24' }));
        });
    });

    describe('QuarterPicker', () => {
        it('picks a quarter from the grid and reads typed quarters', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('QuarterPicker', { defaultValue: '2026-Q4', 'aria-label': 'Quarter', [onValue]: change })
            );
            const input = screen.getByRole('textbox', { name: 'Quarter' });
            expect(input).toHaveValue('Q4 2026');
            await userEvent.click(screen.getByRole('button', { name: 'Select quarter' }));
            const dialog = await screen.findByRole('dialog', { name: 'Quarters' });
            const q4 = within(dialog).getByRole('button', { name: 'Q4 2026, October – December' });
            expect(q4).toHaveAttribute('aria-pressed', 'true');
            await userEvent.click(within(dialog).getByRole('button', { name: /^Q2 2026/ }));
            expect(change).toHaveBeenLastCalledWith('2026-Q2');
            await userEvent.clear(input);
            await userEvent.type(input, '3/2027{Enter}');
            expect(change).toHaveBeenLastCalledWith('2027-Q3');
        });

        it('range: start, then end; arrow keys run on into the next year', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('QuarterPicker', {
                    range: true,
                    defaultValue: { start: '2026-Q4', end: null },
                    'aria-label': 'Q',
                    [onValue]: change,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Select quarter' }));
            const dialog = await screen.findByRole('dialog');
            await userEvent.click(within(dialog).getByRole('button', { name: /^Q1 2026/ }));
            expect(change).toHaveBeenLastCalledWith({ start: '2026-Q1', end: null });
            await userEvent.click(within(dialog).getByRole('button', { name: /^Q3 2026/ }));
            expect(change).toHaveBeenLastCalledWith({ start: '2026-Q1', end: '2026-Q3' });
            await userEvent.click(screen.getByRole('button', { name: 'Select quarter' }));
            const reopened = await screen.findByRole('dialog');
            const q2 = within(reopened).getByRole('button', { name: /^Q2 2026/ });
            expect(q2).toHaveAttribute('data-in-range');
            within(reopened)
                .getByRole('button', { name: /^Q4 2026/ })
                .focus();
            await userEvent.keyboard('{ArrowRight}');
            await waitFor(() => expect(document.activeElement).toHaveAccessibleName(/^Q1 2027/));
        });
    });

    describe('DurationInput', () => {
        it('typing hours, ":" and minutes gives the minutes; the whole duration is the description', async () => {
            const change = vi.fn();
            await render(framework, el('DurationInput', { 'aria-label': 'Duration', [onValue]: change }));
            const group = screen.getByRole('group', { name: 'Duration' });
            within(group).getByRole('spinbutton', { name: 'Hours' }).focus();
            await userEvent.keyboard('2:30');
            expect(change).toHaveBeenLastCalledWith(150);
            expect(group).toHaveAccessibleDescription('2 hours 30 minutes');
            const minutes = within(group).getByRole('spinbutton', { name: 'Minutes' });
            expect(minutes).toHaveAttribute('aria-valuetext', '30 minutes');
            minutes.focus();
            await userEvent.keyboard('{ArrowUp}');
            expect(change).toHaveBeenLastCalledWith(151);
            await userEvent.click(screen.getByRole('button', { name: 'Clear duration' }));
            expect(change).toHaveBeenLastCalledWith(null);
        });

        it('hours go past 24; ISO values in and out', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('DurationInput', {
                    valueType: 'iso',
                    defaultValue: 'P1DT2H',
                    'aria-label': 'Duration',
                    [onValue]: change,
                })
            );
            const hours = screen.getByRole('spinbutton', { name: 'Hours' });
            expect(hours).toHaveTextContent('26');
            hours.focus();
            await userEvent.keyboard('{ArrowUp}');
            expect(change).toHaveBeenLastCalledWith('PT27H');
        });
    });

    describe('TimePicker and TimeRangePicker', () => {
        it('seconds and the offset of the time zone', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('TimePicker', {
                    withSeconds: true,
                    timeZone: 'Europe/Berlin',
                    referenceDate: '2026-07-01',
                    'aria-label': 'Start',
                    [onValue]: change,
                })
            );
            const group = screen.getByRole('group', { name: 'Start' });
            expect(within(group).getAllByRole('spinbutton')).toHaveLength(4);
            paste(within(group).getByRole('spinbutton', { name: 'Hour' }), '14:30:15');
            await waitFor(() => expect(change).toHaveBeenLastCalledWith('14:30:15+02:00'));
        });

        it('12 hours: the list shows the times in that format, the value stays 24 hours', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('TimePicker', {
                    hourCycle: 'h12',
                    step: 60,
                    min: '13:00',
                    max: '14:00',
                    'aria-label': 'B',
                    [onValue]: change,
                })
            );
            expect(screen.getAllByRole('spinbutton').map((part) => part.getAttribute('aria-label'))).toContain('AM/PM');
            await userEvent.click(screen.getByRole('combobox', { name: 'Select time' }));
            const options = await screen.findAllByRole('option');
            expect(options.map((option) => option.textContent?.replace(/\s/g, ' '))).toEqual(['01:00 PM', '02:00 PM']);
            await userEvent.click(options[1]!);
            expect(change).toHaveBeenLastCalledWith('14:00');
        });

        it('a pasted range fills start and end', async () => {
            const change = vi.fn();
            await render(framework, el('TimeRangePicker', { 'aria-label': 'Working hours', [onValue]: change }));
            const start = screen.getByRole('group', { name: 'Working hours, Start' });
            expect(screen.getByRole('group', { name: 'Working hours, End' })).toBeInTheDocument();
            paste(within(start).getByRole('spinbutton', { name: 'Hour' }), '09:00 – 17:30');
            await waitFor(() => expect(change).toHaveBeenLastCalledWith({ start: '09:00', end: '17:30' }));
        });
    });

    describe('TimeGrid', () => {
        it('radio buttons: click and arrow keys choose, taken slots are skipped', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('TimeGrid', { start: '09:00', end: '11:00', disabledTimes: ['10:00'], [onValue]: change })
            );
            const group = screen.getByRole('radiogroup', { name: 'Available times' });
            expect(group).toHaveAccessibleDescription('3 times available');
            const radios = within(group).getAllByRole('radio');
            expect(radios.map((radio) => radio.textContent?.trim())).toEqual([
                '09:00 AM',
                '09:30 AM',
                '10:00 AM',
                '10:30 AM',
            ]);
            expect(radios[2]).toHaveAttribute('aria-disabled', 'true');
            await userEvent.click(radios[2]!);
            expect(change).not.toHaveBeenCalled();
            await userEvent.click(radios[1]!);
            expect(change).toHaveBeenLastCalledWith('09:30');
            expect(radios[1]).toHaveAttribute('aria-checked', 'true');
            await userEvent.keyboard('{ArrowRight}');
            expect(change).toHaveBeenLastCalledWith('10:30');
            expect(radios[3]).toHaveFocus();
        });

        it('range: toggle buttons for start and end, the slots between are marked', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('TimeGrid', { range: true, start: '09:00', end: '11:00', label: 'Room A', [onValue]: change })
            );
            const group = screen.getByRole('group', { name: 'Room A' });
            await userEvent.click(within(group).getByRole('button', { name: '10:30 AM' }));
            await userEvent.click(within(group).getByRole('button', { name: '09:30 AM' }));
            expect(change).toHaveBeenLastCalledWith({ start: '09:30', end: '10:30' });
            expect(within(group).getByRole('button', { name: '09:30 AM' })).toHaveAttribute('aria-pressed', 'true');
            expect(within(group).getByRole('button', { name: '10:00 AM' })).toHaveAttribute('data-in-range');
        });

        it('loading and no slots are announced', async () => {
            await render(framework, el('TimeGrid', { loading: true }));
            expect(screen.getByRole('status')).toHaveTextContent('Loading times');
        });
    });

    describe('MiniCalendar', () => {
        it('a strip of days as radio buttons; arrows choose and move the strip on', async () => {
            const change = vi.fn();
            await render(
                framework,
                el('MiniCalendar', { defaultValue: '2026-10-25', startDate: '2026-10-19', [onValue]: change })
            );
            const group = screen.getByRole('radiogroup', { name: 'Days' });
            const days = within(group).getAllByRole('radio');
            expect(days).toHaveLength(7);
            const sunday = within(group).getByRole('radio', { name: 'Sunday, October 25, 2026' });
            expect(sunday).toHaveAttribute('aria-checked', 'true');
            sunday.focus();
            await userEvent.keyboard('{ArrowRight}');
            expect(change).toHaveBeenLastCalledWith('2026-10-26');
            await waitFor(() =>
                expect(within(group).getByRole('radio', { name: 'Monday, October 26, 2026' })).toHaveFocus()
            );
            await userEvent.click(screen.getByRole('button', { name: 'Next days' }));
            expect(within(group).getAllByRole('radio')[0]).toHaveAccessibleName('Tuesday, October 27, 2026');
        });
    });
});
