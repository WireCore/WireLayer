import type { Meta, StoryObj } from '@storybook/react-vite';
import type { GanttTask } from '@wirecore/wirelayer-recipes';
import { useState } from 'react';
import { Gantt, type GanttProps } from './Gantt.js';

const tasks: GanttTask[] = [
    { id: 'concept', name: 'Concept', start: '2026-10-12', end: '2026-10-30' },
    { id: 'kickoff', name: 'Kick-off', start: '2026-10-12', end: '2026-10-12', milestone: true, parentId: 'concept' },
    {
        id: 'interviews',
        name: 'User interviews',
        start: '2026-10-13',
        end: '2026-10-20',
        progress: 100,
        parentId: 'concept',
        dependencies: ['kickoff'],
    },
    {
        id: 'structure',
        name: 'Site structure',
        start: '2026-10-19',
        end: '2026-10-30',
        progress: 60,
        parentId: 'concept',
        dependencies: ['interviews'],
    },
    { id: 'design', name: 'Design', start: '2026-10-26', end: '2026-11-20' },
    {
        id: 'mockups',
        name: 'Mockups',
        start: '2026-10-26',
        end: '2026-11-06',
        progress: 30,
        parentId: 'design',
        dependencies: ['structure'],
        tone: 'info',
    },
    {
        id: 'styleguide',
        name: 'Style guide',
        start: '2026-11-02',
        end: '2026-11-20',
        progress: 10,
        parentId: 'design',
        tone: 'info',
    },
    {
        id: 'implementation',
        name: 'Implementation',
        start: '2026-11-09',
        end: '2026-12-11',
        dependencies: ['mockups'],
        tone: 'success',
    },
    {
        id: 'content',
        name: 'Add content',
        start: '2026-11-23',
        end: '2026-12-04',
        dependencies: ['styleguide'],
        tone: 'warn',
    },
    {
        id: 'launch',
        name: 'Go-live',
        start: '2026-12-14',
        end: '2026-12-14',
        milestone: true,
        dependencies: ['implementation', 'content'],
    },
];

function Demo(args: GanttProps) {
    const [items, setItems] = useState(args.tasks);
    const [last, setLast] = useState('–');
    const update = (id: string, change: Partial<GanttTask>) =>
        setItems((old) => old.map((task) => (task.id === id ? { ...task, ...change } : task)));
    return (
        <div className="flex max-w-6xl flex-col gap-2">
            <Gantt
                {...args}
                tasks={items}
                onTaskChange={({ task, start, end }) => update(task.id, { start, end })}
                onProgressChange={({ task, progress }) => update(task.id, { progress })}
                onDependencyCreate={({ from, to }) =>
                    update(to.id, { dependencies: [...(to.dependencies ?? []), from.id] })
                }
                onTaskClick={(task) => setLast(task.name)}
            />
            <span className="text-xs text-muted">Last: {last}</span>
        </div>
    );
}

const meta = {
    title: 'Data/Gantt',
    component: Gantt,
    args: { tasks, editable: true, today: '2026-10-21', title: 'Website relaunch' },
    argTypes: { defaultZoom: { control: 'inline-radio', options: ['day', 'week', 'month', 'quarter'] } },
    parameters: { layout: 'padded' },
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof Gantt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Tasks without slack – a delay there moves the go-live – are outlined and named in the list */
export const CriticalPath: Story = { name: 'Critical path', args: { showCriticalPath: true } };

/** Drag from the dot at the end of a bar onto another bar: a new finish-to-start dependency */
export const Linkable: Story = { name: 'Create dependencies', args: { linkable: true } };

/** Quarters for long plans, groups collapsed */
export const Quarters: Story = {
    name: 'Quarters',
    args: { defaultZoom: 'quarter', defaultExpanded: [], editable: false },
};
