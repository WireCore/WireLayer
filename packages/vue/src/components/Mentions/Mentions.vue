<script setup lang="ts" generic="T = unknown">
import { useFieldContext } from '@ark-ui/vue/field';
import { LoaderCircle } from '@lucide/vue';
import {
    insertMention,
    mentionQuery,
    mentionSegments,
    mentions as mentionsRecipe,
    parseMentionMarkup,
    toMentionMarkup,
    updateMentions,
    type DataSource,
    type ItemAccessor,
    type ListOption,
    type Mention,
    type MentionQuery,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';
import { useOptionSource } from '../../utils/data-source.js';
import { useListOptions } from '../../utils/list.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

/** A character that opens suggestions, with its own entries (e.g. "@" people, "#" topics) */
export interface MentionTrigger<T = unknown> {
    char: string;
    items?: readonly T[];
    /** Loads the entries for the typed text instead of `items` */
    dataSource?: DataSource<T>;
}

export interface MentionsProps<T = unknown> {
    /** Text with markup: "Hello @[Anna Berg](anna)" – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Entries for "@" (shorthand for one trigger) */
    items?: readonly T[];
    /** Loads the "@" entries for the typed text */
    dataSource?: DataSource<T>;
    /** Entries are being loaded (after the search event): the list shows "Loading" */
    loading?: boolean;
    /** Several trigger characters with their own entries (replaces items/dataSource) */
    triggers?: readonly MentionTrigger<T>[];
    /** Text of an entry: property name or function (default `label`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Id of an entry in the markup: property name or function (default `value`, else `id`) */
    itemValue?: ItemAccessor<T, unknown>;
    /** Most suggestions shown (default 8) */
    limit?: number;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** Name of the hidden form field (the markup) */
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof mentionsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<MentionsProps<T>>(), {
    modelValue: undefined,
    defaultValue: '',
    limit: 8,
    rows: 3,
    disabled: undefined,
    readOnly: undefined,
    invalid: undefined,
    required: undefined,
});
const emit = defineEmits<{
    'update:modelValue': [value: string];
    /** The mentions in the text after every change */
    mentionsChange: [mentions: Mention[]];
    /** Text typed after a trigger (e.g. to load entries yourself) */
    search: [trigger: string, query: string];
}>();
defineSlots<{
    /** Content of a suggestion (instead of its text) */
    item?(props: { item: T; highlighted: boolean }): unknown;
}>();
const mentionsStyles = useRecipe('mentions', mentionsRecipe, () => props.classes);
const attrs = useAttrs();
const field = useFieldContext();
const t = useTranslations();
const styles = mentionsStyles();
const id = useId();
const listId = `${id}list`;
const hintId = `${id}hint`;
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea');
const highlighter = useTemplateRef<HTMLDivElement>('highlighter');

const triggerList = computed<readonly MentionTrigger<T>[]>(
    () => props.triggers ?? [{ char: '@', items: props.items, dataSource: props.dataSource }]
);
const chars = computed(() => triggerList.value.map((trigger) => trigger.char));
const internal = ref(props.defaultValue);
const markup = computed(() => props.modelValue ?? internal.value);
const parsed = computed(() => parseMentionMarkup(markup.value, chars.value));
const query = ref<MentionQuery | null>(null);
const active = computed(() => triggerList.value.find((trigger) => trigger.char === query.value?.trigger));
const accessors = computed(() => ({
    itemLabel: props.itemLabel,
    itemValue:
        props.itemValue ??
        ((item: T) =>
            typeof item === 'object' && item !== null
                ? ((item as Record<string, unknown>).value ?? (item as Record<string, unknown>).id)
                : item),
}));
const source = useOptionSource<T>({
    items: () => active.value?.items ?? [],
    source: () => active.value?.dataSource,
    accessors: () => accessors.value,
});
const { visible } = useListOptions(
    () => source.items.value,
    () => accessors.value,
    () => (active.value?.dataSource ? '' : (query.value?.query ?? ''))
);
const options = computed(() => visible.value.filter((option) => !option.disabled).slice(0, props.limit));
const highlighted = ref(0);
const busy = computed(() => props.loading || source.loading.value);
const open = computed(() => !!query.value && !!active.value && (options.value.length > 0 || busy.value));
const disabled = computed(() => props.disabled ?? field?.value.disabled);
const readOnly = computed(() => props.readOnly ?? field?.value.readOnly);
const invalid = computed(() => props.invalid ?? field?.value.invalid);
// A last empty line keeps its height in the layer behind the text
const segments = computed((): { text: string; mention?: Mention }[] => [
    ...mentionSegments(parsed.value.text, parsed.value.mentions),
    ...(parsed.value.text.endsWith('\n') ? [{ text: ' ' }] : []),
]);
const optionId = (index: number) => `${id}option${index}`;

function commit(text: string, mentions: Mention[]) {
    const next = toMentionMarkup(text, mentions);
    if (next === markup.value) return;
    internal.value = next;
    emit('update:modelValue', next);
    emit('mentionsChange', mentions);
}
function updateQuery(element: HTMLTextAreaElement, mentions: readonly Mention[] = parsed.value.mentions) {
    const next =
        element.selectionStart === element.selectionEnd
            ? mentionQuery(element.value, element.selectionStart, chars.value, mentions)
            : null;
    const changed = next?.trigger !== query.value?.trigger || next?.query !== query.value?.query;
    query.value = next;
    if (!next || !changed) return;
    highlighted.value = 0;
    emit('search', next.trigger, next.query);
    if (active.value?.dataSource) source.search(next.query);
}
function onInput(event: Event) {
    const element = event.target as HTMLTextAreaElement;
    const mentions = updateMentions(parsed.value.text, element.value, parsed.value.mentions);
    commit(element.value, mentions);
    updateQuery(element, mentions);
}
async function pick(option: ListOption<T>) {
    const element = textarea.value;
    if (!element || !query.value) return;
    const result = insertMention(parsed.value, query.value, element.selectionStart, {
        id: option.key,
        label: option.label,
    });
    query.value = null;
    commit(result.text, result.mentions);
    await nextTick();
    element.focus();
    element.setSelectionRange(result.caret, result.caret);
}
function onKeydown(event: KeyboardEvent) {
    if (!open.value) return;
    const count = options.value.length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (count) highlighted.value = (highlighted.value + (event.key === 'ArrowDown' ? 1 : count - 1)) % count;
    } else if ((event.key === 'Enter' || event.key === 'Tab') && count && !event.shiftKey) {
        event.preventDefault();
        void pick(options.value[highlighted.value]!);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        query.value = null;
    }
}
function onCaretMove(event: Event) {
    updateQuery(event.target as HTMLTextAreaElement);
}
function syncScroll() {
    if (highlighter.value && textarea.value) highlighter.value.scrollTop = textarea.value.scrollTop;
}
watch(options, () => {
    if (highlighted.value >= options.value.length) highlighted.value = 0;
});
</script>

