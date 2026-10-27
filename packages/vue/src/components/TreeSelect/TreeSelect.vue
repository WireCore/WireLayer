<script setup lang="ts" generic="T extends string | string[] | null = string | null">
import { useFieldContext } from '@ark-ui/vue/field';
import { Popover } from '@ark-ui/vue/popover';
import { ChevronDown, LoaderCircle, X } from '@lucide/vue';
import {
    controlIds,
    type DataSource,
    type RecipeClasses,
    type TreeCheckedStrategy,
    treeSelect as treeSelectRecipe,
    withLoadedChildren,
} from '@wirecore/wirelayer-recipes';
import { computed, h, normalizeClass, ref, shallowRef, useAttrs, useId, type FunctionalComponent } from 'vue';
import Tree from '../Tree/Tree.vue';
import { findTreeNode, type TreeNode } from '../Tree/types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

/** One node id, or several with `multiple` */
export type TreeSelectValue = string | string[] | null;

export interface TreeSelectProps<T extends TreeSelectValue = string | null> {
    items: readonly TreeNode[];
    /** Chosen node id (an array of ids with `multiple`) – use with v-model */
    modelValue?: T;
    defaultValue?: T;
    placeholder?: string;
    /** Only nodes without children can be chosen */
    leavesOnly?: boolean;
    defaultExpandedValue?: string[];
    disabled?: boolean;
    invalid?: boolean;
    /** Several nodes, chosen with check boxes; shown as chips in the field */
    multiple?: boolean;
    /** Which checked ids make up the value (`multiple`): `parent` (default) – a fully checked branch instead of its children, `all`, or `child` – only leaves */
    checkedStrategy?: TreeCheckedStrategy;
    /** Check boxes of parents and children are independent (`multiple`) */
    checkStrictly?: boolean;
    /** Chips shown before "+N" (`multiple`) */
    maxShown?: number;
    /** Search field above the tree */
    filter?: boolean;
    /** Button that clears the value (also Delete on the closed field) */
    clearable?: boolean;
    /** Shows a spinner in the field (aria-busy) */
    loading?: boolean;
    /** Height of the field: 32, 40 (default) or 48 px */
    size?: 'sm' | 'md' | 'lg';
    /** Loads the children of lazy nodes (`hasChildren: true`) when they open; they are kept while the field lives */
    loadChildren?: (node: TreeNode, request: { signal: AbortSignal }) => Promise<TreeNode[]>;
    /** Source of the children of lazy nodes (`getChildren`) */
    dataSource?: DataSource<TreeNode>;
    /** Id of the field (the trigger), e.g. for a `<label for>` */
    id?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof treeSelectRecipe>;
}

defineOptions({ inheritAttrs: false });
const translations = useTranslations();
const props = withDefaults(defineProps<TreeSelectProps<T>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    leavesOnly: false,
    defaultExpandedValue: undefined,
    disabled: undefined,
    invalid: undefined,
    multiple: false,
    checkedStrategy: 'parent',
    checkStrictly: false,
    maxShown: undefined,
    filter: false,
    clearable: false,
    loading: false,
    size: undefined,
});
const treeSelect = useRecipe('treeSelect', treeSelectRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: T];
    /** A lazy node opened and there is no loadChildren/dataSource: add its children to the items */
    loadChildren: [node: TreeNode];
}>();
const attrs = useAttrs();
const field = useFieldContext();
const styles = computed(() => treeSelect({ size: props.size, clearable: props.clearable && !props.multiple }));
const t = translations.treeSelect;
const uid = useId();
const open = ref(false);
const internal = ref<TreeSelectValue>(props.defaultValue ?? (props.multiple ? [] : null));
const current = computed(() => (props.modelValue === undefined ? internal.value : props.modelValue));
const ids = computed(() =>
    Array.isArray(current.value)
        ? current.value
        : current.value === null || current.value === undefined
          ? []
          : [current.value]
);

// Children loaded in the tree stay known when the panel closes (labels of chosen nodes, no second request)
const loaded = shallowRef<Record<string, TreeNode[]>>({});
const items = computed(() => withLoadedChildren(props.items, loaded.value));
const remember = (node: TreeNode) => (children: TreeNode[]) => {
    loaded.value = { ...loaded.value, [node.id]: children };
    return children;
};
const loadChildren = computed(() =>
    props.loadChildren
        ? (node: TreeNode, request: { signal: AbortSignal }) => props.loadChildren!(node, request).then(remember(node))
        : props.dataSource?.getChildren
          ? (node: TreeNode, request: { signal: AbortSignal }) =>
                props.dataSource!.getChildren!(node, request).then((result) => remember(node)(result.items))
          : undefined
);

