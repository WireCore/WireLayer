import type { InjectionKey } from 'vue';

/** Set by ChipGroup: a Chip inside is one of its toggle options, outside it is a standalone chip */
export const chipGroupKey: InjectionKey<true> = Symbol('ChipGroup');
