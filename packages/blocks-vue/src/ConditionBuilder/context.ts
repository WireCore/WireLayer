import type {
    ConditionField,
    ConditionNode,
    ConditionOperator,
    conditionBuilder,
    RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import type { ComputedRef, InjectionKey } from 'vue';

/** What the parts of a ConditionBuilder share */
export interface ConditionContext {
    fields: ConditionField[];
    maxDepth: number;
    disabled: boolean;
    negatable: boolean;
    update: (id: string, change: (node: ConditionNode) => ConditionNode) => void;
    add: (groupId: string, kind: 'rule' | 'group') => void;
    remove: (id: string, parentId: string) => void;
    operatorLabel: (operator: ConditionOperator) => string;
    classes?: RecipeClasses<typeof conditionBuilder>;
}

export const conditionKey: InjectionKey<ComputedRef<ConditionContext>> = Symbol('ConditionBuilder');
