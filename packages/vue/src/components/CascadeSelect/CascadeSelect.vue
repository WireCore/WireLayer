<script setup lang="ts" generic="V = string">
import { createListCollection } from '@ark-ui/vue/collection';
import { Combobox } from '@ark-ui/vue/combobox';
import { useFieldContext } from '@ark-ui/vue/field';
import { Menu } from '@ark-ui/vue/menu';
import { Check, ChevronDown, LoaderCircle, X } from '@lucide/vue';
import {
    controlIds,
    cascadeSelect as cascadeSelectRecipe,
    ChildrenLoader,
    isLazyNode,
    listValueKey,
    pluralText,
    searchCascade,
    withLoadedChildren,
    type ChildrenLoaderState,
    type DataSource,
    type ItemAccessor,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, provide, ref, shallowRef, useAttrs, useId } from 'vue';
import Highlight from '../Highlight/Highlight.vue';
import CascadeLevel from './CascadeLevel.vue';
import { cascadeKey, type CascadeOption } from './types.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface CascadeSelectProps<V = string> {
    items: readonly CascadeOption<V>[];
    /** Chosen value – use with v-model; any type (see `valueKey`) */
    modelValue?: V | null;
    defaultValue?: V | null;
    placeholder?: string;
    /** Separator of the path shown in the trigger ("Germany › Bavaria › Munich") */
    separator?: string;
    disabled?: boolean;
    invalid?: boolean;
    /** Identifies object values (property name or function), e.g. "id" – without it objects are compared by content */
    valueKey?: ItemAccessor<V, string | number>;
    /** The levels in between can be chosen, too (first entry of each level: "Choose <level>") */
    changeOnSelect?: boolean;
    /** Levels open on hover and click (default), or on click (and arrow keys) only */
    expandTrigger?: 'click' | 'hover';
    /** The field becomes a search field: hits as a flat list with their path; a button opens the levels */
    filter?: boolean;
    /** Button that clears the value (also Delete on the closed field) */
    clearable?: boolean;
    /** Shows a spinner in the field (aria-busy) */
    loading?: boolean;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: 'sm' | 'md' | 'lg';
    /** Loads the options of a level (`hasChildren: true`) when it opens; the signal aborts it */
    loadChildren?: (option: CascadeOption<V>, request: { signal: AbortSignal }) => Promise<CascadeOption<V>[]>;
    /** Source of the options of lazy levels (`getChildren`) */
    dataSource?: DataSource<CascadeOption<V>>;
    /** Id of the field (the trigger, with `filter` the search field), e.g. for a `<label for>` */
    id?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof cascadeSelectRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<CascadeSelectProps<V>>(), {
    modelValue: undefined,
    defaultValue: null,
    separator: ' › ',
    disabled: undefined,
    invalid: undefined,
    changeOnSelect: false,
    expandTrigger: 'hover',
    filter: false,
    clearable: false,
    loading: false,
    size: undefined,
});
const cascadeSelect = useRecipe('cascadeSelect', cascadeSelectRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: V | null];
    /** A lazy level opened and there is no loadChildren/dataSource: add its options to the items */
    loadChildren: [option: CascadeOption<V>];
}>();
const attrs = useAttrs();
const field = useFieldContext();
const locale = useLocale();
const styles = computed(() => cascadeSelect({ size: props.size, clearable: props.clearable && !props.filter }));
const uid = useId();
type Option = CascadeOption<V>;
const keyOf = (option: CascadeOption<unknown>) => listValueKey(option.value, props.valueKey);

