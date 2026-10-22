<script setup lang="ts">
import { ArrowUp, Paperclip, Square } from '@lucide/vue';
import {
    chatPrompt as chatPromptRecipe,
    chatPromptAction,
    promptHeight,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, onMounted, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';
import Chip from '../ChipGroup/Chip.vue';
import IconButton from '../IconButton/IconButton.vue';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface ChatPromptProps {
    /** The text – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Accessible name of the field (default "Message") */
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    /** A reply is being written: the send button becomes a stop button (emits stop) */
    responding?: boolean;
    /** A button to attach files */
    attachments?: boolean;
    /** Attached files – use with v-model:files */
    files?: File[];
    /** Accepted file types for attachments, e.g. "image/*,.pdf" */
    accept?: string;
    /** Lines the field grows to before it scrolls (default 8) */
    maxRows?: number;
    /** `enter` (default): Enter sends, Shift+Enter adds a line; `mod-enter`: Ctrl/Cmd+Enter sends */
    sendOn?: 'enter' | 'mod-enter';
    /** Shows how to send and add a line (default true) */
    hint?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof chatPromptRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ChatPromptProps>(), {
    modelValue: undefined,
    defaultValue: '',
    files: undefined,
    maxRows: 8,
    sendOn: 'enter',
    hint: true,
});
const emit = defineEmits<{
    'update:modelValue': [text: string];
    'update:files': [files: File[]];
    /** Send: the text (trimmed) and the attached files; the field is cleared afterwards */
    submit: [message: { text: string; files: File[] }];
    /** Stop the reply that is being written */
    stop: [];
}>();
const chatPrompt = useRecipe('chatPrompt', chatPromptRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.chatPrompt);
const styles = chatPrompt();
const id = useId();
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea');
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const internal = ref(props.defaultValue);
const text = computed(() => props.modelValue ?? internal.value);
const internalFiles = ref<File[]>([]);
const attached = computed(() => props.files ?? internalFiles.value);
const canSend = computed(() => !props.disabled && (!!text.value.trim() || attached.value.length > 0));
const LINE = 24;
const PADDING = 16;

function resize() {
    const element = textarea.value;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${promptHeight(element.scrollHeight, LINE, PADDING, props.maxRows)}px`;
}
onMounted(resize);
watch(text, () => void nextTick(resize));

function setText(value: string) {
    internal.value = value;
    emit('update:modelValue', value);
}
function setFiles(files: File[]) {
    internalFiles.value = files;
    emit('update:files', files);
}
function send() {
    if (!canSend.value || props.responding) return;
    emit('submit', { text: text.value.trim(), files: attached.value });
    setText('');
    if (attached.value.length) setFiles([]);
}
function onKeydown(event: KeyboardEvent) {
    if (chatPromptAction(event, props.sendOn) !== 'send') return;
    event.preventDefault();
    send();
}
function onFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    setFiles([...attached.value, ...(input.files ? [...input.files] : [])]);
    input.value = '';
}
function removeFile(index: number) {
    setFiles(attached.value.filter((_, position) => position !== index));
    textarea.value?.focus();
}
</script>

<template>
    <!-- A form with a growing text field: Enter sends, Shift+Enter adds a line; while replying a stop button -->
    <form
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        :data-disabled="disabled || undefined"
        @submit.prevent="send"
    >
        <ul v-if="attached.length" :class="styles.files()" :aria-label="locale.translations.chatMessage.attachments">
            <li v-for="(file, index) in attached" :key="`${file.name}-${index}`">
                <Chip
                    :label="file.name"
                    removable
                    :remove-label="t.removeFile(file.name)"
                    size="sm"
                    @remove="removeFile(index)"
                />
            </li>
        </ul>
        <textarea
            ref="textarea"
            :value="text"
            rows="1"
            :class="styles.textarea()"
            :style="{ '--wc-prompt-max': `${LINE * maxRows + PADDING}px` }"
            :aria-label="label ?? t.label"
            :aria-describedby="hint ? `${id}hint` : undefined"
            :placeholder="placeholder ?? t.placeholder"
            :disabled="disabled"
            @input="setText(($event.target as HTMLTextAreaElement).value)"
            @keydown="onKeydown"
        />
        <div :class="styles.footer()">
            <template v-if="attachments">
                <input
                    ref="fileInput"
                    type="file"
                    multiple
                    :accept="accept"
                    tabindex="-1"
                    aria-hidden="true"
                    :class="styles.fileInput()"
                    @change="onFiles"
                />
                <IconButton
                    :icon="Paperclip"
                    :label="t.attach"
                    variant="text"
                    size="sm"
                    :disabled="disabled"
                    @click="fileInput?.click()"
                />
            </template>
            <span v-if="hint" :id="`${id}hint`" :class="styles.hint()">{{
                sendOn === 'enter' ? t.hint : t.hintModEnter
            }}</span>
            <IconButton
                v-if="responding"
                :icon="Square"
                :label="t.stop"
                variant="secondary"
                size="sm"
                :class="styles.submit()"
                @click="emit('stop')"
            />
            <IconButton
                v-else
                type="submit"
                :icon="ArrowUp"
                :label="t.send"
                size="sm"
                :aria-disabled="canSend ? undefined : 'true'"
                :class="styles.submit()"
            />
        </div>
    </form>
</template>
