import type { ChildrenStatus } from '@wirecore/wirelayer-recipes';
import type { Component, InjectionKey, Ref } from 'vue';

export interface CascadeOption<V = string> {
    /** Any type (string, number, object – see `valueKey`) */
    value: V;
    label: string;
    icon?: Component;
    /** Only for options without children */
    disabled?: boolean;
    /** Sub-options open to the side; only options without children can be chosen (unless `changeOnSelect`) */
    children?: CascadeOption<V>[];
    /** Has sub-options that are loaded when the level opens (`loadChildren`, `dataSource` or `loadChildren` event) */
    hasChildren?: boolean;
    /** false: like `hasChildren: true` */
    leaf?: boolean;
}

/** What the levels of a CascadeSelect read from it */
export interface CascadeContext {
    keyOf: (option: CascadeOption<unknown>) => string;
    statusOf: (option: CascadeOption<unknown>) => ChildrenStatus | undefined;
    /** A level opened: loads its options if needed */
    open: (option: CascadeOption<unknown>) => void;
    retry: (option: CascadeOption<unknown>) => void;
    changeOnSelect: Ref<boolean>;
    /** Levels open on click (and arrow keys) only, not on hover */
    clickOnly: Ref<boolean>;
}

export const cascadeKey: InjectionKey<CascadeContext> = Symbol('Cascade');
