<script setup lang="ts">
import { Popover } from '@ark-ui/vue/popover';
import { Filter, Plus, Trash2 } from '@lucide/vue';
import {
    dataTable as dataTableRecipe,
    type DataTableFilterRule,
    type DataTableFilterType,
    type DataTableFilterValue,
    type DataTableMatchMode,
    emptyFilterRule,
    isActiveFilter,
    isRangeMatchMode,
    matchModeDefinition,
    matchModeLabel,
    matchModesFor,
    toFilterRule,
} from '@wirecore/wirelayer-recipes';
import { computed, ref } from 'vue';
import Button from '../components/Button/Button.vue';
import IconButton from '../components/IconButton/IconButton.vue';
import Select from '../components/Select/Select.vue';
import ValueInput from './ValueInput.vue';
import { useLocale, useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';

// Filter menu of a column: conditions (match mode + value) joined with and/or, applied together

const props = defineProps<{
    header: string;
    type: DataTableFilterType;
    modelValue: DataTableFilterValue | undefined;
    options?: readonly unknown[];
    matchModes?: DataTableMatchMode[];
    maxConstraints: number;
}>();
defineSlots<{
    /** Own input for the value of a condition (the column's filter slot) */
    value?: (props: { value: unknown; setValue: (value: unknown) => void }) => unknown;
}>();
const dataTable = useRecipe('dataTable', dataTableRecipe);
const emit = defineEmits<{ 'update:modelValue': [value: DataTableFilterValue | undefined] }>();
const t = useTranslations().dataTable;
const localeContext = useLocale();
const styles = dataTable();

const open = ref(false);
const draft = ref<DataTableFilterRule>(emptyFilterRule(props.type));
const active = computed(() => isActiveFilter(props.modelValue));
const modes = computed(() => matchModesFor(props.type, props.matchModes));
const modeItems = computed(() =>
    modes.value.map((mode) => ({ value: mode, label: matchModeLabel(mode, t.matchModes, localeContext.value.locale) }))
);
/** Input of a condition: the one of an own match mode, or of the filter type */
const inputType = (mode: DataTableMatchMode) => matchModeDefinition(mode)?.input ?? props.type;
// Plain copy – the filter values are text, numbers and lists; reactive proxies cannot be structured-cloned
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function onOpenChange(next: boolean) {
    // A copy: nothing changes until "Apply"
    if (next) draft.value = clone(toFilterRule(props.modelValue ?? emptyFilterRule(props.type), props.type));
    open.value = next;
}
function setMode(index: number, matchMode: DataTableMatchMode) {
    const constraint = draft.value.constraints[index]!;
    // "between" takes two values, the others one
    if (isRangeMatchMode(matchMode) !== isRangeMatchMode(constraint.matchMode))
        constraint.value = isRangeMatchMode(matchMode) ? [null, null] : null;
    constraint.matchMode = matchMode;
}
function setRange(index: number, part: 0 | 1, value: unknown) {
    const constraint = draft.value.constraints[index]!;
    const range = Array.isArray(constraint.value) ? [...constraint.value] : [null, null];
    range[part] = value;
    constraint.value = range;
}
function apply() {
    emit('update:modelValue', isActiveFilter(draft.value) ? clone(draft.value) : undefined);
    open.value = false;
}
function clear() {
    emit('update:modelValue', undefined);
    open.value = false;
}
</script>

<template>
    <Popover.Root
        :open="open"
        :positioning="{ placement: 'bottom-end', gutter: 4 }"
        lazy-mount
        unmount-on-exit
        @open-change="onOpenChange($event.open)"
    >
        <Popover.Trigger
            :class="styles.headButton()"
            :aria-label="t.filterMenu(header, active)"
            :data-active="active || undefined"
        >
            <Filter :class="styles.headButtonIcon()" aria-hidden="true" />
        </Popover.Trigger>
        <Teleport to="body">
            <Popover.Positioner>
                <Popover.Content :class="styles.filterPanel()" :aria-label="t.filterMenu(header, false)">
                    <form :class="styles.filterForm()" @submit.prevent="apply">
                        <Select
                            v-if="draft.constraints.length > 1"
                            :aria-label="t.operator"
                            :items="[
                                { value: 'and', label: t.matchAll },
                                { value: 'or', label: t.matchAny },
                            ]"
                            :model-value="draft.operator"
                            @update:model-value="draft.operator = $event === 'or' ? 'or' : 'and'"
                        />
                        <div v-for="(constraint, index) in draft.constraints" :key="index" :class="styles.filterRule()">
                            <div :class="styles.filterRuleHead()">
                                <Select
                                    v-if="modes.length > 1"
                                    :class="styles.filterMode()"
                                    :aria-label="t.matchMode(index)"
                                    :items="modeItems"
                                    :model-value="constraint.matchMode"
                                    @update:model-value="setMode(index, ($event ?? modes[0]) as DataTableMatchMode)"
                                />
                                <IconButton
                                    v-if="draft.constraints.length > 1"
                                    :icon="Trash2"
                                    :label="t.removeRule(index)"
                                    variant="text"
                                    size="sm"
                                    @click="draft.constraints.splice(index, 1)"
                                />
                            </div>
                            <slot
                                v-if="$slots.value"
                                name="value"
                                v-bind="{
                                    value: constraint.value,
                                    setValue: (value: unknown) => (constraint.value = value),
                                }"
                            />
                            <div v-else-if="isRangeMatchMode(constraint.matchMode)" :class="styles.filterRange()">
                                <ValueInput
                                    :type="inputType(constraint.matchMode)"
                                    :label="`${t.value(index)}, ${t.from}`"
                                    :options="options"
                                    :model-value="Array.isArray(constraint.value) ? constraint.value[0] : null"
                                    @update:model-value="setRange(index, 0, $event)"
                                />
                                <ValueInput
                                    :type="inputType(constraint.matchMode)"
                                    :label="`${t.value(index)}, ${t.to}`"
                                    :options="options"
                                    :model-value="Array.isArray(constraint.value) ? constraint.value[1] : null"
                                    @update:model-value="setRange(index, 1, $event)"
                                />
                            </div>
                            <ValueInput
                                v-else
                                :type="inputType(constraint.matchMode)"
                                :label="t.value(index)"
                                :options="options"
                                :model-value="constraint.value"
                                @update:model-value="constraint.value = $event"
                            />
                        </div>
                        <Button
                            v-if="draft.constraints.length < maxConstraints"
                            variant="text"
                            size="sm"
                            :class="styles.filterAdd()"
                            :leading-icon="Plus"
                            @click="draft.constraints.push({ matchMode: modes[0]!, value: null })"
                        >
                            {{ t.addRule }}
                        </Button>
                        <div :class="styles.filterActions()">
                            <Button variant="outline" size="sm" @click="clear">{{ t.clear }}</Button>
                            <Button type="submit" size="sm">{{ t.apply }}</Button>
                        </div>
                    </form>
                </Popover.Content>
            </Popover.Positioner>
        </Teleport>
    </Popover.Root>
</template>