// Options of lazy levels: from loadChildren/dataSource, or the parent (loadChildren event)
const loaded = shallowRef<ChildrenLoaderState<Option>>({ status: {}, children: {}, errors: {} });
const asked = ref(new Set<string>());
const loader = new ChildrenLoader<Option>({
    key: keyOf,
    load: (option, request) =>
        props.loadChildren
            ? props.loadChildren(option, request)
            : props.dataSource!.getChildren!(option, request).then((result) => result.items),
    onChange: (state) => {
        const before = loaded.value.status;
        loaded.value = state;
        for (const [key, value] of Object.entries(state.status)) {
            if (before[key] === value) continue;
            const label = labelOf(key);
            status.value =
                value === 'loading'
                    ? translations.tree.loadingNode(label)
                    : value === 'error'
                      ? translations.tree.loadError(label)
                      : pluralText(
                            translations.tree.loadedNode,
                            state.children[key]?.length ?? 0,
                            locale.value.locale
                        ).replace('{label}', label);
        }
    },
});
onBeforeUnmount(() => loader.dispose());
const ownLoader = () => !!props.loadChildren || !!props.dataSource?.getChildren;
const items = computed(() => withLoadedChildren(props.items, loaded.value.children, keyOf));
const status = ref('');

/** The path of options to the one with this key */
function pathTo(key: string | null, list: Option[] = items.value, path: Option[] = []): Option[] | undefined {
    if (key === null) return undefined;
    for (const option of list) {
        if (keyOf(option) === key) return [...path, option];
        const found = option.children && pathTo(key, option.children, [...path, option]);
        if (found) return found;
    }
    return undefined;
}
const labelOf = (key: string) => pathTo(key)?.at(-1)?.label ?? key;

provide(cascadeKey, {
    keyOf,
    statusOf: (option) =>
        isLazyNode(option)
            ? (loaded.value.status[keyOf(option)] ?? (asked.value.has(keyOf(option)) ? 'loading' : undefined))
            : undefined,
    open(option) {
        if (!isLazyNode(option)) return;
        if (ownLoader()) void loader.load(option as Option);
        else if (!asked.value.has(keyOf(option))) {
            asked.value = new Set([...asked.value, keyOf(option)]);
            status.value = translations.tree.loadingNode(option.label);
            emit('loadChildren', option as Option);
        }
    },
    retry(option) {
        if (ownLoader()) void loader.load(option as Option, { force: true });
        else emit('loadChildren', option as Option);
    },
    changeOnSelect: computed(() => props.changeOnSelect),
    clickOnly: computed(() => props.expandTrigger === 'click'),
});

const internal = ref<V | null>(props.defaultValue) as { value: V | null };
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const currentKey = computed(() =>
    current.value === null || current.value === undefined ? null : listValueKey(current.value, props.valueKey)
);
// A chosen value whose option is not loaded (yet) keeps the path it was chosen with
const remembered = shallowRef<Option[] | undefined>(undefined);
const path = computed(
    () =>
        pathTo(currentKey.value) ??
        (remembered.value && keyOf(remembered.value.at(-1)!) === currentKey.value ? remembered.value : undefined)
);
const pathText = computed(() => path.value?.map((option) => option.label).join(props.separator));
const placeholderText = computed(() => props.placeholder ?? translations.common.placeholder);
const text = computed(() => pathText.value ?? placeholderText.value);
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);
const isDisabled = computed(() => props.disabled ?? field?.value.disabled);
const isInvalid = computed(() => props.invalid ?? field?.value.invalid);
// An own id goes to the trigger (or the search field) through Ark, which finds its parts by their ids. Named by a
// <label for>, the trigger describes itself by the chosen path
const menuIds = computed(() => controlIds(props.id, 'trigger'));
const comboboxIds = computed(() =>
    controlIds(props.id, 'input', { label: field?.value.ids.label, input: field?.value.ids.control })
);
const labelledBy = computed(() => (field?.value ? `${field.value.ids.label} ${uid}value` : undefined));
const describedBy = computed(() =>
    field?.value ? field.value.ariaDescribedby : props.id && !ariaLabel.value ? `${uid}value` : undefined
);

