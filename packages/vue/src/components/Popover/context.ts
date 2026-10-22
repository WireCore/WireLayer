import type { ComputedRef, InjectionKey } from 'vue';

/** Settings of the surrounding Popover that its content needs */
export const popoverRootKey: InjectionKey<ComputedRef<{ overlay: boolean; width?: 'trigger' }>> =
    Symbol('wirecore-popover-root');
