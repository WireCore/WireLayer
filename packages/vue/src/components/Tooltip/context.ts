import type { InjectionKey, Ref } from 'vue';

/** Shared delays of the tooltips in a TooltipGroup */
export interface TooltipGroupContext {
    openDelay: () => number;
    closeDelay: () => number;
    /** Shortly after a tooltip of the group closed, the next one opens without delay */
    instant: Ref<boolean>;
    closed: () => void;
}

export const tooltipGroupKey: InjectionKey<TooltipGroupContext> = Symbol('wirecore-tooltip-group');
