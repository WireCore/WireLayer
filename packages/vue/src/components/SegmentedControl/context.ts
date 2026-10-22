import type { SegmentedControlSize } from '@wirecore/wirelayer-recipes';
import type { ComputedRef, InjectionKey } from 'vue';

/** Provided by SegmentedControl: the size its items use. */
export const segmentedControlKey: InjectionKey<ComputedRef<SegmentedControlSize>> = Symbol('SegmentedControl');
