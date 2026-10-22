<script setup lang="ts">
import { Dialog } from '@ark-ui/vue/dialog';
import { createListCollection, Listbox } from '@ark-ui/vue/listbox';
import { useFilter } from '@ark-ui/vue/locale';
import { LoaderCircle, Search } from '@lucide/vue';
import {
    commandPalette as commandPaletteRecipe,
    dialog as dialogRecipe,
    highlightChunks,
    rankItems,
    type DataSource,
    type HighlightChunk,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, h, ref, watch, type Component } from 'vue';
import Kbd from '../Kbd/Kbd.vue';
import { useHotkeys, type HotkeyItem } from '../../composables/hotkeys.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useDataSource } from '../../utils/data-source.js';

const translations = useTranslations();

export interface CommandItem {
    value: string;
    label: string;
    /** Heading of the group, e.g. "Pages" or "Actions" */
    group?: string;
    icon?: Component;
    /** Further words that find the item */
    keywords?: string[];
    /** Shortcut hint on the right (display only) */
    shortcut?: string;
    /** Second line below the label */
    description?: string;
}

export interface CommandPaletteProps {
    items: CommandItem[];
    /** Open state – use with v-model:open */
    open?: boolean;
    /**
     * Opens with Strg+K / ⌘K anywhere on the page – or with own shortcuts: "mod+p", ["mod+k", "/"] (mod is Strg or ⌘;
     * shortcuts without Strg/⌘/Alt do not fire while typing in a field). `false` switches it off
     */
    hotkey?: boolean | string | string[];
    placeholder?: string;
    /** At most this many results */
    limit?: number;
    /**
     * Own matching: a score per item (higher first, `false`/0 hides it) – or `false` to show the items as they are
     * (results from the server, see `search`)
     */
    filter?: ((item: CommandItem, query: string) => number | boolean) | false;
    /** Marks the searched text in the labels */
    highlight?: boolean;
    /** Starts with an empty search field every time it opens */
    clearQueryOnClose?: boolean;
    /** Closes after running an item */
    closeOnSelect?: boolean;
    /** Results are being loaded (e.g. after `search`) */
    loading?: boolean;
    /**
     * Results from a server: asked with the search text after a typing pause (outdated answers dropped); they come
     * after the matching `items`
     */
    dataSource?: DataSource<CommandItem>;
    /** Fewest characters the search needs before the data source is asked (default 0) */
    minSearchLength?: number;
    /** Text when nothing matches */
    emptyText?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof commandPaletteRecipe>;
}

const props = withDefaults(defineProps<CommandPaletteProps>(), {
    open: undefined,
    hotkey: true,
    filter: undefined,
    highlight: true,
    clearQueryOnClose: true,
    closeOnSelect: true,
});
const commandPalette = useRecipe('commandPalette', commandPaletteRecipe, () => props.classes);
const dialog = useRecipe('dialog', dialogRecipe);
const emit = defineEmits<{
    'update:open': [open: boolean];
    select: [value: string];
    /** The search text changed – for results from the server (`:filter="false"`, `loading`) */
    filterChange: [query: string];
    /** @deprecated Same as `filterChange` (the name of the other lists) */
    search: [query: string];
}>();
const styles = commandPalette();
const backdrop = dialog().backdrop();
const t = translations.commandPalette;
const common = translations.common;

const internal = ref(false);
const isOpen = computed(() => props.open ?? internal.value);
const query = ref('');
function setOpen(next: boolean) {
    internal.value = next;
    if (next && props.clearQueryOnClose) query.value = '';
    emit('update:open', next);
}

// Filters without case and accents over label and keywords; groups keep their order
// Accent-blind ("nu" finds "Nürnberg"): German search collation would tell u and ü apart
const filters = useFilter({ sensitivity: 'base', usage: 'sort' });
const matches = computed(() => {
    const { filter, items, limit } = props;
    if (!query.value || filter === false) return limit === undefined ? items : items.slice(0, limit);
    if (filter) return rankItems(items, (item) => filter(item, query.value), limit);
    return rankItems(
        items,
        (item) => [item.label, ...(item.keywords ?? [])].some((text) => filters.value.contains(text, query.value)),
        limit
    );
});
const chunks = (label: string) =>
    props.highlight && query.value ? highlightChunks(label, query.value, { ignoreAccents: true }) : null;
// Server results: asked when it opens and while typing; they come after the matching items
const source = useDataSource<CommandItem>({
    source: () => props.dataSource,
    minSearchLength: () => props.minSearchLength,
});
watch(
    () => [isOpen.value, props.dataSource] as const,
    ([open, dataSource]) => open && dataSource && source.search(query.value, false),
    { immediate: true }
);
const busy = computed(() => props.loading || (source.active.value && source.state.value.status === 'loading'));
const results = computed(() =>
    source.active.value
        ? [
              ...matches.value,
              ...source.state.value.items.filter((item) => !matches.value.some((match) => match.value === item.value)),
          ]
        : matches.value
);
const emptyMessage = computed(() =>
    source.state.value.tooShort
        ? translations.dataSource.minSearch(props.minSearchLength ?? 0)
        : source.state.value.status === 'error'
          ? translations.dataSource.error
          : (props.emptyText ?? t.empty)
);
function onSearch(event: Event) {
    query.value = (event.target as HTMLInputElement).value;
    emit('filterChange', query.value);
    emit('search', query.value);
    if (props.dataSource) source.search(query.value);
}
const groups = computed(() => {
    const byGroup = new Map<string, CommandItem[]>();
    for (const item of results.value) byGroup.set(item.group ?? '', [...(byGroup.get(item.group ?? '') ?? []), item]);
    return [...byGroup];
});
const collection = computed(() => createListCollection({ items: results.value }));