const path = computed(() => (props.multiple ? undefined : findTreeNode(items.value, ids.value[0])));
const selected = computed(() => path.value?.at(-1));
const chosen = computed(() =>
    ids.value.map((value) => findTreeNode(items.value, value)?.at(-1) ?? { id: value, label: value })
);
const shown = computed(() => (props.maxShown === undefined ? chosen.value : chosen.value.slice(0, props.maxShown)));
const hidden = computed(() => chosen.value.length - shown.value.length);
const placeholderText = computed(() => props.placeholder ?? translations.common.placeholder);
const ariaLabel = computed(() => attrs['aria-label'] as string | undefined);
const isDisabled = computed(() => props.disabled ?? field?.value.disabled);
const isInvalid = computed(() => props.invalid ?? field?.value.invalid);
// The path of the chosen node stays open
const expanded = computed(
    () =>
        props.defaultExpandedValue ??
        (props.multiple
            ? [
                  ...new Set(
                      ids.value.flatMap(
                          (value) =>
                              findTreeNode(items.value, value)
                                  ?.slice(0, -1)
                                  .map((node) => node.id) ?? []
                      )
                  ),
              ]
            : path.value?.slice(0, -1).map((node) => node.id))
);
const status = ref('');

function commit(value: TreeSelectValue) {
    internal.value = value;
    emit('update:modelValue', value as T);
}
function choose(next: string[]) {
    const value = next[0] ?? null;
    const node = findTreeNode(items.value, value)?.at(-1);
    if (!value || (props.leavesOnly && node?.children)) return;
    commit(value);
    open.value = false;
}
function remove(node: TreeNode) {
    commit(ids.value.filter((value) => value !== node.id));
    status.value = translations.select.removed(node.label);
}
function clear() {
    commit(props.multiple ? [] : null);
}
function onTriggerKeydown(event: KeyboardEvent) {
    if (!ids.value.length || isDisabled.value) return;
    if (props.multiple && event.key === 'Backspace') {
        event.preventDefault();
        remove(chosen.value.at(-1)!);
    } else if (props.clearable && (event.key === 'Delete' || event.key === 'Backspace')) {
        event.preventDefault();
        clear();
    }
}
const valueText = computed(() =>
    props.multiple ? chosen.value.map((node) => node.label).join(', ') : (selected.value?.label ?? '')
);
const triggerLabel = computed(() =>
    field?.value
        ? undefined
        : ariaLabel.value
          ? `${ariaLabel.value}: ${valueText.value || placeholderText.value}`
          : undefined
);
// An own id goes to the trigger through Ark, which finds it by its id. Named by a <label for>, the trigger
// describes itself by the chosen nodes
const popoverIds = computed(() => controlIds(props.id, 'trigger'));
const labelledBy = computed(() => (field?.value ? `${field.value.ids.label} ${uid}value` : undefined));
const describedBy = computed(() =>
    field?.value ? field.value.ariaDescribedby : props.id && !ariaLabel.value ? `${uid}value` : undefined
);
/** Wraps its content in a div only when `wrap` is set (no extra element without a clear button) */
const Wrap: FunctionalComponent<{ wrap: boolean; class: string }> = (wrapProps, { slots }) =>
    wrapProps.wrap ? h('div', { class: wrapProps.class }, slots.default?.()) : slots.default?.();
Wrap.props = ['wrap', 'class'];
// Fixed objects: a new literal in the template on every render makes Ark update the machine, which can re-render
// endlessly (Vue only stops it in development)
const listPositioning = { placement: 'bottom-start', gutter: 4, sameWidth: true } as const;
</script>

