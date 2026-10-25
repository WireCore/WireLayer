<script setup lang="ts">
import { Bell } from '@lucide/vue';
import {
    newestTime,
    newUnread,
    notificationCenter as notificationCenterRecipe,
    type DataSource,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onMounted, ref, useAttrs, watch } from 'vue';
import NotificationList from './NotificationList.vue';
import type { NotificationItem } from './types.js';
import Drawer from '../Drawer/Drawer.vue';
import DrawerContent from '../Drawer/DrawerContent.vue';
import IconButton from '../IconButton/IconButton.vue';
import Popover from '../Popover/Popover.vue';
import PopoverContent from '../Popover/PopoverContent.vue';
import PopoverTrigger from '../Popover/PopoverTrigger.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useDataSource } from '../../utils/data-source.js';

export interface NotificationCenterProps {
    /** The notifications (with `dataSource`: new ones pushed by the app, before the loaded pages) */
    items?: readonly NotificationItem[];
    /**
     * Notifications from a server, page by page (newest first): the first page is loaded at the start, "Load more"
     * loads the next; items marked as read are kept as read here (report them with markRead/markAllRead)
     */
    dataSource?: DataSource<NotificationItem>;
    /** Notifications per page of the data source (default 20) */
    pageSize?: number;
    /** Unread count on the bell when not all items are loaded (default: the unread items) */
    unreadCount?: number;
    /** Shows "Load more" below the list (loadMore event) */
    hasMore?: boolean;
    /** The next page is loading (the button stays focusable, aria-busy) */
    loading?: boolean;
    /** popover (default) next to the bell, or drawer from the side */
    display?: 'popover' | 'drawer';
    /** Controlled state – use with v-model:open */
    open?: boolean;
    /** Name of the bell and title of the panel (default "Notifications") */
    label?: string;
    /** Reference time for "Today"/"Yesterday" (default: now) */
    now?: Date | string;
    /** Text without notifications (default "No notifications") */
    emptyText?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof notificationCenterRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<NotificationCenterProps>(), {
    items: () => [],
    dataSource: undefined,
    pageSize: 20,
    display: 'popover',
    open: undefined,
});
const notificationCenter = useRecipe('notificationCenter', notificationCenterRecipe, () => props.classes);
const emit = defineEmits<{
    'update:open': [open: boolean];
    /** Mark one item as read */
    markRead: [id: string];
    markAllRead: [];
    /** Load the next page (hasMore) */
    loadMore: [];
    /** The title link of an item was clicked */
    select: [item: NotificationItem, event: MouseEvent];
}>();
defineSlots<{ 'item-actions'?(props: { item: NotificationItem }): unknown }>();
const attrs = useAttrs();
const translations = useTranslations();
const styles = computed(() => notificationCenter());
const name = computed(() => props.label ?? translations.notificationCenter.label);
const badgeLabel = (count: string | null) => translations.notificationCenter.unreadCount(count ?? '');
// Pages from a data source after the given items; read marks are kept here until the next load
const source = useDataSource<NotificationItem>({ source: () => props.dataSource, pageSize: () => props.pageSize });
onMounted(() => props.dataSource && source.open());
watch(
    () => props.dataSource,
    (dataSource) => dataSource && source.open()
);
const readIds = ref<ReadonlySet<string>>(new Set());
const all = computed(() => {
    const loaded = source.active.value
        ? [...props.items, ...source.state.value.items.filter((item) => !props.items.some((own) => own.id === item.id))]
        : props.items;
    return readIds.value.size
        ? loaded.map((item) => (readIds.value.has(item.id) ? { ...item, read: true } : item))
        : loaded;
});
const more = computed(() => (source.active.value ? source.state.value.hasMore : props.hasMore));
const busy = computed(() => props.loading || (source.active.value && source.state.value.status === 'loading'));
const unread = computed(() => props.unreadCount ?? all.value.filter((item) => !item.read).length);

const internal = ref(false);
const isOpen = computed(() => props.open ?? internal.value);
function setOpen(open: boolean) {
    internal.value = open;
    emit('update:open', open);
}

// New unread notifications are announced politely (not the ones present at the start or loaded as older pages)
const announcement = ref('');
let known: Set<string> | undefined;
let newest = -Infinity;
onMounted(() => {
    known = new Set(props.items.map((item) => item.id));
    newest = newestTime(props.items);
});
watch(
    () => props.items,
    (items) => {
        if (!known) return;
        const fresh = newUnread(known, items, newest);
        for (const item of items) known.add(item.id);
        newest = Math.max(newest, newestTime(items));
        if (fresh.length) announcement.value = translations.notificationCenter.announce(fresh.length, fresh[0]!.title);
    }
);
const listEvents = {
    onMarkRead: (id: string) => {
        if (source.active.value) readIds.value = new Set([...readIds.value, id]);
        emit('markRead', id);
    },
    onMarkAllRead: () => {
        if (source.active.value) readIds.value = new Set(all.value.map((item) => item.id));
        emit('markAllRead');
    },
    onLoadMore: () => (source.active.value ? source.loadMore() : emit('loadMore')),
    onSelect: (item: NotificationItem, event: MouseEvent) => emit('select', item, event),
};
</script>

<template>
    <!--
        Bell with the unread count (part of its name) that opens the notifications in a popover (role="dialog") or a
        drawer: grouped by day, unread marked with text, actions per item, "mark all as read", loading more; new
        notifications are announced politely
    -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <Popover v-if="display === 'popover'" :open="isOpen" placement="bottom-end" @update:open="setOpen">
            <PopoverTrigger>
                <IconButton :icon="Bell" :label="name" variant="text" :badge="unread" :badge-label="badgeLabel" />
            </PopoverTrigger>
            <PopoverContent
                :title="name"
                :classes="{ content: styles.panel(), title: styles.panelTitle(), body: styles.panelBody() }"
            >
                <NotificationList
                    :items="all"
                    :unread="unread"
                    :has-more="more"
                    :loading="busy"
                    :now="now"
                    :empty-text="emptyText"
                    :classes="classes"
                    v-bind="listEvents"
                >
                    <template #item-actions="{ item }"><slot name="item-actions" :item="item" /></template>
                </NotificationList>
            </PopoverContent>
        </Popover>
        <template v-else>
            <IconButton
                :icon="Bell"
                :label="name"
                variant="text"
                :badge="unread"
                :badge-label="badgeLabel"
                aria-haspopup="dialog"
                :aria-expanded="isOpen"
                @click="setOpen(true)"
            />
            <Drawer :open="isOpen" @update:open="setOpen">
                <DrawerContent :title="name" placement="right">
                    <NotificationList
                        :items="all"
                        :unread="unread"
                        :has-more="more"
                        :loading="busy"
                        :now="now"
                        :empty-text="emptyText"
                        :classes="classes"
                        v-bind="listEvents"
                    >
                        <template #item-actions="{ item }"><slot name="item-actions" :item="item" /></template>
                    </NotificationList>
                </DrawerContent>
            </Drawer>
        </template>
        <span role="status" :class="styles.status()">{{ announcement }}</span>
    </div>
</template>
