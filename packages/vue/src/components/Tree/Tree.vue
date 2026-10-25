<script setup lang="ts">
import { TreeView } from '@ark-ui/vue/tree-view';
import {
    tree as treeRecipe,
    type DataSource,
    type RecipeClasses,
    type TreeCheckedStrategy,
    type TreeMove,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, ref, toRef, useAttrs } from 'vue';
import { treeDragKey, treeModelKey } from './context.js';
import TreeNodeView from './TreeNodeView.vue';
import TreeToolbar from './TreeToolbar.vue';
import type { TreeDropAllowed, TreeNode, TreeNodeState, TreeTransfer } from './types.js';
import { useTree } from './useTree.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface TreeProps {
    items: readonly TreeNode[];
    /** Visible label, also the tree's accessible name */
    label?: string;
    selectionMode?: 'single' | 'multiple';
    /** Selected ids – use with v-model:selected-value */
    selectedValue?: string[];
    defaultSelectedValue?: string[];
    /** Expanded ids – use with v-model:expanded-value */
    expandedValue?: string[];
    defaultExpandedValue?: string[];
    /** A checkbox per node; checking a branch checks its children (v-model:checked-value) */
    checkable?: boolean;
    checkedValue?: string[];
    defaultCheckedValue?: string[];
    /** Check boxes of parents and children are independent (no cascade) */
    checkStrictly?: boolean;
    /**
     * Which checked ids are reported: `all` – every checked node, `parent` – a fully checked branch instead of its
     * children, `child` – only nodes without children. Without it the ids are reported as Ark keeps them.
     */
    checkedStrategy?: TreeCheckedStrategy;
    /**
     * Nodes can be moved: drag and drop (before, after or into a branch), Alt+arrow keys on the focused node
     * (up/down among the siblings, right into the branch above, left out of the branch), or Ctrl+X and Ctrl+V.
     * Reported via `move`.
     */
    reorderable?: boolean;
    /** Decides whether a node may go before, after or into another one (drag and drop, keyboard, paste) */
    allowDrop?: TreeDropAllowed;
    /**
     * Trees with the same group exchange nodes: drag and drop, or Ctrl+X in one tree and Ctrl+V in the other.
     * The receiving tree reports `transfer`; the parent moves the node between the items.
     */
    group?: string;
    /** Identifies this tree in `transfer` events (sourceTree/targetTree) */
    name?: string;
    /**
     * Loads the children of a node with `hasChildren: true` (or `leaf: false`) when it opens; the signal aborts
     * it. Without it (and without `dataSource`) the tree emits `loadChildren` and the parent adds the children.
     */
    loadChildren?: (node: TreeNode, request: { signal: AbortSignal }) => Promise<TreeNode[]>;
    /** Source of the children of lazy nodes (`getChildren`) */
    dataSource?: DataSource<TreeNode>;
    /** Search field above the tree; hits stay with their ancestors (opened), hits are marked */
    filter?: boolean;
    /** Search text – use with v-model:filter-value, or set it from a search field of your own */
    filterValue?: string;
    /** `filter`: only the hits and their ancestors stay; `highlight`: all nodes stay, Enter jumps to the next hit */
    filterMode?: 'filter' | 'highlight';
    /** Buttons "Expand all" and "Collapse all" above the tree */
    expandControls?: boolean;
    /** Guide lines along the children of open branches */
    showLines?: boolean;
    /** Shown without nodes (or without hits); the `empty` slot replaces it */
    emptyText?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof treeRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<TreeProps>(), {
    selectionMode: 'single',
    selectedValue: undefined,
    defaultSelectedValue: undefined,
    expandedValue: undefined,
    defaultExpandedValue: undefined,
    checkable: false,
    checkedValue: undefined,
    defaultCheckedValue: undefined,
    checkStrictly: false,
    checkedStrategy: undefined,
    reorderable: false,
    filter: false,
    filterValue: undefined,
    filterMode: 'filter',
    expandControls: false,
    showLines: false,
});
const tree = useRecipe('tree', treeRecipe, () => props.classes);
const emit = defineEmits<{
    'update:selectedValue': [ids: string[]];
    'update:expandedValue': [ids: string[]];
    'update:checkedValue': [ids: string[]];
    'update:filterValue': [text: string];
    /** A node was moved – apply it with moveTreeNode(items, move) */
    move: [move: TreeMove];
    /** A node of another tree (same group) was dropped or pasted here – move it between the items */
    transfer: [transfer: TreeTransfer];
    /** A lazy node opened and there is no loadChildren/dataSource: add its children to the items */
    loadChildren: [node: TreeNode];
}>();
const slots = defineSlots<{
    /** Content of a node (instead of icon and label); chevron and check box stay */
    node?(props: { node: TreeNode } & TreeNodeState): unknown;
    /** Shown without nodes or hits */
    empty?(): unknown;
}>();
const attrs = useAttrs();
const styles = tree();
const t = translations.tree;
const root = ref<{ $el: HTMLElement } | null>(null);
const rootElement = computed(() => root.value?.$el ?? null);
const model = useTree(props, emit, rootElement);
provide(treeDragKey, model.drag);
provide(treeModelKey, { ...model, showLines: toRef(props, 'showLines') });
const treeLabel = computed(
    () => props.label ?? (attrs['aria-label'] as string | undefined) ?? translations.tree.treeLabel
);
const searching = computed(() => props.filter || props.filterValue !== undefined);
const showEmpty = computed(
    () => !model.view.value.length && (emptyTextShown.value !== undefined || !!slots.empty || props.group !== undefined)
);
const emptyTextShown = computed(
    () =>
        props.emptyText ??
        (model.query.value.trim() ? t.noMatches : props.group !== undefined ? translations.common.empty : undefined)
);
const announces = computed(() => props.reorderable || model.lazy.value || searching.value || props.group !== undefined);

