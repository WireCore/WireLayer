import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { ListboxItem } from '../Listbox/Listbox.js';
import { OrderList } from './OrderList.js';

const steps: ListboxItem[] = [
    { value: 'backup', label: 'Create backup' },
    { value: 'drain', label: 'Drain node' },
    { value: 'update', label: 'Install update' },
    { value: 'reboot', label: 'Restart' },
    { value: 'check', label: 'Check services' },
];

function Demo({ label }: { label: string }) {
    const [order, setOrder] = useState(steps);
    return (
        <div className="flex w-80 flex-col gap-3">
            <OrderList label={label} value={order} onValueChange={setOrder} />
            <span className="text-xs text-muted">Order: {order.map((step) => step.value).join(', ')}</span>
        </div>
    );
}

const meta = {
    title: 'Data/OrderList',
    component: OrderList,
    args: { label: 'Maintenance steps' },
    render: (args) => <Demo label={args.label} />,
} satisfies Meta<typeof OrderList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

interface Task {
    id: number;
    title: string;
    minutes: number;
}

function ObjectsDemo() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, title: 'Check backup', minutes: 15 },
        { id: 2, title: 'Install updates', minutes: 40 },
        { id: 3, title: 'Restart services', minutes: 5 },
        { id: 4, title: 'Check monitoring', minutes: 10 },
    ]);
    return (
        <div className="flex w-96 flex-col gap-3">
            <OrderList<Task, number>
                value={tasks}
                onValueChange={setTasks}
                label="Maintenance steps"
                itemValue="id"
                itemLabel="title"
                filter
                draggable
                renderItem={(item) => (
                    <>
                        <span className="flex-1 truncate">{item.title}</span>
                        <span className="text-xs text-muted">{item.minutes} min</span>
                    </>
                )}
            />
            <span className="text-xs text-muted">Order: {tasks.map((task) => task.id).join(', ')}</span>
        </div>
    );
}

/** Objects as items (itemValue/itemLabel), a search field, own content per item and moving by drag and drop */
export const ObjectsSearchDrag: Story = { name: 'Objects, search and drag', render: () => <ObjectsDemo /> };
