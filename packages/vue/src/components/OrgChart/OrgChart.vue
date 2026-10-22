<script setup lang="ts">
import {
    ChildrenLoader,
    isBranchNode,
    isLazyNode,
    orgChart as orgChartRecipe,
    pluralText,
    withLoadedChildren,
    type ChildrenLoaderState,
    type DataSource,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, provide, ref, shallowRef, useAttrs } from 'vue';
import OrgChartBox from './OrgChartBox.vue';
import { orgChartKey, type OrgChartNode, type OrgChartNodeState } from './types.js';
import { useLocale, useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface OrgChartProps {
    /** The top of the hierarchy */
    node: OrgChartNode;
    /** Accessible name, e.g. "Org chart" */
    label: string;
    /** A button below each node with a team shows or hides it */
    collapsible?: boolean;
    /** Keys of the nodes whose team is hidden – use with v-model:collapsed-keys */
    collapsedKeys?: string[];
    defaultCollapsedKeys?: string[];
    /** Nodes can be chosen (toggle buttons): one or several – use with v-model:selected-keys */
    selectionMode?: 'none' | 'single' | 'multiple';
    selectedKeys?: string[];
    defaultSelectedKeys?: string[];
    /** Loads the team of a node with `hasChildren: true` when it is shown; the signal aborts it */
    loadChildren?: (node: OrgChartNode, request: { signal: AbortSignal }) => Promise<OrgChartNode[]>;
    /** Source of the teams of lazy nodes (`getChildren`) */
    dataSource?: DataSource<OrgChartNode>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof orgChartRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<OrgChartProps>(), {
    collapsible: false,
    collapsedKeys: undefined,
    defaultCollapsedKeys: () => [],
    selectionMode: 'none',
    selectedKeys: undefined,
    defaultSelectedKeys: () => [],
});
const emit = defineEmits<{
    'update:collapsedKeys': [keys: string[]];
    'update:selectedKeys': [keys: string[]];
    /** A lazy node opened and there is no loadChildren/dataSource: add its team to the node */
    loadChildren: [node: OrgChartNode];
}>();
defineSlots<{
    /** Content of a node box (instead of label and title) */
    content?(props: { node: OrgChartNode } & OrgChartNodeState): unknown;
}>();
const orgChart = useRecipe('orgChart', orgChartRecipe, () => props.classes);
const attrs = useAttrs();
const styles = orgChart();
const translations = useTranslations();
const locale = useLocale();
const status = ref('');

// Teams on demand: from loadChildren/dataSource, or the parent (loadChildren event)
const loaded = shallowRef<ChildrenLoaderState<OrgChartNode>>({ status: {}, children: {}, errors: {} });
const asked = ref(new Set<string>());
// Lazy nodes need an id: it names them for the loader
const keyOfNode = (node: OrgChartNode) => node.id ?? node.label;
const labels = new Map<string, string>();
const loader = new ChildrenLoader<OrgChartNode>({
    key: keyOfNode,
    load: (node, request) =>
        props.loadChildren
            ? props.loadChildren(node, request)
            : props.dataSource!.getChildren!(node, request).then((result) => result.items),
    onChange: (state) => {
        const before = loaded.value.status;
        loaded.value = state;
        for (const [key, value] of Object.entries(state.status)) {
            if (before[key] === value) continue;
            const label = labels.get(key) ?? key;
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
const root = computed(() => withLoadedChildren([props.node], loaded.value.children, keyOfNode)[0]!);

const collapsedInternal = ref(props.defaultCollapsedKeys);
const collapsed = computed(() => new Set(props.collapsedKeys ?? collapsedInternal.value));
function setCollapsed(keys: string[]) {
    collapsedInternal.value = keys;
    emit('update:collapsedKeys', keys);
}
const selectedInternal = ref(props.defaultSelectedKeys);
const selected = computed(() => props.selectedKeys ?? selectedInternal.value);

provide(orgChartKey, {
    keyOf: (node, path) => node.id ?? path,
    collapsible: computed(() => props.collapsible),
    selectable: computed(() => props.selectionMode !== 'none'),
    branch: (node) => isBranchNode(node) && (!!node.children?.length || isLazyNode(node)),
    // A lazy node stays closed until its team is there
    expanded: (node, key) => !collapsed.value.has(key) && !isLazyNode(node),
    selected: (key) => selected.value.includes(key),
    loading: (key) => loaded.value.status[key] === 'loading' || (!ownLoader() && asked.value.has(key)),
    failed: (key) => loaded.value.status[key] === 'error',
    toggle(node, key) {
        if (isLazyNode(node)) {
            labels.set(key, node.label);
            if (collapsed.value.has(key)) setCollapsed([...collapsed.value].filter((other) => other !== key));
            if (ownLoader()) void loader.load(node, { force: loaded.value.status[key] === 'error' });
            else if (!asked.value.has(key)) {
                asked.value = new Set([...asked.value, key]);
                status.value = translations.tree.loadingNode(node.label);
                emit('loadChildren', node);
            }
            return;
        }
        setCollapsed(
            collapsed.value.has(key) ? [...collapsed.value].filter((other) => other !== key) : [...collapsed.value, key]
        );
    },
    select(key) {
        const next =
            props.selectionMode === 'multiple'
                ? selected.value.includes(key)
                    ? selected.value.filter((other) => other !== key)
                    : [...selected.value, key]
                : selected.value.includes(key)
                  ? []
                  : [key];
        selectedInternal.value = next;
        emit('update:selectedKeys', next);
    },
});
</script>

<template>
    <!-- Hierarchy as nested lists – screen readers read the structure, the lines are drawn with CSS -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <ul :aria-label="label" :class="styles.rootList()">
            <li :class="styles.rootItem()">
                <OrgChartBox :node="root" path="0">
                    <template v-if="$slots.content" #content="state"><slot name="content" v-bind="state" /></template>
                </OrgChartBox>
            </li>
        </ul>
        <p v-if="collapsible && (loadChildren || dataSource || asked.size)" role="status" :class="styles.status()">
            {{ status }}
        </p>
    </div>
</template>