<template>
    <!-- Select whose options are a tree: the button opens the tree in a panel, choosing a node closes it -->
    <Popover.Root v-model:open="open" :positioning="listPositioning" v-bind="popoverIds" lazy-mount unmount-on-exit>
        <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
            <!-- Several nodes: chips in a box, the trigger fills the rest of the row -->
            <div
                v-if="multiple"
                :class="styles.chipsControl()"
                :data-state="open ? 'open' : 'closed'"
                :data-invalid="isInvalid || undefined"
                :data-disabled="isDisabled || undefined"
            >
                <span v-for="node in shown" :key="node.id" :class="styles.chip()">
                    <span :class="styles.chipText()">{{ node.label }}</span>
                    <!-- Not a tab stop: Backspace on the field removes the last chip -->
                    <button
                        v-if="!isDisabled"
                        type="button"
                        tabindex="-1"
                        :class="styles.chipRemove()"
                        :aria-label="translations.select.removeItem(node.label)"
                        @click="remove(node)"
                    >
                        <X :class="styles.chipRemoveIcon()" aria-hidden="true" />
                    </button>
                </span>
                <span v-if="hidden > 0" :class="styles.chipMore()" :title="t.moreLabel(hidden)">
                    {{ t.more(hidden) }}
                </span>
                <Popover.Trigger
                    :class="styles.chipsTrigger()"
                    :disabled="isDisabled"
                    :data-disabled="isDisabled || undefined"
                    :aria-invalid="isInvalid || undefined"
                    :aria-busy="loading || undefined"
                    :aria-label="triggerLabel"
                    :aria-labelledby="labelledBy"
                    :aria-describedby="describedBy"
                    @keydown="onTriggerKeydown"
                >
                    <span
                        :id="`${uid}value`"
                        :class="styles.value()"
                        :data-placeholder-shown="!chosen.length || undefined"
                    >
                        <span v-if="chosen.length" :class="styles.hiddenValue()">{{ valueText }}</span>
                        <template v-else>{{ placeholderText }}</template>
                    </span>
                    <span v-if="loading" :class="styles.indicator()" aria-hidden="true">
                        <LoaderCircle :class="styles.spinner()" />
                    </span>
                    <ChevronDown
                        v-else
                        :class="styles.indicator()"
                        :data-state="open ? 'open' : 'closed'"
                        aria-hidden="true"
                    />
                </Popover.Trigger>
                <button
                    v-if="clearable && chosen.length && !isDisabled"
                    type="button"
                    tabindex="-1"
                    :class="styles.chipsClear()"
                    :aria-label="translations.select.clear"
                    @click="clear"
                >
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </button>
                <span role="status" :class="styles.status()">{{ status }}</span>
            </div>
            <!-- No wrapper without a clear button (unchanged DOM) -->
            <Wrap v-else :wrap="clearable" :class="styles.control()">
                <Popover.Trigger
                    :class="styles.trigger()"
                    :disabled="isDisabled"
                    :data-invalid="isInvalid || undefined"
                    :data-disabled="isDisabled || undefined"
                    :aria-invalid="isInvalid || undefined"
                    :aria-busy="loading || undefined"
                    :aria-label="triggerLabel"
                    :aria-labelledby="labelledBy"
                    :aria-describedby="describedBy"
                    @keydown="onTriggerKeydown"
                >
                    <span :id="`${uid}value`" :class="styles.value()" :data-placeholder-shown="!selected || undefined">
                        {{ selected?.label ?? placeholderText }}
                    </span>
                    <span v-if="loading" :class="styles.indicator()" aria-hidden="true">
                        <LoaderCircle :class="styles.spinner()" />
                    </span>
                    <ChevronDown
                        v-else
                        :class="styles.indicator()"
                        :data-state="open ? 'open' : 'closed'"
                        aria-hidden="true"
                    />
                </Popover.Trigger>
                <!-- Not a tab stop: Backspace/Delete on the field clears, too -->
                <button
                    v-if="clearable && selected && !isDisabled"
                    type="button"
                    tabindex="-1"
                    :class="styles.clear()"
                    :aria-label="translations.select.clear"
                    @click="clear"
                >
                    <X :class="styles.clearIcon()" aria-hidden="true" />
                </button>
            </Wrap>
        </div>
        <Teleport to="body">
            <Popover.Positioner>
                <Popover.Content :class="styles.content()" :aria-label="ariaLabel ?? placeholderText">
                    <Tree
                        v-if="multiple"
                        :items="items"
                        :aria-label="ariaLabel ?? placeholderText"
                        checkable
                        :checked-strategy="checkedStrategy"
                        :check-strictly="checkStrictly"
                        :checked-value="ids"
                        :default-expanded-value="expanded"
                        :filter="filter"
                        :load-children="loadChildren"
                        @update:checked-value="commit"
                        @load-children="emit('loadChildren', $event)"
                    />
                    <Tree
                        v-else
                        :items="items"
                        :aria-label="ariaLabel ?? placeholderText"
                        :selected-value="current ? [current as string] : []"
                        :default-expanded-value="expanded"
                        :filter="filter"
                        :load-children="loadChildren"
                        @update:selected-value="choose"
                        @load-children="emit('loadChildren', $event)"
                    />
                </Popover.Content>
            </Popover.Positioner>
        </Teleport>
    </Popover.Root>
</template>
