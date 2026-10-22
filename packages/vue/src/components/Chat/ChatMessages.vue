<script setup lang="ts" generic="T extends ChatMessageData = ChatMessageData">
import { ArrowDown } from '@lucide/vue';
import {
    announce as announceText,
    chatDayKey,
    chatEntries,
    chatMessages as chatMessagesRecipe,
    isAtBottom,
    markdownToText,
    type ChatMessageData,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, onMounted, ref, useAttrs, useTemplateRef, watch } from 'vue';
import Button from '../Button/Button.vue';
import ChatMessage from './ChatMessage.vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ChatMessagesProps<T extends ChatMessageData = ChatMessageData> {
    /** The messages, oldest first */
    messages: T[];
    /** Accessible name of the list (default "Messages") */
    label?: string;
    /** Messages of the same author within this many minutes are grouped (default 5) */
    groupWithin?: number;
    /** A date line before the first message of each day (default true) */
    separators?: boolean;
    /** Today's date – the date lines then say "Today" and "Yesterday" (pass it from the server for hydration) */
    now?: string | number | Date;
    /** Message texts are Markdown (default true) */
    markdown?: boolean;
    /** Announces new messages of others – streamed ones once they are complete (default true) */
    announce?: boolean;
    /** Older messages can be loaded: a button at the top emits loadMore */
    hasMore?: boolean;
    loading?: boolean;
    /** Text without messages */
    emptyText?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatMessagesRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ChatMessagesProps<T>>(), {
    groupWithin: 5,
    separators: true,
    markdown: true,
    announce: true,
});
const emit = defineEmits<{
    /** Load older messages (they are added at the top, the view stays where it is) */
    loadMore: [];
}>();
defineSlots<{
    /** A message (default: ChatMessage) */
    message?(props: { message: T; grouped: boolean }): unknown;
}>();
const chatMessages = useRecipe('chatMessages', chatMessagesRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chatMessages);
const styles = chatMessages();
const viewport = useTemplateRef<HTMLElement>('viewport');

const entries = computed(() =>
    chatEntries(props.messages, { withinMinutes: props.groupWithin, separators: props.separators })
);
const dayText = (date: Date) => {
    if (props.now !== undefined) {
        const today = new Date(props.now);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (chatDayKey(date) === chatDayKey(today)) return t.value.today;
        if (chatDayKey(date) === chatDayKey(yesterday)) return t.value.yesterday;
    }
    return new Intl.DateTimeFormat(locale.value.locale, { dateStyle: 'full' }).format(date);
};
const streaming = computed(() => props.messages.some((message) => message.streaming));

// Following: at the end, new messages scroll into view; scrolled up, they are counted for the jump button
const atBottom = ref(true);
const unread = ref(0);
function scrollToEnd() {
    const element = viewport.value;
    if (element) element.scrollTop = element.scrollHeight;
}
function onScroll() {
    const element = viewport.value;
    if (!element) return;
    atBottom.value = isAtBottom(element);
    if (atBottom.value) unread.value = 0;
}
function jump() {
    scrollToEnd();
    unread.value = 0;
    atBottom.value = true;
    // The button disappears – the focus stays in the list
    viewport.value?.focus();
}

const seen = new Map<T['id'], boolean>();
const remember = () => {
    for (const message of props.messages) seen.set(message.id, !!message.streaming);
};
onMounted(() => {
    remember();
    scrollToEnd();
});
let restore: number | null = null;
function loadMore() {
    restore = viewport.value ? viewport.value.scrollHeight - viewport.value.scrollTop : null;
    emit('loadMore');
}
watch(
    () => props.messages.map((message) => `${message.id}:${message.text.length}:${!!message.streaming}`).join(),
    async () => {
        const follow = atBottom.value;
        let added = 0;
        for (const message of props.messages) {
            const before = seen.get(message.id);
            const isNew = before === undefined;
            const completed = before === true && !message.streaming;
            if (isNew && restore === null) added++;
            if (props.announce && !message.own && ((isNew && !message.streaming) || completed)) {
                const text = markdownToText(message.text);
                announceText(
                    t.value.announce(
                        message.author ?? locale.value.translations.chatMessage.assistant,
                        text.length > 300 ? `${text.slice(0, 300)} …` : text
                    )
                );
            }
        }
        remember();
        await nextTick();
        const element = viewport.value;
        if (restore !== null && element) {
            // Older messages came in at the top – keep the view
            element.scrollTop = element.scrollHeight - restore;
            restore = null;
            return;
        }
        if (follow) scrollToEnd();
        else unread.value += added;
    }
);
</script>

<template>
    <!--
        Message list: role="log" (announcements of new messages come from the live announcer, streamed ones once
        complete); aria-busy while a reply is being written. Scrolled up, a button leads to the new messages.
    -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div
            ref="viewport"
            role="log"
            aria-live="off"
            :aria-label="label ?? t.label"
            :aria-busy="streaming || undefined"
            tabindex="0"
            :class="styles.viewport()"
            @scroll="onScroll"
        >
            <Button v-if="hasMore" size="sm" variant="text" :loading="loading" :class="styles.more()" @click="loadMore">
                {{ t.loadMore }}
            </Button>
            <p v-if="!messages.length" :class="styles.empty()">{{ emptyText ?? t.empty }}</p>
            <template v-for="entry in entries" :key="entry.key">
                <div v-if="entry.type === 'separator'" :class="styles.separator()">
                    <span>{{ dayText(entry.date) }}</span>
                </div>
                <div v-else :class="styles.message()" :data-first="entry.first">
                    <slot name="message" :message="entry.message" :grouped="entry.grouped">
                        <ChatMessage
                            :text="entry.message.text"
                            :markdown="markdown"
                            :author="entry.message.author"
                            :avatar="entry.message.avatar"
                            :time="entry.message.time"
                            :status="entry.message.status"
                            :attachments="entry.message.attachments"
                            :align="entry.message.system ? 'center' : entry.message.own ? 'end' : 'start'"
                            :grouped="entry.grouped"
                            :streaming="entry.message.streaming"
                        />
                    </slot>
                </div>
            </template>
        </div>
        <Button
            v-if="unread > 0"
            size="sm"
            variant="secondary"
            :leading-icon="ArrowDown"
            :class="styles.jump()"
            @click="jump"
        >
            {{ t.jump }} ({{ t.newCount(unread) }})
        </Button>
    </div>
</template>
