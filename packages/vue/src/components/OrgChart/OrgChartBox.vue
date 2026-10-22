<script setup lang="ts">
import { ChevronDown, LoaderCircle, RotateCw } from '@lucide/vue';
import { orgChart as orgChartRecipe } from '@wirecore/wirelayer-recipes';
import { computed, inject } from 'vue';
import OrgChartNodes from './OrgChartNodes.vue';
import { orgChartKey, type OrgChartNode, type OrgChartNodeState } from './types.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

// One node: its box (a toggle button when nodes can be chosen), the button that shows or hides its team, the team
const props = defineProps<{ node: OrgChartNode; path: string }>();
defineSlots<{ content?(props: { node: OrgChartNode } & OrgChartNodeState): unknown }>();
const orgChart = useRecipe('orgChart', orgChartRecipe);
const styles = orgChart();
const t = useTranslations().orgChart;
const chart = inject(orgChartKey)!;
const key = computed(() => chart.keyOf(props.node, props.path));
const expanded = computed(() => chart.expanded(props.node, key.value));
const loading = computed(() => chart.loading(key.value));
const failed = computed(() => chart.failed(key.value));
const state = computed<OrgChartNodeState>(() => ({
    key: key.value,
    selected: chart.selected(key.value),
    expanded: expanded.value,
    loading: loading.value,
}));
</script>

<template>
    <!-- A node that can be chosen is a toggle button (aria-pressed) -->
    <button
        v-if="chart.selectable.value"
        type="button"
        :class="styles.node({ class: styles.selectable() })"
        :aria-pressed="state.selected"
        @click="chart.select(key)"
    >
        <slot v-if="$slots.content" name="content" :node="node" v-bind="state" />
        <template v-else>
            <span :class="styles.label()">{{ node.label }}</span>
            <span v-if="node.title" :class="styles.title()">{{ node.title }}</span>
        </template>
    </button>
    <div v-else :class="styles.node()">
        <slot v-if="$slots.content" name="content" :node="node" v-bind="state" />
        <template v-else>
            <span :class="styles.label()">{{ node.label }}</span>
            <span v-if="node.title" :class="styles.title()">{{ node.title }}</span>
        </template>
    </div>
    <button
        v-if="chart.collapsible.value && chart.branch(node)"
        type="button"
        :class="styles.toggle()"
        :aria-expanded="expanded"
        :aria-busy="loading || undefined"
        :data-error="failed || undefined"
        :aria-label="failed ? t.retry(node.label) : expanded ? t.collapse(node.label) : t.expand(node.label)"
        @click="chart.toggle(node, key)"
    >
        <LoaderCircle v-if="loading" :class="styles.toggleSpinner()" aria-hidden="true" />
        <RotateCw v-else-if="failed" :class="styles.toggleIcon()" aria-hidden="true" />
        <ChevronDown v-else :class="styles.toggleIcon()" aria-hidden="true" />
    </button>
    <OrgChartNodes v-if="node.children?.length && expanded" :nodes="node.children" :path="path">
        <template v-if="$slots.content" #content="slotProps"><slot name="content" v-bind="slotProps" /></template>
    </OrgChartNodes>
</template>
