import {
    Badge,
    ChatMessages,
    ChatPrompt,
    Scheduler,
    Text,
    Tree,
    type ChatMessageData,
    type SchedulerEvent,
    type TreeNode,
} from '@wirecore/wirelayer-native';
import { DataTable, type DataTableColumn } from '@wirecore/wirelayer-native/data-table';
import { useRef, useState } from 'react';
import { View } from 'react-native';

interface Server {
    id: string;
    name: string;
    location: string;
    status: 'online' | 'maintenance' | 'offline';
    load: number;
}

const servers: Server[] = [
    { id: 's1', name: 'web-01', location: 'Frankfurt', status: 'online', load: 42 },
    { id: 's2', name: 'web-02', location: 'Frankfurt', status: 'online', load: 67 },
    { id: 's3', name: 'db-01', location: 'Nuremberg', status: 'maintenance', load: 18 },
    { id: 's4', name: 'mail-01', location: 'Berlin', status: 'online', load: 31 },
    { id: 's5', name: 'backup-01', location: 'Nuremberg', status: 'offline', load: 0 },
];
const statusLabel = { online: 'Online', maintenance: 'Maintenance', offline: 'Offline' } as const;
const statusVariant = { online: 'success', maintenance: 'warn', offline: 'danger' } as const;

const columns: DataTableColumn<Server>[] = [
    { id: 'name', header: 'Server', sortable: true },
    { id: 'location', header: 'Location', sortable: true, filter: 'select' },
    {
        id: 'status',
        header: 'Status',
        sortable: true,
        format: (value) => statusLabel[value as Server['status']],
        cell: (row) => <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>,
    },
    { id: 'load', header: 'Load', sortable: true, align: 'end', format: (value) => `${String(value)}%` },
];

const folders: TreeNode[] = [
    {
        id: 'customers',
        label: 'Customers',
        children: [
            { id: 'utilities', label: 'Northside Utilities', hasChildren: true },
            { id: 'bakery', label: 'Krume Bakery', hasChildren: true },
        ],
    },
    { id: 'internal', label: 'Internal', hasChildren: true },
];
const loadChildren = (node: TreeNode) =>
    new Promise<TreeNode[]>((done) =>
        setTimeout(
            () =>
                done([
                    { id: `${node.id}-contract`, label: 'Contract.pdf' },
                    { id: `${node.id}-quote`, label: 'Quote.pdf' },
                ]),
            600
        )
    );

const today = new Date();
const iso = (day: number, time?: string) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + day);
    const text = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return time ? `${text}T${time}` : text;
};
const events: SchedulerEvent[] = [
    {
        id: 'e1',
        title: 'Daily standup',
        start: iso(0, '09:00'),
        end: iso(0, '09:15'),
        rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    },
    { id: 'e2', title: 'Meeting with Northside Utilities', start: iso(0, '11:00'), end: iso(0, '12:00'), tone: 'info' },
    { id: 'e3', title: 'Maintenance window', start: iso(1, '22:00'), end: iso(1, '23:30'), tone: 'warn' },
    { id: 'e4', title: 'Frankfurt trade fair', start: iso(3), end: iso(5), allDay: true, tone: 'success' },
];

const greeting: ChatMessageData[] = [
    {
        id: 1,
        author: 'Assistant',
        text: 'Hello! I can look up **servers**, contracts and events.',
        time: new Date(),
    },
];

/** Data views of @wirecore/wirelayer-native: DataTable as cards, a tree that loads its children, chat and scheduler agenda */
export function DataScreen() {
    const [selection, setSelection] = useState<string[]>([]);
    const [messages, setMessages] = useState(greeting);
    const [responding, setResponding] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const send = ({ text }: { text: string }) => {
        const id = Date.now();
        setMessages((list) => [
            ...list,
            { id, own: true, author: 'You', text, time: new Date(), status: 'sent' },
            { id: id + 1, author: 'Assistant', text: '', time: new Date(), streaming: true },
        ]);
        setResponding(true);
        timer.current = setTimeout(() => {
            setMessages((list) =>
                list.map((message) =>
                    message.id === id + 1
                        ? { ...message, text: 'All servers in Frankfurt are online.', streaming: false }
                        : message
                )
            );
            setResponding(false);
        }, 1500);
    };

    return (
        <View className="gap-8">
            <View className="gap-3">
                <Text variant="title">Servers</Text>
                <DataTable
                    caption="Servers"
                    columns={columns}
                    data={servers}
                    getRowId={(row) => row.id}
                    rowLabel={(row) => row.name}
                    layout="cards"
                    search
                    selectable
                    selection={selection}
                    onSelectionChange={setSelection}
                />
                <Text variant="muted">Selected: {selection.length ? selection.join(', ') : '–'}</Text>
            </View>

            <View className="gap-3">
                <Text variant="title">Files</Text>
                <Tree
                    items={folders}
                    label="Folders"
                    loadChildren={loadChildren}
                    defaultExpandedValue={['customers']}
                />
            </View>

            <View className="gap-3">
                <Text variant="title">Assistant</Text>
                <View className="h-80">
                    <ChatMessages messages={messages} />
                </View>
                <ChatPrompt
                    responding={responding}
                    onSubmit={send}
                    onStop={() => {
                        clearTimeout(timer.current);
                        setResponding(false);
                        setMessages((list) => list.map((message) => ({ ...message, streaming: false })));
                    }}
                />
            </View>

            <View className="gap-3">
                <Text variant="title">Events</Text>
                <Scheduler events={events} defaultView="agenda" height={420} />
            </View>
        </View>
    );
}
