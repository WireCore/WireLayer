<script setup lang="ts">
import { type RecipeClasses, timeline as timelineRecipe } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs, useId, type Component } from 'vue';
import Button from '../Button/Button.vue';
import LoadMore from '../Select/LoadMore.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface TimelineItem {
    /** Shown above the title, e.g. "10/20/2026, 2:30 PM" */
    time: string;
    /** Machine-readable time for <time datetime>, e.g. "2026-10-20T14:30" */
    datetime?: string;
    title: string;
    description?: string;
    icon?: Component;
    status?: 'neutral' | 'success' | 'info' | 'warn' | 'danger';
    /** Text on the other side of the marker (or the #opposite slot), e.g. the author */
    opposite?: string;
}

export interface TimelineProps {
    items: readonly TimelineItem[];
    /** Accessible name of the list, e.g. "History" */
    label: string;
    /** Marker at the start (default), at the end, or in the middle with the content alternating sides (vertical only) */
    align?: 'start' | 'end' | 'alternate';
    /** Events side by side with a horizontal line */
    orientation?: 'vertical' | 'horizontal';
    /** Index of the current event: filled marker and aria-current="step" */
    activeIndex?: number;
    /**
     * A feed (role="feed"): each event is an article that takes the focus, Page Up/Down move between them; with
     * `hasMore` older events are loaded at the end
     */
    feed?: boolean;
    /** Older events can be loaded: the button "Load older entries" (and `autoLoad`) emits loadMore */
    hasMore?: boolean;
    /** Older events are loading (aria-busy on the feed) */
    loading?: boolean;
    /** Loads older events when the end of the feed scrolls into view (the button stays as fallback) */
    autoLoad?: boolean;
    /** Number of all events (aria-setsize); -1 when unknown (default: the number of items, or -1 with hasMore) */
    setSize?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof timelineRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TimelineProps>(), {
    align: 'start',
    orientation: 'vertical',
    activeIndex: undefined,
    feed: false,
    hasMore: false,
    loading: false,
    autoLoad: false,
    setSize: undefined,
});
const emit = defineEmits<{
    /** The feed wants older events (hasMore) */
    loadMore: [];
}>();
const slots = defineSlots<{
    /** Replaces time, title and description of an event */
    content?: (props: { item: TimelineItem; index: number }) => unknown;
    /** Content on the other side of the marker */
    opposite?: (props: { item: TimelineItem; index: number }) => unknown;
    /** Content of the marker (instead of the icon) */
    marker?: (props: { item: TimelineItem; index: number }) => unknown;
}>();
const timeline = useRecipe('timeline', timelineRecipe, () => props.classes);
const attrs = useAttrs();
const translations = useTranslations();
const id = useId();
const size = computed(() => props.setSize ?? (props.hasMore ? -1 : props.items.length));
// Feed keyboard (APG): Page Down/Up move to the next/previous article
function onFeedKeydown(event: KeyboardEvent) {
    if (event.key !== 'PageDown' && event.key !== 'PageUp') return;
    const articles = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(':scope > article')];
    const current = articles.findIndex((article) => article.contains(event.target as Node));
    const next = articles[current + (event.key === 'PageDown' ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    next.focus();
}
const horizontal = computed(() => props.orientation === 'horizontal');
const align = computed(() => (horizontal.value ? 'start' : props.align));
const withOpposite = computed(
    () => align.value === 'alternate' || !!slots.opposite || props.items.some((item) => item.opposite)
);
const styles = (item?: TimelineItem, index?: number) =>
    timeline({
        status: item?.status,
        active: index !== undefined && index === props.activeIndex,
        align: align.value,
        horizontal: horizontal.value,
        withOpposite: withOpposite.value,
    });
</script>

<template>
    <!-- Events in order (ordered list); the markers are decoration, the status colour is not the only cue -->
    <component
        :is="feed ? 'div' : 'ol'"
        :aria-label="label"
        :class="styles().base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        v-bind="feed ? { role: 'feed', 'aria-busy': loading || undefined } : {}"
        @keydown="feed && onFeedKeydown($event)"
    >
        <component
            :is="feed ? 'article' : 'li'"
            v-for="(item, index) in items"
            :key="index"
            :class="styles().item({ class: feed ? styles().article() : undefined })"
            :aria-current="index === activeIndex ? 'step' : undefined"
            v-bind="
                feed
                    ? {
                          tabindex: 0,
                          'aria-posinset': index + 1,
                          'aria-setsize': size,
                          ...($slots.content ? { 'aria-label': item.title } : { 'aria-labelledby': `${id}-${index}` }),
                      }
                    : {}
            "
        >
            <span :class="styles().rail()" aria-hidden="true" />
            <div v-if="withOpposite" :class="styles().opposite()">
                <slot name="opposite" :item="item" :index="index">{{ item.opposite }}</slot>
            </div>
            <span :class="styles(item, index).marker()" aria-hidden="true">
                <slot name="marker" :item="item" :index="index">
                    <component :is="item.icon" v-if="item.icon" :class="styles().markerIcon()" />
                </slot>
            </span>
            <div :class="styles(item, index).content()">
                <slot name="content" :item="item" :index="index">
                    <time :datetime="item.datetime" :class="styles().time()">{{ item.time }}</time>
                    <span :id="feed ? `${id}-${index}` : undefined" :class="styles(item, index).title()">{{
                        item.title
                    }}</span>
                    <span v-if="item.description" :class="styles().description()">{{ item.description }}</span>
                </slot>
            </div>
        </component>
    </component>
    <div v-if="feed && hasMore" :class="styles().more()">
        <Button variant="outline" size="sm" :loading="loading" @click="emit('loadMore')">{{
            loading ? translations.timeline.loading : translations.timeline.loadMore
        }}</Button>
        <LoadMore
            v-if="autoLoad"
            :class="styles().sentinel()"
            :active="!loading"
            :count="items.length"
            @load="emit('loadMore')"
        />
    </div>
    <p v-if="feed" role="status" :class="styles().status()">{{ loading ? translations.timeline.loading : '' }}</p>
</template>
