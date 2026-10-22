<script setup lang="ts">
import { tree as treeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import Button from '../Button/Button.vue';
import type { TreeModel } from './useTree.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

// Search field and expand/collapse buttons above a tree (Tree, VirtualTree)
const props = defineProps<{
    model: TreeModel;
    filter: boolean;
    filterMode: 'filter' | 'highlight';
    expandControls: boolean;
    classes?: RecipeClasses<typeof treeRecipe>;
}>();
const tree = useRecipe('tree', treeRecipe, () => props.classes);
const styles = tree();
const translations = useTranslations();
const t = translations.tree;
function onSearchKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || props.filterMode !== 'highlight') return;
    event.preventDefault();
    void props.model.jump(event.shiftKey ? -1 : 1);
}
</script>

<template>
    <div v-if="filter || expandControls" :class="styles.toolbar()">
        <input
            v-if="filter"
            type="search"
            autocomplete="off"
            :class="styles.search()"
            :aria-label="t.filter"
            :placeholder="translations.combobox.search"
            :value="model.query.value"
            @input="model.setQuery(($event.target as HTMLInputElement).value)"
            @keydown="onSearchKeydown"
        />
        <template v-if="expandControls">
            <Button variant="text" size="sm" @click="model.expandAll">{{ t.expandAll }}</Button>
            <Button variant="text" size="sm" @click="model.collapseAll">{{ t.collapseAll }}</Button>
        </template>
    </div>
</template>