function choose(values: string[]) {
    if (!values[0]) return;
    emit('select', values[0]);
    if (props.closeOnSelect) setOpen(false);
}

// Registered centrally (listed in the HotkeysDialog); toggles the palette like before
const hotkeys = computed(() =>
    props.hotkey === true ? ['mod+k'] : props.hotkey === false ? [] : [props.hotkey].flat()
);
useHotkeys(
    () => hotkeys.value.map((hotkey): HotkeyItem => [hotkey, () => setOpen(!isOpen.value)]),
    () => ({ description: translations.hotkeys.commandPalette })
);
// The label, with the matched parts marked
const CommandLabel = (labelProps: { label: string; chunks: HighlightChunk[] | null }) =>
    labelProps.chunks
        ? labelProps.chunks.map((chunk) => (chunk.match ? h('mark', { class: styles.mark() }, chunk.text) : chunk.text))
        : labelProps.label;
CommandLabel.props = ['label', 'chunks'];
</script>

<template>
    <!--
        Dialog with a search field (combobox) and the matching items (listbox): typing filters, arrow keys move,
        Enter runs, Escape closes. Strg+K / ⌘K opens it anywhere.
    -->
    <Dialog.Root :open="isOpen" lazy-mount unmount-on-exit @update:open="setOpen">
        <Teleport to="body">
            <Dialog.Backdrop :class="backdrop" />
            <Dialog.Positioner :class="styles.positioner()">
                <Dialog.Content :class="styles.content()" :aria-label="t.label">
                    <Listbox.Root
                        :collection="collection"
                        :class="styles.list()"
                        :model-value="[]"
                        @value-change="choose($event.value)"
                    >
                        <div :class="styles.search()">
                            <Search :class="styles.searchIcon()" aria-hidden="true" />
                            <Listbox.Input
                                :value="query"
                                :class="styles.input()"
                                role="combobox"
                                aria-expanded="true"
                                :aria-label="t.label"
                                :placeholder="placeholder ?? t.placeholder"
                                auto-highlight
                                @input="onSearch"
                            />
                        </div>
                        <div v-if="busy" :class="styles.loading()" role="status">
                            <LoaderCircle :class="styles.loadingIcon()" aria-hidden="true" />{{ common.loading }}
                        </div>
                        <Listbox.Content :class="styles.list()" :aria-label="t.label" :aria-busy="busy || undefined">
                            <Listbox.ItemGroup v-for="[group, entries] in groups" :key="group">
                                <Listbox.ItemGroupLabel v-if="group" :class="styles.groupLabel()">{{
                                    group
                                }}</Listbox.ItemGroupLabel>
                                <Listbox.Item
                                    v-for="item in entries"
                                    :key="item.value"
                                    :item="item"
                                    :class="styles.item()"
                                    :data-description="item.description ? '' : undefined"
                                >
                                    <component
                                        :is="item.icon"
                                        v-if="item.icon"
                                        :class="styles.icon()"
                                        aria-hidden="true"
                                    />
                                    <span v-if="item.description" :class="styles.itemBody()">
                                        <Listbox.ItemText :class="styles.label()">
                                            <CommandLabel :label="item.label" :chunks="chunks(item.label)" />
                                        </Listbox.ItemText>
                                        <span :class="styles.description()">{{ item.description }}</span>
                                    </span>
                                    <Listbox.ItemText v-else :class="styles.label()">
                                        <CommandLabel :label="item.label" :chunks="chunks(item.label)" />
                                    </Listbox.ItemText>
                                    <span v-if="item.shortcut" aria-hidden="true"
                                        ><Kbd>{{ item.shortcut }}</Kbd></span
                                    >
                                </Listbox.Item>
                            </Listbox.ItemGroup>
                            <p v-if="!results.length && !busy" :class="styles.empty()">{{ emptyMessage }}</p>
                        </Listbox.Content>
                    </Listbox.Root>
                    <div :class="styles.footer()" aria-hidden="true">
                        <span :class="styles.hint()"><Kbd>↑</Kbd><Kbd>↓</Kbd> {{ t.navigate }}</span>
                        <span :class="styles.hint()"><Kbd>Enter</Kbd> {{ t.run }}</span>
                        <span :class="styles.hint()"><Kbd>Esc</Kbd> {{ t.close }}</span>
                    </div>
                </Dialog.Content>
            </Dialog.Positioner>
        </Teleport>
    </Dialog.Root>
</template>
