<script setup lang="ts">
import { type ConditionField, type ConditionRule } from '@wirecore/wirelayer-recipes';
import { DatePicker, Input, MultiSelect, NativeSelect, NumberInput, useTranslations } from '@wirecore/wirelayer-vue';
import { computed } from 'vue';

// The editor for the value of one rule (or one end of a range): matches the field type
const props = defineProps<{
    field: ConditionField | undefined;
    rule: ConditionRule;
    value: unknown;
    label: string;
    disabled?: boolean;
}>();
const emit = defineEmits<{ change: [value: unknown] }>();
const translations = useTranslations();
const t = translations.conditionBuilder;
const type = computed(() => props.field?.type ?? 'text');
const options = computed(() => props.field?.options ?? []);
const booleanItems = computed(() => [
    { value: 'true', label: t.yes },
    { value: 'false', label: t.no },
]);
</script>

<template>
    <NumberInput
        v-if="type === 'number'"
        :model-value="(value as number | null) ?? null"
        :aria-label="label"
        :disabled="disabled"
        size="sm"
        @update:model-value="emit('change', $event)"
    />
    <DatePicker
        v-else-if="type === 'date'"
        :model-value="(value as string | null) ?? null"
        :aria-label="label"
        :disabled="disabled"
        size="sm"
        @update:model-value="emit('change', $event)"
    />
    <MultiSelect
        v-else-if="type === 'select' && rule.operator === 'in'"
        :items="options"
        :model-value="(value as string[]) ?? []"
        :aria-label="label"
        :disabled="disabled"
        @update:model-value="emit('change', $event)"
    />
    <NativeSelect
        v-else-if="type === 'select'"
        :items="options"
        :model-value="(value as string) ?? ''"
        :placeholder="translations.common.placeholder"
        :aria-label="label"
        :disabled="disabled"
        size="sm"
        @update:model-value="emit('change', $event)"
    />
    <NativeSelect
        v-else-if="type === 'boolean'"
        :items="booleanItems"
        :model-value="String(value ?? true)"
        :aria-label="label"
        :disabled="disabled"
        size="sm"
        @update:model-value="emit('change', $event === 'true')"
    />
    <Input
        v-else
        :model-value="(value as string) ?? ''"
        :aria-label="label"
        :disabled="disabled"
        size="sm"
        @update:model-value="emit('change', $event)"
    />
</template>
