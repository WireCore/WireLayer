import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { GanttTask } from '@wirecore/wirelayer-recipes/native';
import { useState } from 'react';
import { Text, View } from 'react-native';
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
    return (
        <View className="gap-2">
            <Gantt
                {...args}
                tasks={items}
                onProgressChange={({ task, progress }) =>
                    setItems((old) => old.map((item) => (item.id === task.id ? { ...item, progress } : item)))
                }
                onTaskClick={(task) => setLast(task.name)}
            />
            <Text className="font-sans text-xs text-muted">Last selected: {last}</Text>
        </View>
    );
}

const meta = {
    title: 'Data/Gantt',
    component: Gantt,
    args: { tasks, title: 'Website relaunch' },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Gantt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Progress with the buttons beside the bar, the accessibility actions or the arrow keys on the bar (a slider) */
export const Editable: Story = {
    name: 'Editable',
    args: { editable: true },
    render: (args) => <Demo {...args} />,
};

/** Tasks without slack – a delay there moves the go-live – are named and outlined */
export const CriticalPath: Story = { name: 'Critical path', args: { showCriticalPath: true } };

/** Groups collapsed at the start */
export const Collapsed: Story = { name: 'Collapsed', args: { defaultExpanded: [] } };

/** Tasks still loading */
export const Loading: Story = { name: 'Loading', args: { tasks: [], loading: true } };

/** No tasks */
export const Empty: Story = { name: 'Empty', args: { tasks: [] } };
