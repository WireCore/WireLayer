// Virtualised components for very long lists – requires @tanstack/react-virtual (optional peer dependency)
export { VirtualSelect, type VirtualSelectProps } from './VirtualSelect.js';
export { VirtualList, type VirtualListHandle, type VirtualListProps } from './VirtualList.js';
export { VirtualTree, type VirtualTreeProps } from './VirtualTree.js';

// Type of the recipes in the props above (item accessors: a key or a function)
export type { ItemAccessor } from '@wirecore/wirelayer-recipes';
