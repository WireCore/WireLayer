<script setup lang="ts">
import { createTreeCollection, TreeView } from '@ark-ui/vue/tree-view';
import { Search } from '@lucide/vue';
import {
    announce,
    copyText,
    jsonCopyText,
    jsonExpandedIds,
    jsonTree,
    jsonViewer as jsonViewerRecipe,
    searchJson,
    walkTree,
    type JsonNode,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, provide, ref, useAttrs, watch } from 'vue';
import Input from '../Input/Input.vue';
import JsonViewerNode from './JsonViewerNode.vue';
import { jsonViewerKey } from './context.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface JsonViewerProps {
    /** The data to show (any JSON value) */
    data: unknown;
    /** Accessible name of the tree (default "JSON data") */
    label?: string;
    /** Levels open at first (default 1; 0: all closed, Infinity: all open) */
    defaultExpandedDepth?: number;
    /** Search field above the tree: hits are marked and their branches opened */
    search?: boolean;
    /** Copy button per node (and Ctrl+C on the focused node, default true) */
    copyable?: boolean;
    /** Shows the type of every value as text (otherwise only for screen readers) */
    showTypes?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof jsonViewerRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<JsonViewerProps>(), { defaultExpandedDepth: 1, copyable: true });
const emit = defineEmits<{
    /** A value was copied: its path and the copied text */
    copy: [path: string, text: string];
}>();
const jsonViewer = useRecipe('jsonViewer', jsonViewerRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().jsonViewer;
const styles = jsonViewer();
const root = computed(() => jsonTree(props.data));
// The root itself is not shown: its children are the top level (a primitive value is shown alone)
const top = computed(() => root.value.children ?? [root.value]);
const collection = computed(() =>
    createTreeCollection<JsonNode>({
        nodeToValue: (node) => node.id,
        nodeToString: (node) => String(node.key ?? ''),
        rootNode: { id: 'ROOT', key: null, type: 'object', value: null, children: top.value },
    })
);
const initialExpanded = () =>
    jsonExpandedIds(root.value, props.defaultExpandedDepth + 1).filter((id) => id !== root.value.id);
const expanded = ref<string[]>(initialExpanded());
watch(
    () => props.data,
    () => (expanded.value = initialExpanded())
);
const query = ref('');
const result = computed(() => searchJson(root.value, query.value));
watch(result, (next) => {
    if (next.expand.length) expanded.value = [...new Set([...expanded.value, ...next.expand])];
});
const nodes = computed(() => {
    const byId = new Map<string, JsonNode>();
    walkTree([root.value], (node) => void byId.set(node.id, node));
    return byId;
});

function copy(node: JsonNode) {
    const text = jsonCopyText(node.value);
    copyText(text)
        .then(() => {
            announce(t.copied(node.id));
            emit('copy', node.id, text);
        })
        .catch(() => undefined);
}
// Ctrl/Cmd+C on a node copies its value (the copy buttons are no tab stops)
function onKeydown(event: KeyboardEvent) {
    if (!props.copyable || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'c') return;
    const id = (event.target as HTMLElement).closest<HTMLElement>('[data-node-id]')?.dataset.nodeId;
    const node = id ? nodes.value.get(id) : undefined;
    if (!node || window.getSelection()?.toString()) return;
    event.preventDefault();
    copy(node);
}

provide(jsonViewerKey, {
    query: computed(() => query.value),
    matches: computed(() => new Set(result.value.matches)),
    copyable: computed(() => props.copyable),
    showTypes: computed(() => !!props.showTypes),
    copy,
});
</script>

<template>
    <!--
        JSON as a tree (role="tree"): arrow keys open and close, typing jumps to a key; values are coloured by type
        and readable as text (quotes, true/false, null). Ctrl+C copies the focused value.
    -->
    <TreeView.Root
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :collection="collection"
        :expanded-value="expanded"
        :translations="{ treeLabel: label ?? (attrs['aria-label'] as string | undefined) ?? t.label }"
        @expanded-change="expanded = $event.expandedValue"
        @keydown="onKeydown"
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
        />
        <TreeView.Tree :class="styles.tree()">
            <JsonViewerNode v-for="(node, index) in top" :key="node.id" :node="node" :index-path="[index]" />
        </TreeView.Tree>
        <span v-if="search" role="status" :class="styles.status()">{{
            query.trim() ? t.matches(result.matches.length) : ''
        }}</span>
    </TreeView.Root>
</template>
