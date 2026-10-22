import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import type { DataRequest, GanttTask, SchedulerEvent } from '@wirecore/wirelayer-recipes';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Scheduler (resources, timeline, series, rules, range loading, "+N more", year, outside drops, time zone) and
// Gantt (treegrid keyboard, texts of dependencies) – the same in Vue and React

const resources = [
    { id: 'anna', label: 'Anna Berg' },
    { id: 'ben', label: 'Ben Ott' },
];
const events: SchedulerEvent[] = [
    { id: 'a', title: 'Planning', start: '2027-03-16T09:00', end: '2027-03-16T10:30', resourceId: 'anna' },
    { id: 'b', title: 'Review', start: '2027-03-16T10:00', end: '2027-03-16T11:00', resourceId: 'ben' },
];
const statusText = () =>
    within(screen.getByRole('region', { name: 'Calendar' }))
        .getAllByRole('status')
        .at(-1);

describe.each(frameworks)('%s Scheduler', (framework) => {
    it('resources as columns: Alt+Shift+arrow moves an event to the next resource', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Scheduler', { events, resources, defaultDate: '2027-03-16', editable: true, onEventChange: onChange })
        );
        expect(screen.getByRole('group', { name: 'Tuesday, March 16, 2027, Ben Ott' })).toBeInTheDocument();
        const planning = within(screen.getByRole('group', { name: 'Tuesday, March 16, 2027, Anna Berg' })).getByRole(
            'button',
            { name: /^Planning/ }
        );
        planning.focus();
        await userEvent.keyboard('{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ start: '2027-03-16T09:00', end: '2027-03-16T10:30', resourceId: 'ben' })
        );
        await waitFor(() =>
            expect(statusText()).toHaveTextContent('Planning: Tuesday, March 16, 2027, 09:00 AM–10:30 AM, Ben Ott')
        );
    });

    it('resourcesPerPage: a page of resource columns, buttons page through them, the page follows a move', async () => {
        const onChange = vi.fn();
        const many = [...resources, { id: 'cem', label: 'Cem Aydın' }, { id: 'dora', label: 'Dora Lenz' }];
        await render(
            framework,
            el('Scheduler', {
                events,
                resources: many,
                resourcesPerPage: 2,
                defaultDate: '2027-03-16',
                defaultView: 'day',
                editable: true,
                onEventChange: onChange,
            })
        );
        expect(screen.getByText('Resources 1–2 of 4')).toBeInTheDocument();
        expect(screen.queryByRole('group', { name: 'Tuesday, March 16, 2027, Cem Aydın' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Previous resources' })).toBeDisabled();
        await userEvent.click(screen.getByRole('button', { name: 'Next resources' }));
        expect(screen.getByText('Resources 3–4 of 4')).toBeInTheDocument();
        expect(screen.getByRole('group', { name: 'Tuesday, March 16, 2027, Cem Aydın' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Previous resources' }));
        const review = within(screen.getByRole('group', { name: 'Tuesday, March 16, 2027, Ben Ott' })).getByRole(
            'button',
            { name: /^Review/ }
        );
        review.focus();
        await userEvent.keyboard('{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ resourceId: 'cem' }));
        expect(screen.getByText('Resources 3–4 of 4')).toBeInTheDocument();
    });

    it('timeline: rows per resource; Alt+arrows move in time and between resources', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Scheduler', {
                events,
                resources,
                defaultDate: '2027-03-16',
                defaultView: 'timeline',
                editable: true,
                onEventChange: onChange,
            })
        );
        const anna = screen.getByRole('group', { name: 'Anna Berg' });
        const planning = within(anna).getByRole('button', { name: /^Planning/ });
        expect(planning).toHaveAccessibleName(/^Planning ?09:00 AM–10:30 AM$/);
        planning.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ resourceId: 'ben' }));
        await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ start: '2027-03-17T09:00', end: '2027-03-17T10:30', resourceId: 'anna' })
        );
        await userEvent.keyboard('{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ start: '2027-03-16T09:00', end: '2027-03-17T10:30' })
        );
        await userEvent.click(
            within(screen.getByRole('radiogroup', { name: 'Range' })).getByRole('radio', { name: 'Day' })
        );
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Tuesday, March 16, 2027');
        expect(
            within(screen.getByRole('group', { name: 'Ben Ott' })).getByRole('button', { name: /^Review/ })
        ).toBeVisible();
    });

    it('rules: canDrop and preventOverlap refuse a move, announce it and report dropRejected', async () => {
        const onChange = vi.fn();
        const onRejected = vi.fn();
        await render(
            framework,
            el('Scheduler', {
                events,
                resources,
                defaultDate: '2027-03-16',
                editable: true,
                preventOverlap: true,
                canDrop: (_: SchedulerEvent, start: string) => !start.startsWith('2027-03-15'),
                onEventChange: onChange,
                onDropRejected: onRejected,
            })
        );
        screen.getAllByRole('button', { name: /^Planning/ })[0]!.focus();
        await userEvent.keyboard('{Alt>}{Shift>}{ArrowRight}{/Shift}{/Alt}');
        expect(onRejected).toHaveBeenLastCalledWith(
            expect.objectContaining({ reason: 'overlap', resourceId: 'ben', start: '2027-03-16T09:00' })
        );
        await waitFor(() => expect(statusText()).toHaveTextContent('Planning cannot be dropped here: overlaps Review'));
        await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');
        expect(onRejected).toHaveBeenLastCalledWith(expect.objectContaining({ reason: 'rule' }));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('series: shown with icon and text; moving an occurrence asks for this one or all', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Scheduler', {
                events: [
                    {
                        id: 'jf',
                        title: 'Weekly sync',
                        start: '2027-03-08T09:00',
                        end: '2027-03-08T09:30',
                        rrule: 'FREQ=WEEKLY;BYDAY=MO,WE',
                    },
                ],
                defaultDate: '2027-03-16',
                editable: true,
                onEventChange: onChange,
            })
        );
        const occurrences = screen.getAllByRole('button', { name: /^Weekly sync/ });
        expect(occurrences).toHaveLength(2);
        expect(occurrences[0]).toHaveAccessibleName(
            /^Weekly sync ?09:00 AM–09:30 AM ?Recurring event: Weekly on Monday and Wednesday$/
        );
        occurrences[0]!.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        const dialog = await screen.findByRole('alertdialog', { name: 'Change recurring event' });
        expect(dialog).toHaveAccessibleDescription('“Weekly sync” is part of a series. What should change?');
        await userEvent.click(within(dialog).getByRole('button', { name: 'This event' }));
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                start: '2027-03-15T09:30',
                scope: 'occurrence',
                event: expect.objectContaining({ seriesId: 'jf', recurrenceId: '2027-03-15T09:00' }),
            })
        );
        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        screen.getAllByRole('button', { name: /^Weekly sync/ })[1]!.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await userEvent.click(await screen.findByRole('button', { name: 'All events in the series' }));
        expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ scope: 'series' }));
        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        screen.getAllByRole('button', { name: /^Weekly sync/ })[1]!.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('reports the shown range and loads it from the data source (cancelled, announced)', async () => {
        const onRange = vi.fn();
        const requests: DataRequest[] = [];
        const dataSource = {
            getItems: async (request: DataRequest) => {
                requests.push(request);
                return {
                    items: [
                        {
                            id: `x-${request.range!.start}`,
                            title: 'Loaded',
                            start: `${request.range!.start}T12:00`,
                            end: `${request.range!.start}T13:00`,
                        },
                    ],
                };
            },
        };
        await render(framework, el('Scheduler', { defaultDate: '2027-03-16', onRangeChange: onRange, dataSource }));
        expect(onRange).toHaveBeenLastCalledWith({ start: '2027-03-15', end: '2027-03-22', view: 'week' });
        await waitFor(() => expect(screen.getByRole('button', { name: /^Loaded/ })).toBeInTheDocument());
        await waitFor(() => expect(statusText()).toHaveTextContent('1 event loaded'));
        expect(requests[0]!.range).toEqual({ start: '2027-03-15', end: '2027-03-22' });
        expect(requests[0]!.signal).toBeInstanceOf(AbortSignal);
        await userEvent.click(screen.getByRole('button', { name: 'Next' }));
        expect(onRange).toHaveBeenLastCalledWith({ start: '2027-03-22', end: '2027-03-29', view: 'week' });
        await waitFor(() => expect(requests.at(-1)!.range).toEqual({ start: '2027-03-22', end: '2027-03-29' }));
        await userEvent.click(screen.getByRole('radio', { name: 'Month' }));
        expect(onRange).toHaveBeenLastCalledWith({ start: '2027-03-01', end: '2027-04-05', view: 'month' });
    });

    it('"+N more" opens a popover with all events of the day', async () => {
        const onClick = vi.fn();
        await render(
            framework,
            el('Scheduler', {
                events,
                defaultDate: '2027-03-16',
                defaultView: 'month',
                monthEventLimit: 1,
                morePopover: true,
                onEventClick: onClick,
            })
        );
        await userEvent.click(screen.getByRole('button', { name: '+1 more' }));
        const panel = await screen.findByRole('dialog', { name: 'Tuesday, March 16, 2027' });
        await userEvent.click(within(panel).getByRole('button', { name: '10:00 AM Review' }));
        expect(onClick).toHaveBeenLastCalledWith(events[1]);
    });

    it('year: days with events are named with their number; arrows move, Enter opens the day', async () => {
        await render(
            framework,
            el('Scheduler', { events, defaultDate: '2027-03-16', defaultView: 'year', views: ['day', 'year'] })
        );
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('2027');
        const day = screen.getByRole('button', { name: 'Tuesday, March 16, 2027, 2 events' });
        expect(day).toHaveAttribute('tabindex', '0');
        day.focus();
        await userEvent.keyboard('{ArrowRight}');
        expect(screen.getByRole('button', { name: 'Wednesday, March 17, 2027' })).toHaveFocus();
        await userEvent.keyboard('{PageDown}');
        expect(screen.getByRole('button', { name: 'Saturday, April 17, 2027' })).toHaveFocus();
        await userEvent.keyboard('{Enter}');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Saturday, April 17, 2027');
    });

    it('drops from outside on a day and filters by resource', async () => {
        const onDrop = vi.fn();
        await render(
            framework,
            el('Scheduler', {
                events,
                resources,
                defaultDate: '2027-03-16',
                defaultView: 'month',
                droppable: true,
                onExternalDrop: onDrop,
            })
        );
        const data = { title: 'Maintenance', duration: 90 };
        const dataTransfer = {
            types: ['application/x-wirecore-event', 'text/plain'],
            getData: (type: string) => (type === 'text/plain' ? 'Maintenance' : JSON.stringify(data)),
            dropEffect: 'none',
        };
        const cell = screen.getByRole('button', { name: 'Thursday, March 18, 2027' }).closest('td')!;
        fireEvent.dragOver(cell, { dataTransfer });
        fireEvent.drop(cell, { dataTransfer });
        expect(onDrop).toHaveBeenLastCalledWith({
            data,
            text: 'Maintenance',
            start: '2027-03-18',
            end: '2027-03-18',
            allDay: true,
        });
        await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Resource' }), 'Ben Ott');
        expect(screen.queryByRole('button', { name: /Planning/ })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Review/ })).toBeInTheDocument();
    });

    it('read-only offers no new events and ignores the keys; times are shown in the time zone', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Scheduler', {
                events: [{ id: 'z', title: 'Call', start: '2027-03-16T15:00Z', end: '2027-03-16T16:00Z' }],
                defaultDate: '2027-03-16',
                timeZone: 'America/New_York',
                editable: true,
                readOnly: true,
                onEventChange: onChange,
            })
        );
        expect(screen.queryByRole('button', { name: /^New event/ })).not.toBeInTheDocument();
        const call = screen.getByRole('button', { name: /^Call ?11:00 AM–12:00 PM$/ });
        call.focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('changes in a time zone carry its offset', async () => {
        const onChange = vi.fn();
        await render(
            framework,
            el('Scheduler', {
                events: [{ id: 'z', title: 'Call', start: '2027-03-16T15:00Z', end: '2027-03-16T16:00Z' }],
                defaultDate: '2027-03-16',
                timeZone: 'America/New_York',
                editable: true,
                onEventChange: onChange,
            })
        );
        screen.getByRole('button', { name: /^Call ?11:00 AM–12:00 PM$/ }).focus();
        await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith(
            expect.objectContaining({ start: '2027-03-16T11:30-04:00', end: '2027-03-16T12:30-04:00' })
        );
    });
});

