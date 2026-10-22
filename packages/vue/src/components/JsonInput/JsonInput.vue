<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import { CircleAlert, CircleCheck } from '@lucide/vue';
import { checkJson, formatJson, jsonInput as jsonInputRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId } from 'vue';
import Button from '../Button/Button.vue';
import Textarea from '../Textarea/Textarea.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface JsonInputProps {
    /** The JSON text – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Spaces per level when formatting (default 2) */
    indent?: number;
    /** Button that formats the text (default true) */
    formatButton?: boolean;
    /** Formats valid JSON when the field loses focus */
    formatOnBlur?: boolean;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    readOnly?: boolean;
    /** Marks the field invalid (it also is while the text is no valid JSON) */
    invalid?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof jsonInputRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<JsonInputProps>(), {
    modelValue: undefined,
    defaultValue: '',
    indent: 2,
    formatButton: true,
    rows: 8,
});
const emit = defineEmits<{
    'update:modelValue': [value: string];
    /** The parsed value whenever the text is valid JSON */
    valueParse: [value: unknown];
}>();
const jsonInput = useRecipe('jsonInput', jsonInputRecipe, () => props.classes);
const attrs = useAttrs();
const field = useFieldContext();
const t = useTranslations().jsonInput;
const statusId = `${useId()}status`;
const internal = ref(props.defaultValue);
const text = computed(() => props.modelValue ?? internal.value);
const check = computed(() => (text.value.trim() ? checkJson(text.value) : undefined));
const state = computed(() => (!check.value ? 'empty' : check.value.valid ? 'valid' : 'invalid'));
const styles = computed(() => jsonInput({ state: state.value }));
const message = computed(() => {
    const result = check.value;
    if (!result) return '';
    if (result.valid) return t.valid;
    return result.line ? t.invalidAt(result.line, result.column ?? 1) : t.invalid;
});

function setText(value: string) {
    internal.value = value;
    emit('update:modelValue', value);
    const result = value.trim() ? checkJson(value) : undefined;
    if (result?.valid) emit('valueParse', result.value);
}
function format() {
    const formatted = formatJson(text.value, props.indent);
    if (formatted !== null && formatted !== text.value) setText(formatted);
}
</script>

<template>
    <!-- JSON text field: checked while typing (the result is the field's description), "Format" pretty-prints -->
    <div :class="styles.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <Textarea
            v-bind="{ ...attrs, class: undefined, style: undefined }"
            :model-value="text"
            :placeholder="placeholder"
            :rows="rows"
            :disabled="disabled"
            :readonly="readOnly"
            :name="name"
            :invalid="invalid || state === 'invalid'"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            :aria-describedby="[field?.ariaDescribedby, statusId].filter(Boolean).join(' ')"
            :classes="{ base: styles.textarea() }"
            @update:model-value="setText($event ?? '')"
            @blur="formatOnBlur && format()"
        />
        <div :class="styles.footer()">
            <span :id="statusId" :class="styles.status()">
                <CircleCheck v-if="state === 'valid'" :class="styles.statusIcon()" aria-hidden="true" />
                <CircleAlert v-else-if="state === 'invalid'" :class="styles.statusIcon()" aria-hidden="true" />
                {{ message }}
            </span>
            <Button
                v-if="formatButton"
                variant="outline"
                size="sm"
                :disabled="disabled || readOnly || state !== 'valid'"
                @click="format"
            >
                {{ t.format }}
            </Button>
        </div>
    </div>
</template>
