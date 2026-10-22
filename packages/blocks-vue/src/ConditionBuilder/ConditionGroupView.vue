<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue';
import {
    conditionBuilder as conditionBuilderRecipe,
    isValuelessOperator,
    negateConditionGroup,
    operatorsFor,
    setConditionField,
    setConditionOperator,
    type ConditionGroup,
    type ConditionNode,
    type ConditionOperator,
    type ConditionRule,
} from '@wirecore/wirelayer-recipes';
import { Button, Checkbox, IconButton, NativeSelect, useRecipe, useTranslations } from '@wirecore/wirelayer-vue';
import { computed, inject } from 'vue';
import ConditionValue from './ConditionValue.vue';
import { conditionKey } from './context.js';

// One group of the ConditionBuilder: combinator, its rules and nested groups (recursive)
const props = defineProps<{
    group: ConditionGroup;
    /** Position, e.g. "2" or "2.1" ('' for the root) */
    path: string;
    depth: number;
    /** Name of the root group */
    label?: string;
    parentId?: string;
}>();
const context = inject(conditionKey)!;
const conditionBuilder = useRecipe('conditionBuilder', conditionBuilderRecipe, () => context.value.classes);
const styles = computed(() => conditionBuilder({ nested: props.depth > 0 }));
const t = useTranslations().conditionBuilder;
const ctx = computed(() => context.value);
const childPath = (index: number) => (props.path ? `${props.path}.${index + 1}` : String(index + 1));
const fieldItems = computed(() => ctx.value.fields.map((field) => ({ value: field.id, label: field.label })));
const fieldOf = (rule: ConditionRule) => ctx.value.fields.find((field) => field.id === rule.field);
const operatorItems = (rule: ConditionRule) =>
    operatorsFor(fieldOf(rule)).map((operator) => ({ value: operator, label: ctx.value.operatorLabel(operator) }));
const combinatorItems = computed(() => [
    { value: 'and', label: t.all },
    { value: 'or', label: t.any },
]);
const updateRule = (rule: ConditionRule, change: (rule: ConditionRule) => ConditionRule) =>
    ctx.value.update(rule.id, (node) => change(node as ConditionRule));
const setValue = (rule: ConditionRule, value: unknown) => updateRule(rule, (current) => ({ ...current, value }));
const setRangePart = (rule: ConditionRule, index: 0 | 1, value: unknown) =>
    updateRule(rule, (current) => {
        const range = Array.isArray(current.value) ? [...current.value] : [null, null];
        range[index] = value;
        return { ...current, value: range };
    });
const asRule = (node: ConditionNode) => node as ConditionRule;
const asGroup = (node: ConditionNode) => node as ConditionGroup;
</script>

<template>
    <fieldset :class="styles.group()" :data-node="group.id">
        <legend :class="styles.legend()">{{ path ? t.group(path) : (label ?? t.label) }}</legend>
        <div :class="styles.groupHeader()">
            <Checkbox
                v-if="ctx.negatable || group.not"
                :checked="group.not === true"
                :disabled="ctx.disabled"
                @update:checked="ctx.update(group.id, (node) => negateConditionGroup(asGroup(node), $event === true))"
                >{{ t.not }}</Checkbox
            >
            <NativeSelect
                :items="combinatorItems"
                :model-value="group.combinator"
                :aria-label="t.combinator"
                :disabled="ctx.disabled"
                size="sm"
                :class="styles.combinatorSelect()"
                @update:model-value="
                    ctx.update(group.id, (node) => ({ ...asGroup(node), combinator: $event as 'and' | 'or' }))
                "
            />
            <div :class="styles.groupActions()">
                <Button
                    variant="outline"
                    size="sm"
                    :leading-icon="Plus"
                    :disabled="ctx.disabled"
                    data-action="add-rule"
                    @click="ctx.add(group.id, 'rule')"
                    >{{ t.addRule }}</Button
                >
                <Button
                    v-if="depth < ctx.maxDepth"
                    variant="text"
                    size="sm"
                    :leading-icon="Plus"
                    :disabled="ctx.disabled"
                    @click="ctx.add(group.id, 'group')"
                    >{{ t.addGroup }}</Button
                >
                <IconButton
                    v-if="parentId"
                    :icon="Trash2"
                    :label="t.removeGroup(path)"
                    variant="text"
                    size="sm"
                    :disabled="ctx.disabled"
                    @click="ctx.remove(group.id, parentId)"
                />
            </div>
        </div>
        <ol v-if="group.children.length" :class="styles.list()">
            <li v-for="(child, index) in group.children" :key="child.id" :data-node="child.id">
                <span v-if="index > 0" :class="styles.combinator()" aria-hidden="true">{{
                    group.combinator === 'or' ? t.or : t.and
                }}</span>
                <ConditionGroupView
                    v-if="child.type === 'group'"
                    :group="asGroup(child)"
                    :path="childPath(index)"
                    :depth="depth + 1"
                    :parent-id="group.id"
                />
                <div v-else role="group" :aria-label="t.rule(childPath(index))" :class="styles.rule()">
                    <NativeSelect
                        :items="fieldItems"
                        :model-value="asRule(child).field"
                        :aria-label="t.field"
                        :disabled="ctx.disabled"
                        size="sm"
                        :class="styles.field()"
                        @update:model-value="
                            updateRule(asRule(child), (rule) => setConditionField(rule, ctx.fields, $event))
                        "
                    />
                    <NativeSelect
                        :items="operatorItems(asRule(child))"
                        :model-value="asRule(child).operator"
                        :aria-label="t.operator"
                        :disabled="ctx.disabled"
                        size="sm"
                        :class="styles.operator()"
                        @update:model-value="
                            updateRule(asRule(child), (rule) =>
                                setConditionOperator(rule, ctx.fields, $event as ConditionOperator)
                            )
                        "
                    />
                    <div v-if="asRule(child).operator === 'between'" :class="styles.range()">
                        <ConditionValue
                            v-for="part in [0, 1] as const"
                            :key="part"
                            :field="fieldOf(asRule(child))"
                            :rule="asRule(child)"
                            :value="(asRule(child).value as unknown[] | undefined)?.[part]"
                            :label="`${t.value}: ${part === 0 ? t.from : t.to}`"
                            :disabled="ctx.disabled"
                            @change="setRangePart(asRule(child), part, $event)"
                        />
                    </div>
                    <div v-else-if="!isValuelessOperator(asRule(child).operator)" :class="styles.value()">
                        <ConditionValue
                            :field="fieldOf(asRule(child))"
                            :rule="asRule(child)"
                            :value="asRule(child).value"
                            :label="t.value"
                            :disabled="ctx.disabled"
                            @change="setValue(asRule(child), $event)"
                        />
                    </div>
                    <IconButton
                        :icon="Trash2"
                        :label="t.removeRule(childPath(index))"
                        variant="text"
                        size="sm"
                        :disabled="ctx.disabled"
                        @click="ctx.remove(child.id, group.id)"
                    />
                </div>
            </li>
        </ol>
        <p v-else :class="styles.empty()">{{ t.empty }}</p>
    </fieldset>
</template>
