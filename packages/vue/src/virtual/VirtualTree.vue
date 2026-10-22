<script setup lang="ts">
import { TreeView, useTreeView } from '@ark-ui/vue/tree-view';
import { LoaderCircle } from '@lucide/vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
import { flattenTree, tree as treeRecipe, type TreeMove, type TreeRow } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, ref, useAttrs } from 'vue';
import type { TreeProps } from '../components/Tree/Tree.vue';
import { treeDragKey, treeModelKey } from '../components/Tree/context.js';
import TreeNodeView from '../components/Tree/TreeNodeView.vue';
import TreeToolbar from '../components/Tree/TreeToolbar.vue';
import type { TreeNode, TreeNodeState, TreeTransfer } from '../components/Tree/types.js';
import { useTree } from '../components/Tree/useTree.js';
import { useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';

export interface VirtualTreeProps extends Omit<TreeProps, 'showLines'> {
    /** Height of the scrolling tree (CSS length) */
    height?: string;
    /** Estimated row height in px (rows are measured when shown) */
    itemHeight?: number;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<VirtualTreeProps>(), {
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
    height: '20rem',
    itemHeight: 32,
});
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
const tree = useRecipe('tree', treeRecipe, () => props.classes);
const styles = tree();
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.tree;
const root = ref<{ $el: HTMLElement } | null>(null);
const model = useTree(
    props,
    emit,
    computed(() => root.value?.$el ?? null)
);
provide(treeDragKey, model.drag);
provide(treeModelKey, { ...model, showLines: computed(() => false) });

/** A row of the flat list: a node, or the loading row below an opening branch */
type Row = (TreeRow<TreeNode> & { kind: 'node' }) | { kind: 'loading'; parentId: string; level: number };
const rows = computed(() => {
    const list: Row[] = [];
    for (const row of flattenTree(model.view.value, model.expanded.value)) {
        list.push({ ...row, kind: 'node' });
        if (row.expanded && model.loadingOf(row.node))
            list.push({ kind: 'loading', parentId: row.node.id, level: row.level });
    }
    return list;
});
const viewport = ref<{ $el: HTMLElement } | null>(null);
const virtualizer = useVirtualizer(
    computed(() => ({
        count: rows.value.length,
        getScrollElement: () => viewport.value?.$el ?? null,
        estimateSize: () => props.itemHeight,
        measureElement: (element: Element) => element.getBoundingClientRect().height || props.itemHeight,
        overscan: 8,
        getItemKey: (index: number) => {
            const row = rows.value[index]!;
            return row.kind === 'node' ? row.node.id : `${row.parentId}\u0000loading`;
        },
        // Render the first rows before the tree is measured (SSR, tests)
        initialRect: { width: 0, height: 320 },
    }))
);
const indexOf = (id: string) => rows.value.findIndex((row) => row.kind === 'node' && row.node.id === id);
/** Focuses the element once it is rendered (a few frames at most) */
function focusWhenRendered(getElement: () => HTMLElement | null, frames = 6) {
    requestAnimationFrame(() => {
        const element = getElement();
        if (element) {
            if (element.ownerDocument.activeElement !== element) element.focus();
        } else if (frames > 0) focusWhenRendered(getElement, frames - 1);
    });
}
// Ark asks to scroll a node into view before it focuses it (arrow keys, Home/End, typeahead); the row may render a
// frame later than Ark focuses, so the focus is tried until it is there
function scrollToNode(details: { node: TreeNode; getElement: () => HTMLElement | null }) {
    const index = indexOf(details.node.id);
    if (index < 0) return;
    virtualizer.value.scrollToIndex(index, { align: 'auto' });
    focusWhenRendered(details.getElement);
}
const treeLabel = computed(
    () => props.label ?? (attrs['aria-label'] as string | undefined) ?? translations.tree.treeLabel
);
// Ark Vue's Root does not pass scrollToIndexFn on – the machine gets it here
const treeView = useTreeView(
    computed(() => ({
        collection: model.collection.value,
        selectionMode: props.selectionMode,
        selectedValue: model.selected.value,
        expandedValue: model.expanded.value,
        ...(model.ownChecks.value
            ? {}
            : { checkedValue: props.checkedValue, defaultCheckedValue: props.defaultCheckedValue }),
        translations: { treeLabel: treeLabel.value },
        scrollToIndexFn: scrollToNode,
        onSelectionChange: (details: { selectedValue: string[] }) => model.onSelectionChange(details.selectedValue),
        onExpandedChange: (details: { expandedValue: string[] }) => model.setExpanded(details.expandedValue),
        onCheckedChange: (details: { checkedValue: string[] }) =>
            model.ownChecks.value || model.onArkCheckedChange(details.checkedValue),
    }))
);
const emptyTextShown = computed(
    () =>
        props.emptyText ??
        (model.query.value.trim() ? t.noMatches : props.group !== undefined ? translations.common.empty : undefined)
);
const showEmpty = computed(
    () => !model.view.value.length && (emptyTextShown.value !== undefined || !!slots.empty || props.group !== undefined)
);

defineExpose({
    expandAll: model.expandAll,
    collapseAll: model.collapseAll,
    invalidate: model.invalidate,
    focusNode(id: string) {
        const index = indexOf(id);
        if (index >= 0) virtualizer.value.scrollToIndex(index, { align: 'auto' });
        requestAnimationFrame(() => model.focusNode(id));
    },
});
</script>

<template>
    <!--
        Tree for many nodes: the open part of the tree as a flat, virtualised list of treeitems (aria-level,
        aria-posinset, aria-setsize) – only the rows in view are in the DOM. Same props and keyboard as Tree.
    -->
    <TreeView.RootProvider
        ref="root"
        :value="treeView"
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
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
        <TreeView.Tree
            ref="viewport"
            :class="styles.tree({ class: styles.viewport() })"
            :style="{ height }"
            :hidden="showEmpty || undefined"
        >
            <div :class="styles.spacer()" :style="{ height: `${virtualizer.getTotalSize()}px` }">
                <div
                    v-for="item in virtualizer.getVirtualItems()"
                    :key="String(item.key)"
                    :ref="(element) => element && virtualizer.measureElement(element as HTMLElement)"
                    :data-index="item.index"
                    :class="styles.row()"
                    :style="{ transform: `translateY(${item.start}px)` }"
                >
                    <TreeNodeView
                        v-if="rows[item.index]!.kind === 'node'"
                        :node="(rows[item.index] as TreeRow<TreeNode>).node"
                        :index-path="(rows[item.index] as TreeRow<TreeNode>).indexPath"
                        :checkable="checkable"
                        flat
                        :posinset="(rows[item.index] as TreeRow<TreeNode>).posinset"
                        :setsize="(rows[item.index] as TreeRow<TreeNode>).setsize"
                    >
                        <template v-if="$slots.node" #node="state"><slot name="node" v-bind="state" /></template>
                    </TreeNodeView>
                    <div
                        v-else
                        :class="styles.loadingRow()"
                        :style="{ '--depth': rows[item.index]!.level }"
                        aria-hidden="true"
                    >
                        <LoaderCircle :class="styles.loadingIcon()" />
                        {{ t.loadingRow }}
                    </div>
                </div>
            </div>
        </TreeView.Tree>
        <div v-if="showEmpty" :class="styles.empty()" @dragover="model.onEmptyDragOver" @drop="model.onEmptyDrop">
            <slot name="empty">{{ emptyTextShown }}</slot>
        </div>
        <p role="status" :class="styles.status()">{{ model.status.value }}</p>
    </TreeView.RootProvider>
</template>
