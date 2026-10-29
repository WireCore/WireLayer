import type { ComputedRef, InjectionKey } from 'vue';

/** The Tabs' value is null on purpose (no tab selected): the first tab stays reachable with Tab */
export const tabsNoneSelectedKey: InjectionKey<ComputedRef<boolean>> = Symbol('wirecore-tabs-none-selected');
