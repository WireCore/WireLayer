<script setup lang="ts">
import { computed } from 'vue';
import Checkbox from '../components/Checkbox/Checkbox.vue';
import DatePicker from '../components/DatePicker/DatePicker.vue';
import Input from '../components/Input/Input.vue';
import MultiSelect from '../components/MultiSelect/MultiSelect.vue';
import NumberInput from '../components/NumberInput/NumberInput.vue';
import Select from '../components/Select/Select.vue';
import Textarea from '../components/Textarea/Textarea.vue';
import { useTranslations } from '../locale.js';

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
}>();
const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>();
const t = useTranslations().dataTable;
const translations = useTranslations();

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
const selected = computed(() => (byValue.value ? (props.modelValue ?? (props.any ? '' : null)) : text.value));
</script>

<template>
    <Input
        v-if="type === 'text'"
        size="sm"
        :aria-label="label"
        :invalid="invalid"
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
    <NumberInput
        v-else-if="type === 'number'"
        size="sm"
        :aria-label="label"
        :invalid="invalid"
        :model-value="typeof modelValue === 'number' ? modelValue : null"
        @update:model-value="emit('update:modelValue', $event)"
    />
    <DatePicker
        v-else-if="type === 'date' || type === 'datetime'"
        :aria-label="label"
        :invalid="invalid"
        :with-time="type === 'datetime'"
        :model-value="text || null"
        @update:model-value="emit('update:modelValue', $event)"
    />
    <MultiSelect
        v-else-if="type === 'multiSelect'"
        :aria-label="label"
        :items="items"
        :invalid="invalid"
        :placeholder="t.filterAll"
        :model-value="Array.isArray(modelValue) ? (modelValue as unknown[]) : []"
        @update:model-value="emit('update:modelValue', $event)"
    />
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
        :placeholder="translations.common.placeholder"
        :model-value="selected"
        @update:model-value="emit('update:modelValue', $event ?? '')"
    />
</template>
