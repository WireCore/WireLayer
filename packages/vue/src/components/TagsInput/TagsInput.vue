<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import { useFilter } from '@ark-ui/vue/locale';
import { TagsInput } from '@ark-ui/vue/tags-input';
import { LoaderCircle, X } from '@lucide/vue';
import { type DataSource, type RecipeClasses, tagsInput as tagsInputRecipe } from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs, useId } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import LoadMore from '../Select/LoadMore.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useDataSource } from '../../utils/data-source.js';

const translations = useTranslations();

export interface TagsInputProps {
    /** Entries – use with v-model */
    modelValue?: string[];
    defaultValue?: string[];
    placeholder?: string;
    /** Most entries allowed */
    max?: number;
    /** Characters that finish an entry besides Enter (default ",") */
    delimiter?: string;
    /** Accept a check, e.g. for e-mail addresses */
    validate?: (value: string) => boolean;
    disabled?: boolean;
    invalid?: boolean;
    name?: string;
    /** Suggestions while typing (entries already added are left out); arrow keys pick one, Enter adds it */
    suggestions?: readonly string[];
    /** Filters the suggestions by the typed text, ignoring case and accents (default true) */
    filter?: boolean;
    /** The suggestions are filtered elsewhere (server): no local filtering, listen to filterChange */
    manualFilter?: boolean;
    /** Shows "Loading" in the suggestions (aria-busy) */
    loading?: boolean;
    /** Text of the loading row */
    loadingText?: string;
    /** More suggestions can be loaded: scrolling to the end of the list emits loadMore */
    hasMore?: boolean;
    /**
     * Suggestions from a server instead of `suggestions`: asked with the typed text after a typing pause (outdated
     * answers dropped), more while scrolling
     */
    dataSource?: DataSource<string>;
    /** Fewest characters the typed text needs before the data source is asked (default 1) */
    minSearchLength?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tagsInputRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TagsInputProps>(), {
    modelValue: undefined,
    defaultValue: undefined,
    placeholder: undefined,
    max: undefined,
    delimiter: ',',
    validate: undefined,
    disabled: undefined,
    invalid: undefined,
    suggestions: undefined,
    filter: true,
    dataSource: undefined,
    minSearchLength: 1,
});
const tagsInput = useRecipe('tagsInput', tagsInputRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: string[]];
    /** Typed text – e.g. to load matching suggestions from a server (manualFilter) */
    filterChange: [text: string];
    /** The end of the suggestions was scrolled into view (hasMore) */
    loadMore: [];
}>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const styles = tagsInput();
// The input gets the Field's control id, so the Field label names it
const field = useFieldContext();
const ids = computed(() => (field?.value ? { input: field.value.ids.control } : undefined));
const check = computed(() =>
    props.validate ? (details: { inputValue: string }) => props.validate!(details.inputValue) : undefined
);

// Suggestions: a listbox below the field; the input is its combobox (Ark leaves Enter to it while an option is
// highlighted)
const listId = useId();
const query = ref('');
const open = ref(false);
const highlighted = ref(-1);
// Accent-blind ("nu" finds "Nürnberg"), like Combobox
const filters = useFilter({ sensitivity: 'base', usage: 'sort' });
function suggestionsFor(taken: string[]) {
    const added = new Set(taken.map((value) => value.toLocaleLowerCase()));
    const text = query.value.trim();
    return (suggestionList.value ?? []).filter(
        (suggestion) =>
            !added.has(suggestion.toLocaleLowerCase()) &&
            (!props.filter ||
                props.manualFilter ||
                !!props.dataSource ||
                !text ||
                filters.value.contains(suggestion, text))
    );
}
// Suggestions from a server: the typed text is the search, more pages while scrolling
const source = useDataSource<string>({ source: () => props.dataSource, minSearchLength: () => props.minSearchLength });
const suggestionList = computed(() => (props.dataSource ? source.state.value.items : props.suggestions));
const loading = computed(() => props.loading || (source.active.value && source.state.value.status === 'loading'));
const more = computed(() => (props.dataSource ? source.state.value.hasMore : props.hasMore));
function loadMore() {
    if (props.dataSource) source.loadMore();
    else emit('loadMore');
}
const isOpen = (list: string[], atMax: boolean) => open.value && !atMax && (list.length > 0 || loading.value);
const optionId = (index: number) => `${listId}-${index}`;