<template>
    <!--
        Text field with mentions: "@" (or another trigger) opens suggestions below the field – arrow keys choose,
        Enter or Tab takes one, Escape closes them. Mentions are marked behind the text; the value keeps their ids.
    -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <div :class="styles.control()" :data-invalid="invalid || undefined" :data-disabled="disabled || undefined">
            <div ref="highlighter" :class="styles.highlighter()" aria-hidden="true">
                <template v-for="(segment, index) in segments" :key="index">
                    <mark v-if="segment.mention" :class="styles.mark()">{{ segment.text }}</mark>
                    <span v-else>{{ segment.text }}</span>
                </template>
            </div>
            <textarea
                v-bind="{ ...attrs, class: undefined, style: undefined }"
                :id="field?.ids.control ?? (attrs.id as string | undefined)"
                ref="textarea"
                :class="styles.textarea()"
                :value="parsed.text"
                :rows="rows"
                :placeholder="placeholder"
                :disabled="disabled"
                :readonly="readOnly"
                :required="(required ?? field?.required) || undefined"
                :aria-invalid="invalid || undefined"
                aria-autocomplete="list"
                :aria-controls="open ? listId : undefined"
                :aria-activedescendant="open && options.length ? optionId(highlighted) : undefined"
                :aria-describedby="[field?.ariaDescribedby, hintId].filter(Boolean).join(' ')"
                @input="onInput"
                @keydown="onKeydown"
                @click="onCaretMove"
                @keyup="['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes($event.key) && onCaretMove($event)"
                @blur="query = null"
                @scroll="syncScroll"
            />
        </div>
        <ul v-if="open" :id="listId" role="listbox" :aria-label="t.mentions.suggestions" :class="styles.content()">
            <li
                v-for="(option, index) in options"
                :id="optionId(index)"
                :key="option.key"
                role="option"
                :aria-selected="index === highlighted"
                :data-highlighted="index === highlighted || undefined"
                :class="styles.option()"
                @mousedown.prevent
                @click="pick(option)"
                @pointermove="highlighted = index"
            >
                <slot name="item" :item="option.item" :highlighted="index === highlighted">
                    <span :class="styles.optionBody()">
                        {{ option.label }}
                        <span v-if="option.description" :class="styles.optionDescription()">{{
                            option.description
                        }}</span>
                    </span>
                </slot>
            </li>
            <li v-if="busy" role="presentation" :class="styles.loading()">
                <LoaderCircle :class="styles.loadingIcon()" aria-hidden="true" />
                {{ t.common.loading }}
            </li>
        </ul>
        <span :id="hintId" :class="styles.status()">{{ t.mentions.hint(chars.join(' ')) }}</span>
        <span role="status" :class="styles.status()">{{ open ? t.mentions.count(options.length) : '' }}</span>
        <input v-if="name" type="hidden" :name="name" :value="markup" />
    </div>
</template>
