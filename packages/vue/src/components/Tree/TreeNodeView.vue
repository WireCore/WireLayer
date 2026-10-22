<script setup lang="ts">
import { TreeView } from '@ark-ui/vue/tree-view';
import { Check, ChevronRight, LoaderCircle, Minus, RotateCw } from '@lucide/vue';
import { isLazyNode, tree as treeRecipe, treeRetryParent, type TreeCheckState } from '@wirecore/wirelayer-recipes';
import { computed, inject } from 'vue';
import Highlight from '../Highlight/Highlight.vue';
import { treeDragKey, treeModelKey } from './context.js';
import type { TreeNode, TreeNodeState } from './types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

defineOptions({ name: 'TreeNodeView' });
const props = defineProps<{
    node: TreeNode;
    indexPath: number[];
    checkable: boolean;
    /** VirtualTree: a branch without its children, with its position among the siblings */
    flat?: boolean;
    posinset?: number;
    setsize?: number;
}>();
defineSlots<{ node?(props: { node: TreeNode } & TreeNodeState): unknown }>();
const tree = useRecipe('tree', treeRecipe);
const styles = tree();
const t = useTranslations().tree;
const drag = inject(treeDragKey)!;
const model = inject(treeModelKey)!;
const dropAt = (id: string) => (drag.drop.value?.id === id ? drag.drop.value.position : undefined);
const moveKeys = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight';
const ariaChecked = (checked: TreeCheckState) => (checked === 'indeterminate' ? 'mixed' : checked);
const branch = computed(() => !!props.node.children || isLazyNode(props.node));
const retry = computed(() => treeRetryParent(props.node.id) !== undefined);
const loading = computed(() => model.loadingOf(props.node));
const match = computed(() => model.matches.value.has(props.node.id));
const own = computed(() => model.ownChecks.value);
const ownChecked = computed(() => model.checkStates.value?.get(props.node.id) ?? false);
const checkedOf = (state: { checked: TreeCheckState }) => (own.value ? ownChecked.value : state.checked);
const draggable = computed(() => (drag.reorderable.value && !props.node.disabled && !retry.value ? 'true' : undefined));
const slotState = (state: { depth: number; selected: boolean; expanded: boolean; checked: TreeCheckState }) => ({
    node: props.node,
    level: state.depth,
    selected: state.selected,
    expanded: state.expanded,
    branch: branch.value,
    checked: checkedOf(state),
    loading: loading.value,
    match: match.value,
    query: model.query.value,
});
</script>

