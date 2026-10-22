<script setup lang="ts">
import { Container, Database, HardDrive, Server } from '@lucide/vue';
import { Badge, Card, ProgressCircle } from '@wirecore/wirelayer-vue';
import { DataTable } from '@wirecore/wirelayer-vue/data-table';
import { computed } from 'vue';
import { useHead } from '#imports';
import { usePageTexts } from '~/composables/useDemoLocale';

const t = usePageTexts();
useHead(() => ({ title: `${t.value.overview} · ${t.value.title}` }));

const servers = [
    { id: 'web-01', name: 'web-01', location: 'Frankfurt', status: 'ONLINE', load: 42, icon: Server },
    { id: 'db-primary', name: 'db-primary', location: 'Frankfurt', status: 'ONLINE', load: 71, icon: Database },
    { id: 'k8s-node-3', name: 'k8s-node-3', location: 'Nuremberg', status: 'MAINTENANCE', load: 18, icon: Container },
    { id: 'backup-02', name: 'backup-02', location: 'Nuremberg', status: 'OUTAGE', load: 96, icon: HardDrive },
    { id: 'web-02', name: 'web-02', location: 'Frankfurt', status: 'ONLINE', load: 37, icon: Server },
];
type ServerRow = (typeof servers)[number];
const statusVariant: Record<string, 'success' | 'warn' | 'danger'> = {
    ONLINE: 'success',
    MAINTENANCE: 'warn',
    OUTAGE: 'danger',
};
const columns = computed(() => [
    { id: 'name', header: t.value.name, sortable: true },
    { id: 'location', header: 'Location', sortable: true },
    { id: 'status', header: 'Status' },
    { id: 'load', header: 'Load', sortable: true, align: 'end' as const },
]);
</script>

<template>
    <div class="flex flex-col gap-6 p-6">
        <h1 class="text-2xl font-semibold">{{ t.overview }}</h1>
        <div class="grid gap-4 sm:grid-cols-3">
            <Card class="items-center">
                <ProgressCircle
                    :value="99.9"
                    :label="t.availability"
                    status="success"
                    :format-value="(v: number) => `${v}%`"
                />
            </Card>
            <Card class="items-center">
                <ProgressCircle :value="72" :label="t.storage" />
            </Card>
            <Card class="items-center">
                <ProgressCircle
                    :value="3"
                    :max="10"
                    :label="t.tickets"
                    status="warn"
                    :format-value="(v: number) => String(v)"
                />
            </Card>
        </div>
        <DataTable
            :data="servers"
            :columns="columns"
            :caption="t.servers"
            :page-size="4"
            :get-row-id="(row: ServerRow) => row.id"
            :row-label="(row: ServerRow) => row.name"
            selectable
            search
            class="overflow-hidden rounded-2xl border border-line bg-card"
        >
            <template #cell-name="{ row }">
                <span class="flex items-center gap-2.5">
                    <component :is="(row as ServerRow).icon" class="size-4 text-muted" aria-hidden="true" />
                    <span class="font-semibold">{{ (row as ServerRow).name }}</span>
                </span>
            </template>
            <template #cell-status="{ row }">
                <Badge :variant="statusVariant[(row as ServerRow).status]">{{ (row as ServerRow).status }}</Badge>
            </template>
            <template #cell-load="{ value }">
                <span class="font-mono text-xs">{{ value }}%</span>
            </template>
        </DataTable>
    </div>
</template>
