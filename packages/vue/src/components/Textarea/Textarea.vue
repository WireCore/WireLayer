<script setup lang="ts">
import { Field, useFieldContext } from '@ark-ui/vue/field';
import {
    setTextControlValue,
    textarea as textareaRecipe,
    textareaParts as textareaPartsRecipe,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import {
    computed,
    nextTick,
    normalizeClass,
    onBeforeUnmount,
    onMounted,
    ref,
    useAttrs,
    useId,
    useTemplateRef,
    watch,
} from 'vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useFieldStatus } from '../Field/context.js';
import InputStatus from '../Input/InputStatus.vue';

export interface TextareaProps {
    /** Start value without v-model (uncontrolled) */
    defaultValue?: string;
    size?: Size;
    /** Marks the textarea as invalid (also inherited from a surrounding Field) */
    invalid?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    /** Disables the textarea (also inherited from a surrounding Field) */
    disabled?: boolean;
    /** Grows with its text instead of scrolling (rows stays the minimum) */
    autoResize?: boolean;
    /** With autoResize: at least this many rows */
    minRows?: number;
    /** With autoResize: at most this many rows, then it scrolls */
    maxRows?: number;
    /**
     * Counter "12 / 200" below the field (needs `maxlength`); the remaining characters are announced once typing
     * pauses, not on every character
     */
    showCount?: boolean;
    /** Shows a spinner in the corner and marks the field busy (aria-busy) */
    loading?: boolean;
    /** Shows a button that empties the field while it has text */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipes textarea and textareaParts) */
    classes?: RecipeClasses<typeof textareaRecipe> & RecipeClasses<typeof textareaPartsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = defineProps<TextareaProps>();
const textarea = useRecipe('textarea', textareaRecipe, () => props.classes);
const textareaParts = useRecipe('textareaParts', textareaPartsRecipe, () => props.classes);
const translations = useTranslations();
const model = defineModel<string>();
const attrs = useAttrs();
const fieldContext = useFieldContext();
const fieldStatus = useFieldStatus();

const isInvalid = computed(() => props.invalid || !!fieldContext?.value.invalid);
const isSuccess = computed(() => !isInvalid.value && (props.success || fieldStatus.value.success));
const isDisabled = computed(() => props.disabled || !!fieldContext?.value.disabled);
const isReadOnly = computed(() => attrs.readonly !== undefined && attrs.readonly !== false);
const maxLength = computed(() => {
    const value = Number(attrs.maxlength ?? attrs.maxLength);
    return Number.isFinite(value) && value > 0 ? value : undefined;
});
const counted = computed(() => props.showCount && maxLength.value !== undefined);
const trailing = computed(() => props.loading || props.clearable || isSuccess.value);
// Without counter, spinner or clear button the textarea is rendered on its own (unchanged DOM)
const wrapped = computed(() => counted.value || props.loading || props.clearable);
const parts = computed(() => textareaParts());
// Typed text without v-model (e.g. with defaultValue)
const typed = ref(props.defaultValue ?? '');
const length = computed(() => (model.value ?? typed.value).length);
// What the textarea shows: v-model, else the typed text (starting with defaultValue)
const text = computed({
    get: () => model.value ?? typed.value,
    set: (value: string) => {
        typed.value = value;
        model.value = value;
    },
});

// autoResize: as high as the text (plus the border), within minRows/maxRows
const element = useTemplateRef<{ $el: HTMLTextAreaElement }>('element');
function resize() {
    const area = element.value?.$el;
    if (!props.autoResize || !area) return;
    area.style.height = 'auto';
    const border = area.offsetHeight - area.clientHeight;
    let height = area.scrollHeight + border;
    if (props.minRows || props.maxRows) {
        const style = getComputedStyle(area);
        const line = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
        const frame = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + border;
        const max = props.maxRows ? props.maxRows * line + frame : Infinity;
        area.style.overflowY = height > max ? 'auto' : '';
        height = Math.min(Math.max(height, props.minRows ? props.minRows * line + frame : 0), max);
    }
    area.style.height = `${height}px`;
}
onMounted(resize);
watch(model, () => nextTick(resize));

// Counter: announced politely once typing pauses
const counterId = useId();
const announcement = ref('');
let announceTimer: ReturnType<typeof setTimeout> | undefined;
function onInput(event: Event) {
    typed.value = (event.target as HTMLTextAreaElement).value;
    resize();
    if (!counted.value) return;
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
        announcement.value = translations.textarea.remaining(maxLength.value! - length.value, maxLength.value!);
    }, 1000);
}
onBeforeUnmount(() => clearTimeout(announceTimer));

const describedBy = computed(
    () =>
        [fieldContext?.value.ariaDescribedby, counted.value && counterId, attrs['aria-describedby']]
            .filter(Boolean)
            .join(' ') || undefined
);

function clear() {
    const area = element.value?.$el;
    if (!area) return;
    setTextControlValue(area);
    area.focus();
}
</script>

<template>
    <Field.Textarea
        v-if="!wrapped"
        ref="element"
        v-model="text"
        v-bind="{
            ...attrs,
            class: textarea({
                size,
                invalid: isInvalid,
                success: isSuccess,
                disabled: isDisabled,
                autoResize,
                class: normalizeClass(attrs.class),
            }),
        }"
        :rows="(attrs.rows as number | undefined) ?? minRows"
        :disabled="isDisabled || undefined"
        :aria-invalid="isInvalid || undefined"
        @input="onInput"
    />
    <div v-else :class="parts.base({ class: normalizeClass(attrs.class) })" :style="attrs.style">
        <Field.Textarea
            ref="element"
            v-model="text"
            v-bind="{ ...attrs, class: undefined, style: undefined }"
            :class="
                textarea({
                    size,
                    invalid: isInvalid,
                    success: isSuccess,
                    disabled: isDisabled,
                    autoResize,
                    hasTrailing: trailing,
                })
            "
            :rows="(attrs.rows as number | undefined) ?? minRows"
            :disabled="isDisabled || undefined"
            :aria-invalid="isInvalid || undefined"
            :aria-describedby="describedBy"
            :aria-busy="loading || undefined"
            @input="onInput"
        />
        <div v-if="trailing" :class="parts.trailing()">
            <InputStatus
                :loading="loading"
                :clear="clearable && length > 0 && !isDisabled && !isReadOnly"
                :clear-label="clearLabel ?? translations.field.clear"
                :success="isSuccess"
                :classes="{
                    spinner: parts.spinner(),
                    clear: parts.clear(),
                    clearIcon: parts.clearIcon(),
                    statusIcon: parts.statusIcon(),
                }"
                @clear="clear"
            />
        </div>
        <template v-if="counted">
            <span :id="counterId" :class="parts.counter()" aria-hidden="true">{{
                translations.textarea.counter(length, maxLength!)
            }}</span>
            <span :class="parts.status()" role="status">{{ announcement }}</span>
        </template>
    </div>
</template>