<template>
    <!-- The checkbox is only visual: the treeitem carries the state (aria-checked) -->
    <TreeView.NodeProvider :node="node" :index-path="indexPath">
        <TreeView.NodeContext v-slot="state">
            <TreeView.Branch
                v-if="branch"
                :data-node-id="node.id"
                :aria-keyshortcuts="drag.reorderable.value ? moveKeys : undefined"
                :aria-checked="checkable ? ariaChecked(checkedOf(state)) : undefined"
                :aria-busy="loading || undefined"
                :aria-posinset="posinset"
                :aria-setsize="setsize"
                :data-match="match || undefined"
            >
                <TreeView.BranchControl
                    :class="styles.branch({ class: drag.reorderable.value ? styles.dropTarget() : undefined })"
                    :draggable="draggable"
                    :data-drop="dropAt(node.id)"
                    :data-dragging="drag.dragging.value === node.id || undefined"
                    :data-cut="model.cutId.value === node.id || undefined"
                    @dragstart="drag.onDragStart(node.id, $event)"
                    @dragover="drag.onDragOver(node.id, true, $event)"
                    @drop="drag.onDrop"
                    @dragend="drag.onDragEnd"
                >
                    <TreeView.BranchIndicator :class="styles.indicator()">
                        <ChevronRight :class="styles.indicatorIcon()" aria-hidden="true" />
                    </TreeView.BranchIndicator>
                    <span
                        v-if="checkable && own"
                        data-part="node-checkbox"
                        :data-state="
                            ownChecked === 'indeterminate' ? 'indeterminate' : ownChecked ? 'checked' : 'unchecked'
                        "
                        role="presentation"
                        aria-hidden="true"
                        :class="styles.checkbox()"
                        @click.stop="model.toggleCheck(node.id)"
                    >
                        <Minus v-if="ownChecked === 'indeterminate'" :class="styles.checkboxIcon()" />
                        <Check v-else-if="ownChecked" :class="styles.checkboxIcon()" />
                    </span>
                    <TreeView.NodeCheckbox
                        v-else-if="checkable"
                        :class="styles.checkbox()"
                        role="presentation"
                        aria-hidden="true"
                    >
                        <TreeView.NodeCheckboxIndicator>
                            <Check :class="styles.checkboxIcon()" aria-hidden="true" />
                            <template #indeterminate
                                ><Minus :class="styles.checkboxIcon()" aria-hidden="true"
                            /></template>
                        </TreeView.NodeCheckboxIndicator>
                    </TreeView.NodeCheckbox>
                    <slot v-if="$slots.node" name="node" v-bind="slotState(state)" />
                    <template v-else>
                        <component :is="node.icon" v-if="node.icon" :class="styles.icon()" aria-hidden="true" />
                        <TreeView.BranchText :class="styles.text()">
                            <Highlight v-if="match" :text="node.label" :query="model.query.value" ignore-accents />
                            <template v-else>{{ node.label }}</template>
                        </TreeView.BranchText>
                    </template>
                </TreeView.BranchControl>
                <TreeView.BranchContent v-if="!flat" v-bind="model.showLines.value ? { class: styles.lines() } : {}">
                    <div v-if="loading" :class="styles.loadingRow()" aria-hidden="true">
                        <LoaderCircle :class="styles.loadingIcon()" />
                        {{ t.loadingRow }}
                    </div>
                    <TreeNodeView
                        v-for="(child, index) in node.children ?? []"
                        :key="child.id"
                        :node="child"
                        :index-path="[...indexPath, index]"
                        :checkable="checkable"
                    >
                        <template v-if="$slots.node" #node="childState"
                            ><slot name="node" v-bind="childState"
                        /></template>
                    </TreeNodeView>
                </TreeView.BranchContent>
            </TreeView.Branch>
            <!-- Children failed to load: Enter or a click loads them again -->
            <TreeView.Item
                v-else-if="retry"
                :class="styles.item({ class: styles.retry() })"
                :data-node-id="node.id"
                :aria-posinset="posinset"
                :aria-setsize="setsize"
            >
                <RotateCw :class="styles.retryIcon()" aria-hidden="true" />
                <TreeView.ItemText :class="styles.text()">{{ node.label }}</TreeView.ItemText>
            </TreeView.Item>
            <TreeView.Item
                v-else
                :class="styles.item({ class: drag.reorderable.value ? styles.dropTarget() : undefined })"
                :data-node-id="node.id"
                :aria-keyshortcuts="drag.reorderable.value ? moveKeys : undefined"
                :aria-checked="checkable ? ariaChecked(checkedOf(state)) : undefined"
                :aria-posinset="posinset"
                :aria-setsize="setsize"
                :data-match="match || undefined"
                :draggable="draggable"
                :data-drop="dropAt(node.id)"
                :data-dragging="drag.dragging.value === node.id || undefined"
                :data-cut="model.cutId.value === node.id || undefined"
                @dragstart="drag.onDragStart(node.id, $event)"
                @dragover="drag.onDragOver(node.id, false, $event)"
                @drop="drag.onDrop"
                @dragend="drag.onDragEnd"
            >
                <span
                    v-if="checkable && own"
                    data-part="node-checkbox"
                    :data-state="ownChecked ? 'checked' : 'unchecked'"
                    role="presentation"
                    aria-hidden="true"
                    :class="styles.checkbox()"
                    @click.stop="model.toggleCheck(node.id)"
                >
                    <Check v-if="ownChecked" :class="styles.checkboxIcon()" />
                </span>
                <TreeView.NodeCheckbox
                    v-else-if="checkable"
                    :class="styles.checkbox()"
                    role="presentation"
                    aria-hidden="true"
                >
                    <TreeView.NodeCheckboxIndicator>
                        <Check :class="styles.checkboxIcon()" aria-hidden="true" />
                        <template #indeterminate><Minus :class="styles.checkboxIcon()" aria-hidden="true" /></template>
                    </TreeView.NodeCheckboxIndicator>
                </TreeView.NodeCheckbox>
                <slot v-if="$slots.node" name="node" v-bind="slotState(state)" />
                <template v-else>
                    <component :is="node.icon" v-if="node.icon" :class="styles.icon()" aria-hidden="true" />
                    <TreeView.ItemText :class="styles.text()">
                        <Highlight v-if="match" :text="node.label" :query="model.query.value" ignore-accents />
                        <template v-else>{{ node.label }}</template>
                    </TreeView.ItemText>
                </template>
            </TreeView.Item>
        </TreeView.NodeContext>
    </TreeView.NodeProvider>
</template>
