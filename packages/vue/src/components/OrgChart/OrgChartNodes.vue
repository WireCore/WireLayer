<script setup lang="ts">
import { orgChart as orgChartRecipe } from '@wirecore/wirelayer-recipes';
import OrgChartBox from './OrgChartBox.vue';
import type { OrgChartNode, OrgChartNodeState } from './types.js';
import { useRecipe } from '../../recipes.js';

defineOptions({ name: 'OrgChartNodes' });
defineProps<{
    nodes: OrgChartNode[];
    /** Position of the parent ("0", "0-1") – for the default keys */
    path: string;
}>();
defineSlots<{ content?(props: { node: OrgChartNode } & OrgChartNodeState): unknown }>();
const orgChart = useRecipe('orgChart', orgChartRecipe);
const styles = orgChart();
</script>

<template>
    <ul :class="styles.list()">
        <li v-for="(node, index) in nodes" :key="index" :class="styles.item()">
            <OrgChartBox :node="node" :path="`${path}-${index}`">
                <template v-if="$slots.content" #content="props"><slot name="content" v-bind="props" /></template>
            </OrgChartBox>
        </li>
    </ul>
</template>
