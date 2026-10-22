'use client';

import { Badge } from '@wirecore/wirelayer-react';
import { DataTable, type DataTableColumn } from '@wirecore/wirelayer-react/data-table';
import { Container, Database, HardDrive, Server, type LucideIcon } from 'lucide-react';
import { usePageTexts } from './shell';

interface ServerRow {
    id: string;
    name: string;
    location: string;
    status: 'ONLINE' | 'MAINTENANCE' | 'OUTAGE';
    load: number;
    icon: LucideIcon;
}

const servers: ServerRow[] = [
    { id: 'web-01', name: 'web-01', location: 'Frankfurt', status: 'ONLINE', load: 42, icon: Server },
    { id: 'db-primary', name: 'db-primary', location: 'Frankfurt', status: 'ONLINE', load: 71, icon: Database },
    { id: 'k8s-node-3', name: 'k8s-node-3', location: 'Nuremberg', status: 'MAINTENANCE', load: 18, icon: Container },
    { id: 'backup-02', name: 'backup-02', location: 'Nuremberg', status: 'OUTAGE', load: 96, icon: HardDrive },
    { id: 'web-02', name: 'web-02', location: 'Frankfurt', status: 'ONLINE', load: 37, icon: Server },
];
const statusVariant = { ONLINE: 'success', MAINTENANCE: 'warn', OUTAGE: 'danger' } as const;

// Cell renderers are functions – the table lives in a client component
export function ServerTable() {
    const t = usePageTexts();
    const columns: DataTableColumn<ServerRow>[] = [
        {
            id: 'name',
            header: t.name,
            sortable: true,
            cell: (row) => (
                <span className="flex items-center gap-2.5">
                    <row.icon className="size-4 text-muted" aria-hidden="true" />
                    <span className="font-semibold">{row.name}</span>
                </span>
            ),
        },
        { id: 'location', header: 'Location', sortable: true },
        {
            id: 'status',
            header: 'Status',
            cell: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
        },
        {
            id: 'load',
            header: 'Load',
            sortable: true,
            align: 'end',
            cell: (_row, value) => <span className="font-mono text-xs">{String(value)}%</span>,
        },
    ];
    return (
        <DataTable
            data={servers}
            columns={columns}
            caption={t.servers}
            pageSize={4}
            getRowId={(row) => row.id}
            rowLabel={(row) => row.name}
            selectable
            search
            className="overflow-hidden rounded-2xl border border-line bg-card"
        />
    );
}
