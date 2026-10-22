import {
    ActionBar,
    Banner,
    Button,
    Carousel,
    confirm,
    ContextMenu,
    Countdown,
    DataList,
    DataListItem,
    EmptyState,
    Gauge,
    Markdown,
    Menu,
    NotificationCenter,
    Pagination,
    ProgressCircle,
    QrCode,
    RingProgress,
    SaveStatus,
    SimpleGrid,
    Stack,
    Statistic,
    Text,
    Timeline,
    toast,
    Truncate,
    useSelection,
    type NotificationItem,
} from '@wirecore/wirelayer-native';
import { CircleCheck, Euro, Eye, GitPullRequest, Inbox, Rocket, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

const customers = [
    { name: 'Northside Utilities', quote: 'Not a single unplanned downtime since the move.' },
    { name: 'Krume Bakery', quote: 'The shop is fast and the orders arrive safely.' },
    { name: 'Weber Law Firm', quote: 'Our files stay in Germany.' },
];

const files = ['Quote.pdf', 'Invoice-0815.pdf', 'Contract.docx'];

const notes = `**Release 2.4** brings invoices as PDF.

- Search across all projects
- [x] Translations
- [ ] Test with VoiceOver`;

/** Display and feedback: figures, charts, timeline, carousel, toasts, confirm(), menus and the notification center */
export function DisplayScreen() {
    const [page, setPage] = useState(1);
    const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [notifications, setNotifications] = useState<NotificationItem[]>(() => [
        { id: '1', title: 'Backup completed', description: 'web-01 · 12.4 GB', date: new Date() },
        { id: '2', title: 'Certificate renewed', date: new Date(Date.now() - 26 * 3_600_000), read: true },
    ]);
    const selection = useSelection(files);
    const [launch] = useState(() => Date.now() + (26 * 3600 + 12 * 60) * 1000);

    return (
        <Stack gap="lg">
            <View className="flex-row items-center justify-between">
                <Text variant="title">Display & feedback</Text>
                <NotificationCenter
                    items={notifications}
                    onMarkRead={(id) =>
                        setNotifications(notifications.map((item) => (item.id === id ? { ...item, read: true } : item)))
                    }
                    onMarkAllRead={() => setNotifications(notifications.map((item) => ({ ...item, read: true })))}
                />
            </View>

            <Banner variant="warn" title="Maintenance" dismissible>
                The customer portal is unavailable on Saturday from 10 PM to midnight.
            </Banner>

            <SimpleGrid columns={{ base: 2 }} gap="sm">
                <Statistic
                    label="Revenue"
                    value={48250}
                    formatOptions={{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }}
                    trend={12.4}
                    icon={Euro}
                    size="sm"
                    bordered
                />
                <Statistic label="Tickets" value={17} trend={-8} invertTrend size="sm" bordered />
            </SimpleGrid>

            <View className="flex-row flex-wrap items-end justify-around gap-4">
                <ProgressCircle value={72} label="Storage" size="sm" />
                <RingProgress
                    label="By type"
                    size="sm"
                    legend={false}
                    segments={[
                        { value: 38, label: 'Databases' },
                        { value: 21, label: 'Files' },
                    ]}
                />
                <Gauge value={76} label="CPU" size="sm" thresholds={[{ from: 70, status: 'warn' }]} />
            </View>

            <Countdown target={launch} label="Until the maintenance window" size="sm" />

            <Timeline
                label="Deployment"
                activeIndex={2}
                items={[
                    { time: '09:12', title: 'Submitted', icon: GitPullRequest },
                    { time: '10:40', title: 'Reviewed', icon: CircleCheck, status: 'success' },
                    { time: '14:05', title: 'Rolled out', icon: Rocket, status: 'info' },
                ]}
            />

            <Carousel items={customers} label="What our customers say">
                {(item) => (
                    <View className="h-32 gap-2 rounded-card border border-line bg-card p-4">
                        <Text variant="title">{item.name}</Text>
                        <Text variant="muted">{item.quote}</Text>
                    </View>
                )}
            </Carousel>

            <DataList orientation="horizontal" divided>
                <DataListItem label="Customer">Northside Utilities</DataListItem>
                <DataListItem label="Contract">MH-2026-118</DataListItem>
            </DataList>

            <Truncate
                lines={2}
                expandable
                text="We run your applications in two German data centers, back them up daily and monitor them around the clock. If something goes wrong, we get in touch before your customers notice."
            />

            <Markdown source={notes} />

            <View className="flex-row flex-wrap gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    onPress={() =>
                        toast.promise(new Promise((resolve) => setTimeout(resolve, 1200)), {
                            loading: 'Exporting …',
                            success: 'Export done',
                        })
                    }
                >
                    Export (Toast)
                </Button>
                <Button
                    size="sm"
                    variant="danger"
                    leadingIcon={Trash2}
                    onPress={async () => {
                        const ok = await confirm({
                            title: 'Delete server?',
                            description: 'web-01 and all backups will be removed permanently.',
                            status: 'danger',
                            confirmLabel: 'Delete',
                        });
                        toast({ title: ok ? 'Deleted' : 'Canceled', type: ok ? 'success' : 'info' });
                    }}
                >
                    Delete
                </Button>
                <Menu
                    title="View"
                    items={[
                        { type: 'checkbox', value: 'status', label: 'Status', checked: true },
                        { type: 'checkbox', value: 'owner', label: 'Owner' },
                        { type: 'separator' },
                        {
                            type: 'radio',
                            name: 'sort',
                            label: 'Sorting',
                            value: 'name',
                            items: [
                                { value: 'name', label: 'Name' },
                                { value: 'date', label: 'Date' },
                            ],
                        },
                    ]}
                >
                    <Button size="sm" variant="outline" leadingIcon={Eye}>
                        View
                    </Button>
                </Menu>
            </View>

            <View className="gap-2">
                {files.map((file) => (
                    <ContextMenu
                        key={file}
                        label={`Actions for ${file}`}
                        items={[
                            { value: 'select', label: selection.isSelected(file) ? 'Deselect' : 'Select' },
                            { value: 'delete', label: 'Delete', danger: true },
                        ]}
                        onSelect={(value) =>
                            value === 'select' ? selection.toggle(file) : toast({ title: `${file} deleted` })
                        }
                    >
                        <Pressable
                            role="button"
                            aria-pressed={selection.isSelected(file)}
                            className="rounded-lg border border-line bg-card p-3"
                            onPress={() => selection.toggle(file)}
                        >
                            <Text>{`${selection.isSelected(file) ? '✓ ' : ''}${file}`}</Text>
                        </Pressable>
                    </ContextMenu>
                ))}
                <ActionBar count={selection.selected.length} placement="inline" onClear={selection.clear}>
                    <Button size="sm" variant="text" onPress={() => toast({ title: 'Archived' })}>
                        Archive
                    </Button>
                </ActionBar>
            </View>

            <View className="flex-row items-center gap-3">
                <Button
                    size="sm"
                    variant="outline"
                    onPress={() => {
                        setSaving('saving');
                        setTimeout(() => setSaving('saved'), 800);
                    }}
                >
                    Save
                </Button>
                <SaveStatus status={saving} />
            </View>

            <Pagination count={240} page={page} onPageChange={setPage} variant="auto" />

            <View className="items-center">
                <QrCode value="https://customer-portal.example/ticket/2026-0815" size={140} />
            </View>

            <EmptyState icon={Inbox} title="No open tasks" description="New tasks appear here." size="sm" />
        </Stack>
    );
}
