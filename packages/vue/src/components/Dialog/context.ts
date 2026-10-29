import type { ComputedRef, InjectionKey, ShallowRef } from 'vue';

/** Settings of the surrounding Dialog/Drawer that its content needs (no backdrop when non-modal) */
export const dialogRootKey: InjectionKey<ComputedRef<{ modal: boolean }>> = Symbol('wirecore-dialog-root');

/** The content element of the surrounding Dialog – its initial focus looks for `data-autoselect` in it */
export const dialogContentKey: InjectionKey<ShallowRef<HTMLElement | null>> = Symbol('wirecore-dialog-content');
