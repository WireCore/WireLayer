import type { dataList } from '@wirecore/wirelayer-recipes';
import type { ComputedRef, InjectionKey } from 'vue';

export const dataListKey: InjectionKey<ComputedRef<ReturnType<typeof dataList>>> = Symbol('DataList');
