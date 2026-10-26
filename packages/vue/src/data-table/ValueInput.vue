<script setup lang="ts">
import { computed, inject } from 'vue';
import Checkbox from '../components/Checkbox/Checkbox.vue';
import Input from '../components/Input/Input.vue';
import MultiSelect from '../components/MultiSelect/MultiSelect.vue';
import Select from '../components/Select/Select.vue';
import Textarea from '../components/Textarea/Textarea.vue';
import { useTranslations } from '../locale.js';
import { featureKey } from './features.js';
import type { DataTableFilterInputOptions } from './types.js';

// One value of a filter condition or an edited cell – the matching input for the type

const props = defineProps<{
    type: 'text' | 'textarea' | 'number' | 'select' | 'multiSelect' | 'date' | 'datetime' | 'boolean' | 'checkbox';
    modelValue: unknown;
    label: string;
    /** Choices of select and multiSelect: texts, or values of any type ({ value, label, group }, numbers) */
    options?: readonly unknown[];
    /** Select: an "All" choice (empty value) first – for filters */
    any?: boolean;
    invalid?: boolean;
    /** Settings of the input (the column's `filterInputProps`) */
    inputProps?: DataTableFilterInputOptions;
}>();
defineSlots<{
    /** An option of select and multiSelect (the column's `#option-<id>`) */
    option?: (props: { item: unknown; selected: boolean; highlighted: boolean; disabled: boolean }) => unknown;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>();
const t = useTranslations().dataTable;
const translations = useTranslations();
// DatePicker and NumberInput come from the features dateInput and numberInput – without them the browser's inputs
const feature = inject(featureKey, {});

// Choices with values of their own keep them (objects, numbers); text choices stay text as before
const byValue = computed(() => (props.options ?? []).some((option) => typeof option !== 'string'));
const items = computed(() => [
    ...(props.any ? [{ value: '', label: t.filterAll }] : []),
    ...(props.type === 'boolean'
        ? [
              { value: 'true', label: t.yes },
              { value: 'false', label: t.no },
          ]
        : (props.options ?? []).map((option) =>
              typeof option === 'string' ? { value: option, label: option } : option
          )),
]);
const text = computed(() =>
    props.modelValue === null || props.modelValue === undefined ? '' : String(props.modelValue)
);
/** The browser's number input: an empty or invalid entry is no number */
const toNumber = (value: string | undefined) => (value && Number.isFinite(Number(value)) ? Number(value) : null);
const selected = computed(() => (byValue.value ? (props.modelValue ?? (props.any ? '' : null)) : text.value));
</script>

<template>
    <Input
        v-if="type === 'text'"
        size="sm"
        :aria-label="label"
        :invalid="invalid"
        :placeholder="inputProps?.placeholder"
        :model-value="text"
        @update:model-value="emit('update:modelValue', $event ?? '')"
    />
    <Textarea
        v-else-if="type === 'textarea'"
        size="sm"
        auto-resize
        :aria-label="label"
        :invalid="invalid"
        :model-value="text"
        @update:model-value="emit('update:modelValue', $event ?? '')"
    />
    <component
        :is="feature.numberInput"
        v-else-if="type === 'number' && feature.numberInput"
        size="sm"
        :aria-label="label"
        :invalid="invalid"
        :placeholder="inputProps?.placeholder"
        :model-value="typeof modelValue === 'number' ? modelValue : null"
        @update:model-value="emit('update:modelValue', $event)"
    />
    <Input
        v-else-if="type === 'number'"
        type="number"
        size="sm"
        :aria-label="label"
        :invalid="invalid"
        :placeholder="inputProps?.placeholder"
        :model-value="typeof modelValue === 'number' ? String(modelValue) : ''"
        @update:model-value="emit('update:modelValue', toNumber($event))"
    />
    <component
        :is="feature.dateInput"
        v-else-if="(type === 'date' || type === 'datetime') && feature.dateInput"
        :aria-label="label"
        :invalid="invalid"
        :placeholder="inputProps?.placeholder"
        :with-time="type === 'datetime'"
        :model-value="text || null"
        @update:model-value="emit('update:modelValue', $event)"
    />
    <Input
        v-else-if="type === 'date' || type === 'datetime'"
        :type="type === 'date' ? 'date' : 'datetime-local'"
        size="sm"
        :aria-label="label"
        :invalid="invalid"
        :model-value="text.slice(0, type === 'date' ? 10 : 16)"
        @update:model-value="emit('update:modelValue', $event || null)"
    />
    <MultiSelect
        v-else-if="type === 'multiSelect'"
        :aria-label="label"
        :items="items"
        :invalid="invalid"
        :placeholder="inputProps?.placeholder ?? t.filterAll"
        :filter="inputProps?.filter"
        :max-shown="inputProps?.maxShown"
        :clearable="inputProps?.clearable"
        :model-value="Array.isArray(modelValue) ? (modelValue as unknown[]) : []"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <template v-if="$slots.option" #item="scope">
            <slot name="option" v-bind="scope" />
        </template>
    </MultiSelect>
    <Checkbox
        v-else-if="type === 'checkbox'"
        :aria-label="label"
        :invalid="invalid"
        :checked="modelValue === true"
        @update:checked="emit('update:modelValue', $event === true)"
    />
    <Select
        v-else
        :aria-label="label"
        :items="items"
        :invalid="invalid"
        :placeholder="inputProps?.placeholder ?? translations.common.placeholder"
        :filter="inputProps?.filter"
        :clearable="inputProps?.clearable"
        :model-value="selected"
        @update:model-value="emit('update:modelValue', $event ?? '')"
    >
        <template v-if="$slots.option" #item="scope">
            <slot name="option" v-bind="scope" />
        </template>
    </Select>
</template>