function onInputValueChange(text: string) {
    if (text === query.value) return;
    query.value = text;
    highlighted.value = -1;
    open.value = !!text;
    emit('filterChange', text);
    if (props.dataSource && text) source.search(text);
}
interface Api {
    value: string[];
    atMax: boolean;
    addValue(value: string): void;
    clearInputValue(): void;
}
function add(api: Api, suggestion: string) {
    api.addValue(suggestion);
    api.clearInputValue();
    open.value = false;
}
function onKeydown(event: KeyboardEvent, api: Api) {
    if (!suggestionList.value) return;
    const list = suggestionsFor(api.value);
    const shown = isOpen(list, api.atMax);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!shown) {
            open.value = true;
            highlighted.value = event.key === 'ArrowDown' ? 0 : list.length - 1;
            return;
        }
        const step = event.key === 'ArrowDown' ? 1 : -1;
        highlighted.value = (highlighted.value + step + list.length) % list.length;
    } else if (event.key === 'Enter' && shown && list[highlighted.value] !== undefined) {
        event.preventDefault();
        add(api, list[highlighted.value]!);
    } else if (event.key === 'Escape' && shown) {
        open.value = false;
    }
}
</script>

<template>
    <!--
        Free entries: Enter or "," adds, Backspace on the empty field selects the last entry (again removes it),
        arrow keys move between entries; additions and removals are announced. With suggestions the field is a
        combobox: Arrow down opens them, Enter adds the highlighted one.
    -->
    <TagsInput.Root
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :model-value="modelValue"
        :default-value="defaultValue"
        :max="max"
        :delimiter="delimiter"
        :validate="check"
        :disabled="disabled"
        :invalid="invalid"
        :name="name"
        :ids="ids"
        add-on-paste
        :translations="translations.tagsInput"
        @update:model-value="emit('update:modelValue', $event)"
        @input-value-change="onInputValueChange($event.inputValue)"
    >
        <TagsInput.Context v-slot="api">
            <TagsInput.Control :class="styles.control()">
                <TagsInput.Item
                    v-for="(value, index) in api.value"
                    :key="index"
                    :index="index"
                    :value="value"
                    :class="styles.item()"
                >
                    <TagsInput.ItemPreview :class="styles.preview()">
                        <TagsInput.ItemText>{{ value }}</TagsInput.ItemText>
                        <TagsInput.ItemDeleteTrigger :class="styles.delete()">
                            <X :class="styles.deleteIcon()" aria-hidden="true" />
                        </TagsInput.ItemDeleteTrigger>
                    </TagsInput.ItemPreview>
                    <TagsInput.ItemInput :class="styles.itemInput()" />
                </TagsInput.Item>
                <TagsInput.Input
                    v-if="suggestionList"
                    v-bind="split.rest"
                    :class="styles.input()"
                    :placeholder="placeholder"
                    :aria-describedby="field?.ariaDescribedby"
                    role="combobox"
                    aria-autocomplete="list"
                    :aria-expanded="isOpen(suggestionsFor(api.value), api.atMax)"
                    :aria-controls="listId"
                    :aria-busy="loading || undefined"
                    :aria-activedescendant="
                        isOpen(suggestionsFor(api.value), api.atMax) && highlighted >= 0
                            ? optionId(highlighted)
                            : undefined
                    "
                    @keydown="onKeydown($event, api)"
                    @blur="open = false"
                />
                <TagsInput.Input
                    v-else
                    v-bind="split.rest"
                    :class="styles.input()"
                    :placeholder="placeholder"
                    :aria-describedby="field?.ariaDescribedby"
                />
                <TagsInput.ClearTrigger v-if="api.value.length" :class="styles.clear()">
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </TagsInput.ClearTrigger>
            </TagsInput.Control>
            <div
                v-if="suggestionList && isOpen(suggestionsFor(api.value), api.atMax)"
                :id="listId"
                role="listbox"
                :aria-label="translations.select.suggestions"
                :aria-busy="loading || undefined"
                data-state="open"
                data-side="bottom"
                :class="styles.content()"
            >
                <!-- Pointer down keeps the focus in the field -->
                <div
                    v-for="(suggestion, index) in suggestionsFor(api.value)"
                    :id="optionId(index)"
                    :key="suggestion"
                    role="option"
                    :aria-selected="index === highlighted"
                    :data-highlighted="index === highlighted ? '' : undefined"
                    :class="styles.option()"
                    @pointerdown.prevent
                    @pointermove="highlighted = index"
                    @click="add(api, suggestion)"
                >
                    <span :class="styles.optionText()">{{ suggestion }}</span>
                </div>
                <div v-if="loading" :class="styles.loading()">
                    <LoaderCircle :class="styles.loadingIcon()" aria-hidden="true" />
                    {{ loadingText ?? translations.common.loading }}
                </div>
                <LoadMore
                    v-if="more"
                    :class="styles.sentinel()"
                    :active="!loading"
                    :count="suggestionsFor(api.value).length"
                    @load="loadMore"
                />
            </div>
        </TagsInput.Context>
        <TagsInput.HiddenInput />
    </TagsInput.Root>
</template>