describe.each(frameworks)('%s Gantt', (framework) => {
    const tasks: GanttTask[] = [
        { id: 'p', name: 'Concept', start: '2027-03-15', end: '2027-03-24' },
        { id: 'p1', name: 'Workshop', start: '2027-03-15', end: '2027-03-17', parentId: 'p', progress: 100 },
        {
            id: 'p2',
            name: 'Detailed concept',
            start: '2027-03-18',
            end: '2027-03-24',
            parentId: 'p',
            progress: 40,
            dependencies: ['p1'],
        },
        { id: 'm', name: 'Acceptance', start: '2027-03-26', end: '2027-03-26', milestone: true, dependencies: ['p2'] },
    ];

    it('task list as treegrid: levels, texts of dependencies and the critical path', async () => {
        await render(framework, el('Gantt', { tasks, showCriticalPath: true, today: '2027-03-16' }));
        const grid = screen.getByRole('treegrid', { name: 'Project plan' });
        const rows = within(grid).getAllByRole('row').slice(1);
        expect(rows).toHaveLength(4);
        expect(rows[0]).toHaveAttribute('aria-expanded', 'true');
        expect(rows[2]).toHaveAttribute('aria-level', '2');
        expect(
            within(rows[2]!)
                .getAllByRole('gridcell')
                .map((cell) => cell.textContent)
        ).toEqual([
            'Detailed concept, 40% done, depends on Workshop, critical path',
            '03/18/2027',
            '03/24/2027',
            '7 days',
        ]);
        expect(within(rows[3]!).getAllByRole('gridcell')[3]).toHaveTextContent('Milestone');
    });

    it('keyboard: arrows move between rows, Left/Right collapse and expand, Alt+arrows change the task', async () => {
        const onChange = vi.fn();
        const onProgress = vi.fn();
        await render(
            framework,
            el('Gantt', { tasks, editable: true, onTaskChange: onChange, onProgressChange: onProgress })
        );
        const rows = () => within(screen.getByRole('treegrid')).getAllByRole('row').slice(1);
        expect(rows()[0]).toHaveAttribute('tabindex', '0');
        rows()[0]!.focus();
        await userEvent.keyboard('{ArrowLeft}');
        expect(rows()[0]).toHaveAttribute('aria-expanded', 'false');
        expect(rows()).toHaveLength(2);
        await userEvent.keyboard('{ArrowRight}');
        expect(rows()).toHaveLength(4);
        await userEvent.keyboard('{ArrowDown}{ArrowDown}');
        expect(rows()[2]).toHaveFocus();
        await userEvent.keyboard('{Alt>}{ArrowRight}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith({ task: tasks[2], start: '2027-03-19', end: '2027-03-25' });
        await waitFor(() =>
            expect(within(screen.getByRole('region')).getAllByRole('status').at(-1)).toHaveTextContent(
                'Detailed concept: 03/19/2027 – 03/25/2027, 7 days'
            )
        );
        await userEvent.keyboard('{Alt>}{Shift>}{ArrowLeft}{/Shift}{/Alt}');
        expect(onChange).toHaveBeenLastCalledWith({ task: tasks[2], start: '2027-03-18', end: '2027-03-23' });
        await userEvent.keyboard('{Alt>}{ArrowUp}{/Alt}');
        expect(onProgress).toHaveBeenLastCalledWith({ task: tasks[2], progress: 50 });
        await userEvent.keyboard('{ArrowLeft}');
        expect(rows()[0]).toHaveFocus();
    });

    it('linkable: "Add dependency…" asks for a predecessor of the active task', async () => {
        const onLink = vi.fn();
        await render(framework, el('Gantt', { tasks, linkable: true, onDependencyCreate: onLink }));
        const rows = () => within(screen.getByRole('treegrid')).getAllByRole('row').slice(1);
        // The milestone: it depends on Detailed concept – only Concept and Workshop are left (no cycle, no duplicate)
        rows()[3]!.focus();
        await userEvent.click(screen.getByRole('button', { name: 'Add dependency…' }));
        const dialog = await screen.findByRole('dialog', { name: 'Predecessor of “Acceptance”' });
        const select = within(dialog).getByRole('combobox', { name: 'Predecessor' });
        expect(
            within(select)
                .getAllByRole('option')
                .map((option) => option.textContent)
        ).toEqual(['Concept', 'Workshop']);
        await userEvent.selectOptions(select, 'p1');
        await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }));
        expect(onLink).toHaveBeenCalledWith({ from: tasks[1], to: tasks[3] });
        await waitFor(() =>
            expect(within(screen.getByRole('region')).getAllByRole('status').at(-1)).toHaveTextContent(
                'Acceptance now depends on Workshop'
            )
        );
    });
});
