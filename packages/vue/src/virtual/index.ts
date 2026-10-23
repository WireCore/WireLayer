// Virtualised components for very long lists – requires @tanstack/vue-virtual (optional peer dependency)
export { default as VirtualSelect, type VirtualSelectProps } from './VirtualSelect.vue';
export { default as VirtualList, type VirtualListProps } from './VirtualList.vue';
export { default as VirtualTree, type VirtualTreeProps } from './VirtualTree.vue';

// Type of the recipes in the props above (item accessors: a key or a function)
export type { ItemAccessor } from '@wirecore/wirelayer-recipes';
