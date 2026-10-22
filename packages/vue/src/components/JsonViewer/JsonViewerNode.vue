<script setup lang="ts">
import { TreeView } from '@ark-ui/vue/tree-view';
import { ChevronRight, Copy } from '@lucide/vue';
import { jsonValueText, jsonViewer as jsonViewerRecipe, type JsonNode } from '@wirecore/wirelayer-recipes';
import { computed, inject } from 'vue';
import Highlight from '../Highlight/Highlight.vue';
import { jsonViewerKey } from './context.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

defineOptions({ name: 'JsonViewerNode' });
const props = defineProps<{ node: JsonNode; indexPath: number[] }>();
const jsonViewer = useRecipe('jsonViewer', jsonViewerRecipe);
const context = inject(jsonViewerKey)!;
const t = useTranslations().jsonViewer;
const branch = computed(() => !!props.node.children);
const valueType = computed(() => {
    const type = props.node.type;
    if (type === 'string' || type === 'number' || type === 'boolean') return type;
    return type === 'null' || type === 'undefined' ? 'nothing' : 'nested';
});
const styles = computed(() => jsonViewer({ valueType: valueType.value, showTypes: context.showTypes.value }));
const keyText = computed(() => (props.node.key === null ? '' : String(props.node.key)));
const valueText = computed(() => jsonValueText(props.node.value));
const preview = computed(() => {
    const count = props.node.children?.length ?? 0;
    return props.node.type === 'array' ? `[ ${t.items(count)} ]` : `{ ${t.keys(count)} }`;
});
const match = computed(() => context.matches.value.has(props.node.id));
</script>

<template>
    <TreeView.NodeProvider :node="node" :index-path="indexPath">
        <TreeView.Branch
            v-if="branch"
            :class="styles.branch()"
            :data-node-id="node.id"
            :aria-keyshortcuts="context.copyable.value ? 'Control+C' : undefined"
        >
            <TreeView.BranchControl :class="styles.row()">
                <TreeView.BranchIndicator :class="styles.indicator()">
                    <ChevronRight :class="styles.indicatorIcon()" aria-hidden="true" />
                </TreeView.BranchIndicator>
                <TreeView.BranchText :class="styles.value()">
                    <template v-if="keyText">
                        <span :class="styles.key()">
                            <Highlight v-if="match" :text="keyText" :query="context.query.value" ignore-accents />
                            <template v-else>{{ keyText }}</template>
                        </span>
                        <span :class="styles.punctuation()">: </span>
                    </template>
                    <span :class="styles.preview()">{{ preview }}</span>
                    <span :class="styles.type()">{{ t.types[node.type] }}</span>
                </TreeView.BranchText>
                <!-- Pointer convenience only: the keyboard copies with Ctrl+C on the node -->
                <span
                    v-if="context.copyable.value"
                    aria-hidden="true"
                    :class="styles.copy()"
                    :title="t.copy(node.id)"
                    @click.stop="context.copy(node)"
                >
                    <Copy :class="styles.copyIcon()" />
                </span>
            </TreeView.BranchControl>
            <TreeView.BranchContent :class="styles.group()">
                <JsonViewerNode
                    v-for="(child, index) in node.children"
                    :key="child.id"
                    :node="child"
                    :index-path="[...indexPath, index]"
                />
            </TreeView.BranchContent>
        </TreeView.Branch>
        <TreeView.Item
            v-else
            :class="styles.row()"
            :data-node-id="node.id"
            :aria-keyshortcuts="context.copyable.value ? 'Control+C' : undefined"
        >
            <span :class="styles.spacer()" aria-hidden="true" />
            <TreeView.ItemText :class="styles.value()">
                <template v-if="keyText">
                    <span :class="styles.key()">
                        <Highlight v-if="match" :text="keyText" :query="context.query.value" ignore-accents />
                        <template v-else>{{ keyText }}</template>
                    </span>
                    <span :class="styles.punctuation()">: </span>
                </template>
                <Highlight v-if="match" :text="valueText" :query="context.query.value" ignore-accents />
                <template v-else>{{ valueText }}</template>
                <span :class="styles.type()">{{ t.types[node.type] }}</span>
            </TreeView.ItemText>
            <span
                v-if="context.copyable.value"
                aria-hidden="true"
                :class="styles.copy()"
                :title="t.copy(node.id)"
                @click.stop="context.copy(node)"
            >
                <Copy :class="styles.copyIcon()" />
            </span>
        </TreeView.Item>
    </TreeView.NodeProvider>
</template>
