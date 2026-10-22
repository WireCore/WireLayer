import type { ComputedRef, InjectionKey } from 'vue';

/** Settings of the surrounding Dialog/Drawer that its content needs (no backdrop when non-modal) */
export const dialogRootKey: InjectionKey<ComputedRef<{ modal: boolean }>> = Symbol('wirecore-dialog-root');