defineExpose({
    /** Opens every branch whose children are known */
    expandAll: model.expandAll,
    collapseAll: model.collapseAll,
    /** Forgets loaded children (of one node or all); open nodes load them again */
    invalidate: model.invalidate,
    /** Moves the focus to a node */
    focusNode: model.focusNode,
});
</script>

<template>
    <!--
        Tree (role="tree"): arrow keys move and open/close, Enter/Space select, typing jumps to a node.
        With `checkable`, Space checks the focused node instead (aria-checked on the treeitem).
    -->
    <TreeView.Root
        ref="root"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :collection="model.collection.value"
        :selection-mode="selectionMode"
        :selected-value="model.selected.value"
        :expanded-value="model.expanded.value"
        v-bind="model.ownChecks.value ? {} : { checkedValue, defaultCheckedValue }"
        :translations="{ treeLabel }"
        @selection-change="model.onSelectionChange($event.selectedValue)"
        @expanded-change="model.setExpanded($event.expandedValue)"
        @checked-change="model.ownChecks.value || model.onArkCheckedChange($event.checkedValue)"
        @keydown.capture="model.onKeydown"
    >
        <TreeView.Label v-if="label" :class="styles.label()">{{ label }}</TreeView.Label>
        <TreeToolbar
            :model="model"
            :filter="filter"
            :filter-mode="filterMode"
            :expand-controls="expandControls"
            :classes="classes"
        />
        <TreeView.Tree :class="styles.tree()" :hidden="showEmpty || undefined">
            <TreeNodeView
                v-for="(node, index) in model.view.value"
                :key="node.id"
                :node="node"
                :index-path="[index]"
                :checkable="checkable"
            >
                <template v-if="$slots.node" #node="state"><slot name="node" v-bind="state" /></template>
            </TreeNodeView>
        </TreeView.Tree>
        <div v-if="showEmpty" :class="styles.empty()" @dragover="model.onEmptyDragOver" @drop="model.onEmptyDrop">
            <slot name="empty">{{ emptyTextShown }}</slot>
        </div>
        <p v-if="announces" role="status" :class="styles.status()">{{ model.status.value }}</p>
    </TreeView.Root>
</template>
