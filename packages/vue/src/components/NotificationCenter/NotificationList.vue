<script setup lang="ts">
import { Check } from '@lucide/vue';
import {
    dayLabel,
    groupByDay,
    notificationCenter as notificationCenterRecipe,
    notificationTime,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, useId } from 'vue';
import type { NotificationItem } from './types.js';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const props = defineProps<{
    items: NotificationItem[];
    unread: number;
    hasMore?: boolean;
    loading?: boolean;
    now?: Date | string;
    emptyText?: string;
    classes?: RecipeClasses<typeof notificationCenterRecipe>;
}>();
const emit = defineEmits<{
    markRead: [id: string];
    markAllRead: [];
    loadMore: [];
    select: [item: NotificationItem, event: MouseEvent];
}>();
defineSlots<{ 'item-actions'?(props: { item: NotificationItem }): unknown }>();
const notificationCenter = useRecipe('notificationCenter', notificationCenterRecipe, () => props.classes);
const translations = useTranslations();
const locale = useLocale();
const id = useId();
const groups = computed(() => groupByDay(props.items, props.now === undefined ? new Date() : new Date(props.now)));
const styles = computed(() => notificationCenter());
const itemStyles = (item: NotificationItem) => notificationCenter({ unread: !item.read });
</script>

<template>
    <div :class="styles.header()">
        <span>{{ translations.notificationCenter.unreadCount(unread) }}</span>
        <button type="button" :class="styles.markAll()" :disabled="unread === 0" @click="emit('markAllRead')">
            {{ translations.notificationCenter.markAllRead }}
        </button>
    </div>
    <div :class="styles.scroll()">
        <p v-if="items.length === 0" :class="styles.empty()">
            {{ emptyText ?? translations.notificationCenter.empty }}
        </p>
        <div v-for="group in groups" :key="group.day" :class="styles.group()">
            <p :id="`${id}-${group.day}`" :class="styles.groupTitle()">
                {{ dayLabel(group.day, locale.locale, translations.notificationCenter.older) }}
            </p>
            <ul :class="styles.list()" :aria-labelledby="`${id}-${group.day}`">
                <li v-for="item in group.items" :key="item.id" :class="itemStyles(item).item()">
                    <span v-if="!item.read" :class="styles.dot()" aria-hidden="true" />
                    <span v-else :class="styles.dotPlaceholder()" aria-hidden="true" />
                    <component :is="item.icon" v-if="item.icon" :class="styles.icon()" aria-hidden="true" />
                    <div :class="styles.body()">
                        <a
                            v-if="item.href"
                            :href="item.href"
                            :class="itemStyles(item).title({ class: styles.titleLink() })"
                            @click="emit('select', item, $event)"
                        >
                            <span v-if="!item.read" :class="styles.srOnly()"
                                >{{ translations.notificationCenter.unread }}:</span
                            >
                            {{ item.title }}
                        </a>
                        <span v-else :class="itemStyles(item).title()">
                            <span v-if="!item.read" :class="styles.srOnly()"
                                >{{ translations.notificationCenter.unread }}:</span
                            >
                            {{ item.title }}
                        </span>
                        <p v-if="item.description" :class="styles.description()">{{ item.description }}</p>
                        <time :datetime="new Date(item.date).toISOString()" :class="styles.time()">{{
                            notificationTime(item.date, group.day, locale.locale)
                        }}</time>
                    </div>
                    <div :class="styles.actions()">
                        <slot name="item-actions" :item="item" />
                        <IconButton
                            v-if="!item.read"
                            :icon="Check"
                            :label="`${translations.notificationCenter.markRead}: ${item.title}`"
                            variant="text"
                            size="xs"
                            @click="emit('markRead', item.id)"
                        />
                    </div>
                </li>
            </ul>
        </div>
        <div v-if="hasMore" :class="styles.more()">
            <Button size="sm" variant="text" :loading="loading" @click="emit('loadMore')">
                {{ translations.notificationCenter.loadMore }}
            </Button>
        </div>
    </div>
</template>
