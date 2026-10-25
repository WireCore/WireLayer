<script setup lang="ts">
import { Search } from '@lucide/vue';
import {
    addRecentEmoji,
    emojiCategories,
    emojiPicker as emojiPickerRecipe,
    gridIndexForKey,
    localeEmojis,
    searchEmojis,
    type EmojiCategory,
    type EmojiData,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';
import Input from '../Input/Input.vue';
import { useLocalStorage } from '../../composables/storage.js';
import { useLocale } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface EmojiPickerProps {
    /** The emojis to offer (default: about 500 common ones with names and search words in the language) */
    emojis?: readonly EmojiData[];
    /** Emojis per row (default 8) */
    columns?: number;
    /** Search field (default true) */
    search?: boolean;
    /** Remembers the last chosen emojis (localStorage, default true) */
    recent?: boolean;
    /** localStorage key of the recently used emojis */
    recentKey?: string;
    /** Most recently used emojis kept (default 24) */
    maxRecent?: number;
    /** Accessible name of the picker (default "Emojis") */
    label?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof emojiPickerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<EmojiPickerProps>(), {
    columns: 8,
    search: true,
    recent: true,
    recentKey: 'wirecore-emoji-recent',
    maxRecent: 24,
});
const emit = defineEmits<{
    /** An emoji was chosen (click, Enter or Space) */
    select: [emoji: EmojiData];
}>();
const emojiPicker = useRecipe('emojiPicker', emojiPickerRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.emojiPicker);
const styles = emojiPicker();
const headingId = `${useId()}heading`;
const grid = useTemplateRef<HTMLElement>('grid');
const icons: Record<EmojiCategory, string> = {
    recent: '🕘',
    smileys: '😀',
    people: '👋',
    nature: '🐶',
    food: '🍎',
    travel: '✈️',
    activities: '⚽',
    objects: '💡',
    symbols: '❤️',
};

const all = computed(() => props.emojis ?? localeEmojis(t.value.emojis));
const stored = useLocalStorage<string[]>(props.recentKey, []);
const recentEntries = computed(() =>
    props.recent
        ? stored.value.map((emoji) => all.value.find((entry) => entry.emoji === emoji)).filter((entry) => !!entry)
        : []
);
const categories = computed(() =>
    emojiCategories.filter((category) =>
        category === 'recent' ? recentEntries.value.length > 0 : all.value.some((entry) => entry.category === category)
    )
);
const chosen = ref<EmojiCategory | null>(null);
const category = computed(() =>
    chosen.value && categories.value.includes(chosen.value) ? chosen.value : (categories.value[0] ?? 'smileys')
);
const query = ref('');
const shown = computed(() => {
    if (query.value.trim()) return searchEmojis(all.value, query.value);
    if (category.value === 'recent') return recentEntries.value;
    return all.value.filter((entry) => entry.category === category.value);
});
const rows = computed(() => {
    const result: { entry: EmojiData; index: number }[][] = [];
    shown.value.forEach((entry, index) => {
        if (index % props.columns === 0) result.push([]);
        result.at(-1)!.push({ entry, index });
    });
    return result;
});
const focused = ref(0);
const preview = ref<EmojiData | null>(null);
watch(shown, () => {
    focused.value = 0;
    preview.value = null;
});

function pick(entry: EmojiData) {
    if (props.recent) stored.value = addRecentEmoji(stored.value, entry.emoji, props.maxRecent);
    emit('select', entry);
}
function focusCell(index: number) {
    focused.value = index;
    preview.value = shown.value[index] ?? null;
    void nextTick(() => grid.value?.querySelectorAll<HTMLElement>('button')[index]?.focus());
}
function onGridKeydown(event: KeyboardEvent) {
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const next = gridIndexForKey(event.key, focused.value, shown.value.length, props.columns, {
        ctrl: event.ctrlKey,
        rtl,
    });
    if (next === undefined) return;
    event.preventDefault();
    focusCell(next);
}
// Arrow down from the search field goes into the grid
function onSearchKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' || !shown.value.length) return;
    event.preventDefault();
    focusCell(0);
}
</script>

<template>
    <!--
        Emoji picker: search (English words and those of a language module), categories, a grid (arrow keys, Home/End,
        Ctrl+Home/End; Enter or Space chooses); the name of the focused emoji is shown below. Recently used emojis come
        first.
    -->
    <div
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        role="group"
        :aria-label="label ?? t.label"
    >
        <Input
            v-if="search"
            v-model="query"
            type="search"
            size="sm"
            :leading-icon="Search"
            clearable
            :placeholder="t.search"
            :aria-label="t.search"
            @keydown="onSearchKeydown"
        />
        <div v-if="!query.trim()" role="group" :aria-label="t.categoryNav" :class="styles.categories()">
            <button
                v-for="entry in categories"
                :key="entry"
                type="button"
                :class="styles.category()"
                :aria-pressed="entry === category"
                :aria-label="t.categories[entry]"
                :title="t.categories[entry]"
                @click="chosen = entry"
            >
                {{ icons[entry] }}
            </button>
        </div>
        <div :id="headingId" :class="styles.heading()">
            {{ query.trim() ? t.results : t.categories[category] }}
        </div>
        <div
            v-if="shown.length"
            ref="grid"
            role="grid"
            :aria-labelledby="headingId"
            :class="styles.grid()"
            :style="{ '--wc-columns': String(columns) }"
            @keydown="onGridKeydown"
        >
            <div v-for="(row, rowIndex) in rows" :key="rowIndex" role="row" :class="styles.row()">
                <div v-for="cell in row" :key="cell.entry.emoji" role="gridcell" :class="styles.cell()">
                    <button
                        type="button"
                        :class="styles.emoji()"
                        :tabindex="cell.index === focused ? 0 : -1"
                        :aria-label="cell.entry.name"
                        @click="pick(cell.entry)"
                        @focus="
                            focused = cell.index;
                            preview = cell.entry;
                        "
                        @mouseenter="preview = cell.entry"
                    >
                        {{ cell.entry.emoji }}
                    </button>
                </div>
            </div>
        </div>
        <p v-else :class="styles.empty()">{{ t.empty }}</p>
        <div :class="styles.footer()" aria-hidden="true">
            <template v-if="preview">
                <span :class="styles.footerEmoji()">{{ preview.emoji }}</span>
                <span>{{ preview.name }}</span>
            </template>
        </div>
        <span role="status" :class="styles.status()">{{ query.trim() ? t.count(shown.length) : '' }}</span>
    </div>
</template>