function choose(key: string) {
    const found = pathTo(key);
    if (!found) return;
    remembered.value = found;
    const value = found.at(-1)!.value;
    internal.value = value;
    emit('update:modelValue', value);
}
function clear() {
    internal.value = null;
    emit('update:modelValue', null);
}
function onTriggerKeydown(event: KeyboardEvent) {
    if (!props.clearable || !path.value || (event.key !== 'Backspace' && event.key !== 'Delete')) return;
    event.preventDefault();
    clear();
}

// Search (filter): hits with their path; the text shows the chosen path while not typing
const editing = ref(false);
const query = ref('');
const matches = computed(() =>
    searchCascade(items.value, query.value, (option) => option.label, { changeOnSelect: props.changeOnSelect })
);
const collection = computed(() =>
    createListCollection({
        items: matches.value,
        itemToString: (match) => match.labels.join(props.separator),
        itemToValue: (match) => keyOf(match.node),
        isItemDisabled: () => false,
    })
);
const inputText = computed(() => (editing.value ? query.value : (pathText.value ?? '')));
function onInput(details: { inputValue: string; reason?: string }) {
    editing.value = details.reason === 'input-change';
    query.value = editing.value ? details.inputValue : '';
}
function onPick(keys: string[]) {
    editing.value = false;
    query.value = '';
    if (keys[0]) choose(keys[0]);
    else clear();
}
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const listPositioning = { sameWidth: true, gutter: 4 } as const;
const bottomEndPositioning = { placement: 'bottom-end', gutter: 4 } as const;
const bottomStartPositioning = { placement: 'bottom-start', gutter: 4 } as const;
</script>

