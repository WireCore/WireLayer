<script setup lang="ts">
import { Check, CheckCheck, CircleAlert, Clock, Paperclip } from '@lucide/vue';
import {
    chatMessage as chatMessageRecipe,
    formatFileSize,
    type ChatAttachment,
    type ChatStatus,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, useAttrs } from 'vue';
import Avatar from '../Avatar/Avatar.vue';
import Markdown from '../Markdown/Markdown.vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ChatMessageProps {
    /** Text of the message – Markdown unless `markdown` is false (the default slot replaces it) */
    text?: string;
    /** Render the text as Markdown (default true); otherwise plain text with its line breaks */
    markdown?: boolean;
    /** Name of the author, above the message */
    author?: string;
    /** Avatar image (default: the initials of the author) */
    avatar?: string;
    /** Time sent: ISO text, timestamp or Date */
    time?: string | number | Date;
    /** Delivery status of an own message: sending, sent, read, error */
    status?: ChatStatus;
    attachments?: readonly ChatAttachment[];
    /** start (others, default), end (own messages) or center (system notes) */
    align?: 'start' | 'end' | 'center';
    /** Follows a message of the same author: avatar and name only for screen readers */
    grouped?: boolean;
    /** The text is still being written: a cursor while it grows, aria-busy until it is complete */
    streaming?: boolean;
    /** Heading level of `#` in the Markdown (default 3) */
    headingLevel?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatMessageRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ChatMessageProps>(), { markdown: true, align: 'start', headingLevel: 3 });
defineSlots<{
    /** Own content instead of the text */
    default?(): unknown;
    /** Above the bubble, e.g. ChatThinking or ChatToolCall */
    before?(): unknown;
    /** Below the bubble, e.g. ChatSources */
    after?(): unknown;
    /** Buttons next to the status (copy, retry …) */
    actions?(): unknown;
}>();
const chatMessage = useRecipe('chatMessage', chatMessageRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chatMessage);
const styles = computed(() =>
    chatMessage({ align: props.align, grouped: props.grouped, status: props.status ?? 'none' })
);
const statusIcons = { sending: Clock, sent: Check, read: CheckCheck, error: CircleAlert };
const date = computed(() => {
    if (props.time === undefined) return undefined;
    const value = new Date(props.time);
    return Number.isNaN(value.getTime()) ? undefined : value;
});
const timeText = computed(() =>
    date.value ? new Intl.DateTimeFormat(locale.value.locale, { timeStyle: 'short' }).format(date.value) : ''
);
const empty = computed(() => !props.text);
</script>

<template>
    <!-- A message: author and time (only for screen readers when grouped), the bubble, the delivery status -->
    <article
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :aria-busy="streaming || undefined"
        :data-streaming="streaming || undefined"
    >
        <div v-if="align !== 'center'" :class="styles.avatar()" aria-hidden="true">
            <Avatar v-if="!grouped && (author || avatar)" :name="author" :src="avatar" size="sm" color="auto" />
        </div>
        <div :class="styles.body()">
            <div v-if="author || timeText" :class="styles.header()">
                <span v-if="author" :class="styles.author()">{{ author }}</span>
                <time v-if="date" :datetime="date.toISOString()" :class="styles.time()">{{ timeText }}</time>
            </div>
            <slot name="before" />
            <div v-if="$slots.default || !empty || streaming || attachments?.length" :class="styles.bubble()">
                <slot>
                    <Markdown v-if="markdown && !empty" :source="text!" :heading-level="headingLevel" breaks />
                    <p v-else-if="!empty" :class="styles.text()">{{ text }}</p>
                </slot>
                <template v-if="streaming">
                    <span v-if="empty" :class="styles.typing()" aria-hidden="true">
                        <span :class="styles.dot()" /><span :class="styles.dot()" /><span :class="styles.dot()" />
                    </span>
                    <span v-else :class="styles.cursor()" aria-hidden="true" />
                    <span :class="styles.srOnly()">{{ t.writing }}</span>
                </template>
                <ul v-if="attachments?.length" :class="styles.attachments()" :aria-label="t.attachments">
                    <li v-for="file in attachments" :key="file.name" :class="styles.attachment()">
                        <Paperclip :class="styles.attachmentIcon()" aria-hidden="true" />
                        <a v-if="file.href" :href="file.href" download>{{ file.name }}</a>
                        <span v-else>{{ file.name }}</span>
                        <span v-if="file.size !== undefined" :class="styles.attachmentSize()">{{
                            formatFileSize(file.size, locale.locale)
                        }}</span>
                    </li>
                </ul>
            </div>
            <slot name="after" />
            <div v-if="status || $slots.actions" :class="styles.meta()">
                <template v-if="status">
                    <component :is="statusIcons[status]" :class="styles.statusIcon()" aria-hidden="true" />
                    <span>{{ t.status[status] }}</span>
                </template>
                <span v-if="$slots.actions" :class="styles.actions()"><slot name="actions" /></span>
            </div>
        </div>
    </article>
</template>
