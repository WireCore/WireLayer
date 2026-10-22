import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { PickList, type PickListProps } from './PickList.js';

const people = [
    { value: 'jk', label: 'Julia Klein' },
    { value: 'ms', label: 'Max Schulz' },
    { value: 'al', label: 'Ana Lopez' },
    { value: 'tb', label: 'Tom Becker' },
    { value: 'sw', label: 'Sara Wolf' },
];

function Demo(args: PickListProps) {
    const [chosen, setChosen] = useState(['ms']);
    return (
        <div className="flex w-[36rem] flex-col gap-3">
            <PickList {...args} value={chosen} onValueChange={setChosen} />
            <span className="text-xs text-muted">In project: {chosen.join(', ') || '–'}</span>
        </div>
    );
}

const meta = {
    title: 'Data/PickList',
    component: PickList,
    args: { items: people, sourceLabel: 'Team', targetLabel: 'In project' },
    argTypes: { items: { control: false } },
    render: (args) => <Demo {...(args as PickListProps)} />,
} satisfies Meta<typeof PickList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

interface Member {
    id: number;
    name: string;
    role: string;
}
const members: Member[] = [
    { id: 1, name: 'Julia Klein', role: 'Project lead' },
    { id: 2, name: 'Max Schulz', role: 'Frontend' },
    { id: 3, name: 'Ana Lopez', role: 'Backend' },
    { id: 4, name: 'Tom Becker', role: 'Operations' },
    { id: 5, name: 'Sara Wolf', role: 'Design' },
];

function ObjectsDemo() {
    const [chosen, setChosen] = useState<Member[]>([members[1]!]);
    return (
        <div className="flex w-[40rem] flex-col gap-3">
            <PickList<Member, Member>
                items={members}
                itemValue={(member) => member}
                itemLabel="name"
                valueKey="id"
                sourceLabel="Team"
                targetLabel="In project"
                filter
                selectAll
                draggable
                value={chosen}
                onValueChange={setChosen}
                renderItem={(item) => (
                    <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate">{item.name}</span>
                        <span className="text-xs text-muted">{item.role}</span>
                    </span>
                )}
            />
            <span className="text-xs text-muted">
                In project: {chosen.map((member) => member.name).join(', ') || '–'}
            </span>
        </div>
    );
}

/** Objects as values, a search field and "Select all" per list, drag and drop between the lists */
export const ObjectsSearchDrag: Story = { name: 'Objects, search and drag', render: () => <ObjectsDemo /> };