<template>
    <!--
        Select with cascading levels: a menu whose groups open to the side (arrow right/left), the options are
        radio items. The trigger shows the whole path. With `filter` the field is a combobox: the hits are listed
        with their path, the button at its end opens the levels.
    -->
    <Combobox.Root
        v-if="filter"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :collection="collection"
        :model-value="currentKey ? [currentKey] : []"
        :input-value="inputText"
        :disabled="isDisabled"
        :invalid="isInvalid"
        :placeholder="placeholderText"
        :positioning="listPositioning"
        :translations="translations.combobox"
        :open-on-click="false"
        v-bind="comboboxIds"
        lazy-mount
        unmount-on-exit
        @value-change="onPick($event.value)"
        @input-value-change="onInput"
    >
        <Combobox.Control :class="styles.searchControl()" :data-invalid="isInvalid || undefined">
            <Combobox.Input
                :class="styles.searchInput()"
                :aria-label="field ? undefined : (ariaLabel ?? translations.cascadeSelect.search)"
                :aria-busy="loading || undefined"
            />
            <Combobox.ClearTrigger v-if="clearable" :class="styles.levelsTrigger()">
                <X :class="styles.clearIcon()" aria-hidden="true" />
            </Combobox.ClearTrigger>
            <Menu.Root :positioning="bottomEndPositioning" lazy-mount unmount-on-exit>
                <Menu.Trigger
                    :class="styles.levelsTrigger()"
                    :disabled="isDisabled"
                    :aria-label="translations.cascadeSelect.showLevels"
                >
                    <LoaderCircle v-if="loading" :class="styles.loadingIcon()" aria-hidden="true" />
                    <ChevronDown v-else :class="styles.indicatorIcon()" aria-hidden="true" />
                </Menu.Trigger>
                <Teleport to="body">
                    <Menu.Positioner>
                        <Menu.Content :class="styles.content()">
                            <CascadeLevel
                                :options="items as CascadeOption<unknown>[]"
                                :value="currentKey"
                                @choose="choose"
                            />
                        </Menu.Content>
                    </Menu.Positioner>
                </Teleport>
            </Menu.Root>
        </Combobox.Control>
        <Teleport to="body">
            <Combobox.Positioner>
                <Combobox.Content :class="styles.results()">
                    <Combobox.Empty :class="styles.empty()">{{ translations.common.noResults }}</Combobox.Empty>
                    <Combobox.Item
                        v-for="match in matches"
                        :key="keyOf(match.node)"
                        :item="match"
                        :class="styles.item()"
                    >
                        <component
                            :is="match.node.icon"
                            v-if="match.node.icon"
                            :class="styles.icon()"
                            aria-hidden="true"
                        />
                        <Combobox.ItemText :class="styles.path()">
                            <Highlight
                                :text="match.labels.join(separator)"
                                :query="query.split(/\s+/)"
                                ignore-accents
                            />
                        </Combobox.ItemText>
                        <Combobox.ItemIndicator>
                            <Check :class="styles.check()" aria-hidden="true" />
                        </Combobox.ItemIndicator>
                    </Combobox.Item>
                </Combobox.Content>
            </Combobox.Positioner>
        </Teleport>
        <span role="status" :class="styles.status()">{{ status }}</span>
    </Combobox.Root>
    <Menu.Root v-else :positioning="bottomStartPositioning" v-bind="menuIds" lazy-mount unmount-on-exit>
        <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
            <!-- No wrapper without a clear button (unchanged DOM) -->
            <div v-if="clearable" :class="styles.control()">
                <Menu.Trigger
                    :class="styles.trigger()"
                    :disabled="isDisabled"
                    :data-invalid="isInvalid || undefined"
                    :data-disabled="isDisabled || undefined"
                    :aria-invalid="isInvalid || undefined"
                    :aria-busy="loading || undefined"
                    :aria-label="field ? undefined : ariaLabel ? `${ariaLabel}: ${text}` : undefined"
                    :aria-labelledby="labelledBy"
                    :aria-describedby="describedBy"
                    @keydown="onTriggerKeydown"
                >
                    <span :id="`${uid}value`" :class="styles.value()" :data-placeholder-shown="!path || undefined">
                        {{ text }}
                    </span>
                    <Menu.Indicator :class="styles.indicator()">
                        <LoaderCircle v-if="loading" :class="styles.spinner()" aria-hidden="true" />
                        <ChevronDown v-else :class="styles.indicatorIcon()" aria-hidden="true" />
                    </Menu.Indicator>
                </Menu.Trigger>
                <!-- Not a tab stop: Backspace/Delete on the field clears, too -->
                <button
                    v-if="path && !isDisabled"
                    type="button"
                    tabindex="-1"
                    :class="styles.clear()"
                    :aria-label="translations.select.clear"
                    @click="clear"
                >
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </button>
            </div>
            <Menu.Trigger
                v-else
                :class="styles.trigger()"
                :disabled="isDisabled"
                :data-invalid="isInvalid || undefined"
                :data-disabled="isDisabled || undefined"
                :aria-invalid="isInvalid || undefined"
                :aria-busy="loading || undefined"
                :aria-label="field ? undefined : ariaLabel ? `${ariaLabel}: ${text}` : undefined"
                :aria-labelledby="labelledBy"
                :aria-describedby="describedBy"
            >
                <span :id="`${uid}value`" :class="styles.value()" :data-placeholder-shown="!path || undefined">
                    {{ text }}
                </span>
                <Menu.Indicator :class="styles.indicator()">
                    <LoaderCircle v-if="loading" :class="styles.spinner()" aria-hidden="true" />
                    <ChevronDown v-else :class="styles.indicatorIcon()" aria-hidden="true" />
                </Menu.Indicator>
            </Menu.Trigger>
        </div>
        <Teleport to="body">
            <Menu.Positioner>
                <Menu.Content :class="styles.content()">
                    <CascadeLevel :options="items as CascadeOption<unknown>[]" :value="currentKey" @choose="choose" />
                </Menu.Content>
            </Menu.Positioner>
        </Teleport>
        <span v-if="loadChildren || dataSource || asked.size" role="status" :class="styles.status()">{{ status }}</span>
    </Menu.Root>
</template>
