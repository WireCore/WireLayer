import { CreditCard, HardDrive, ShieldAlert, UserPlus } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import NotificationCenter from './NotificationCenter.vue';
import type { NotificationItem } from './types.js';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';

const now = new Date();
const at = (daysAgo: number, hours: number, minutes = 0) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hours, minutes).toISOString();

const start: NotificationItem[] = [
    {
        id: '1',
        title: 'Backup complete',
        description: 'web-01 · 2.3 GB',
        date: at(0, 7, 30),
        icon: HardDrive,
        href: '#backup',
    },
    {
        id: '2',
        title: 'New team member',
        description: 'Julia Berg joined the team',
        date: at(0, 6, 5),
        icon: UserPlus,
    },
    { id: '3', title: 'October invoice ready', date: at(1, 16), read: true, icon: CreditCard, href: '#invoice' },
    {
        id: '4',
        title: 'Certificate expires in 14 days',
        description: 'portal.example.de',
        date: at(9, 9),
        icon: ShieldAlert,
    },
];

const meta: Meta<typeof NotificationCenter> = {
    title: 'Feedback/NotificationCenter',
    component: NotificationCenter,
    args: { items: start },
    argTypes: { items: { control: false }, display: { control: 'inline-radio', options: ['popover', 'drawer'] } },
    render: (args) => ({
        components: { Button, IconButton, NotificationCenter },
        setup: () => {
            const items = ref<NotificationItem[]>(args.items ?? start);
            const loading = ref(false);
            const more = ref(args.hasMore ?? true);
            const markRead = (id: string) =>
                (items.value = items.value.map((item) => (item.id === id ? { ...item, read: true } : item)));
            const markAllRead = () => (items.value = items.value.map((item) => ({ ...item, read: true })));
            const loadMore = () => {
                loading.value = true;
                setTimeout(() => {
                    items.value = [
                        ...items.value,
                        {
                            id: `old-${items.value.length}`,
                            title: 'Maintenance complete',
                            date: at(20, 23),
                            read: true,
                        },
                    ];
                    loading.value = false;
                    more.value = false;
                }, 800);
            };
            const simulate = () =>
                (items.value = [
                    {
                        id: `new-${items.value.length}`,
                        title: 'Deployment succeeded',
                        description: 'portal v4.2',
                        date: new Date().toISOString(),
                    },
                    ...items.value,
                ]);
            return { args, items, loading, more, markRead, markAllRead, loadMore, simulate, HardDrive };
        },
        template: `
            <div class="flex items-center gap-3">
                <NotificationCenter
                    v-bind="args"
                    :items="items"
                    :has-more="more"
                    :loading="loading"
                    @mark-read="markRead"
                    @mark-all-read="markAllRead"
                    @load-more="loadMore"
                >
                    <template #item-actions="{ item }">
                        <IconButton v-if="!item.href" :icon="HardDrive" :label="'Details: ' + item.title" variant="text" size="xs" />
                    </template>
                </NotificationCenter>
                <Button size="sm" variant="outline" @click="simulate">Simulate new notification</Button>
            </div>`,
    }),
};

export default meta;
type Story = StoryObj<typeof meta>;

/** Bell with counter; grouped by day, mark as read, load more; new notifications are announced politely */
export const Playground: Story = {};

/** In a drawer from the side */
export const Drawer: Story = { args: { display: 'drawer' } };

/** Nothing there */
export const Empty: Story = { args: { items: [], hasMore: false } };
