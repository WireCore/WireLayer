<script setup lang="ts">
import {
    addConditionNode,
    announce,
    conditionBuilder as conditionBuilderRecipe,
    emptyConditionGroup,
    newConditionRule,
    removeConditionNode,
    updateConditionNode,
    type ConditionField,
    type ConditionGroup,
    type ConditionOperator,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useRecipe, useTranslations } from '@wirecore/wirelayer-vue';
import { computed, nextTick, normalizeClass, provide, shallowRef, useAttrs, useTemplateRef } from 'vue';
import ConditionGroupView from './ConditionGroupView.vue';
import { conditionKey } from './context.js';

export interface ConditionBuilderProps {
    /** The condition tree (JSON: groups with combinator and children, rules with field, operator, value) – v-model */
    modelValue?: ConditionGroup;
    defaultValue?: ConditionGroup;
    /** Fields the rules can test: id, label, type (text, number, date, select, boolean), options of a select */
    fields: readonly ConditionField[];
    /** Name of the whole tree (default "Conditions") */
    label?: string;
    /** How deep groups can be nested (default 3) */
    maxDepth?: number;
    disabled?: boolean;
    /** A "Not" checkbox per group negates it (`not` in the JSON); groups that are negated already always show it */
    negatable?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof conditionBuilderRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<ConditionBuilderProps>(), { modelValue: undefined, maxDepth: 3 });
const emit = defineEmits<{ 'update:modelValue': [value: ConditionGroup] }>();
const internal = shallowRef(props.defaultValue ?? emptyConditionGroup('and', 'root'));
const tree = computed(() => props.modelValue ?? internal.value);
function set(next: ConditionGroup) {
    internal.value = next;
    emit('update:modelValue', next);
}
const conditionBuilder = useRecipe('conditionBuilder', conditionBuilderRecipe, () => props.classes);
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.conditionBuilder;
const styles = conditionBuilder();
const root = useTemplateRef<HTMLElement>('root');

/** Moves the focus after adding (into the new node) or removing (to the group's add button) */
async function focusIn(selector: string) {
    await nextTick();
    root.value?.querySelector<HTMLElement>(selector)?.focus();
}
provide(
    conditionKey,
    computed(() => ({
        fields: props.fields,
        maxDepth: props.maxDepth,
        disabled: props.disabled,
        negatable: props.negatable,
        classes: props.classes,
        update: (id, change) => set(updateConditionNode(tree.value, id, change)),
        add: (groupId, kind) => {
            const rule = newConditionRule(props.fields);
            const node = kind === 'rule' ? rule : { ...emptyConditionGroup(), children: [rule] };
            set(addConditionNode(tree.value, groupId, node));
            announce(kind === 'rule' ? t.added : t.groupAdded);
            void focusIn(`[data-node="${rule.id}"] select`);
        },
        remove: (id, parentId) => {
            set(removeConditionNode(tree.value, id));
            announce(t.removed);
            void focusIn(`[data-node="${parentId}"] [data-action="add-rule"]`);
        },
        operatorLabel: (operator: ConditionOperator) =>
            t.operators[operator] ?? translations.dataTable.matchModes[operator] ?? operator,
    }))
);
</script>

<template>
    <!--
        Nested and/or groups of rules: field, operator and a value editor matching the field type. Every control is a
        native or WireLayer form control (Tab, arrow keys); adding focuses the new rule, removing the group's add button.
    -->
    <div ref="root" v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <ConditionGroupView :group="tree" path="" :depth="0" :label="label" />
    </div>
</template>
