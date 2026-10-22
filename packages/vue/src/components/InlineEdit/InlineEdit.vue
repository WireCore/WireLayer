<script setup lang="ts" generic="T = string">
import { Check, Pencil, X } from '@lucide/vue';
import { inlineEdit as inlineEditRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import {
    computed,
    nextTick,
    normalizeClass,
    ref,
    shallowRef,
    useAttrs,
    useId,
    useTemplateRef,
    type FunctionalComponent,
} from 'vue';
import IconButton from '../IconButton/IconButton.vue';
import Input from '../Input/Input.vue';
import Popover from '../Popover/Popover.vue';
import PopoverContent from '../Popover/PopoverContent.vue';
import PopoverTrigger from '../Popover/PopoverTrigger.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

export interface InlineEditProps<T = string> {
    /** The value – use with v-model; it changes only when a valid edit is saved */
    modelValue?: T;
    defaultValue?: T;
    /** What is edited, e.g. "Project name" – names the editor and the button */
    label: string;
    /** `inline` (default): the editor replaces the text; `popover`: it opens in a popover next to the text */
    mode?: 'inline' | 'popover';
    /** Text while the value is empty (default "Empty") */
    placeholder?: string;
    /** Text of the value (default: the value as text) */
    format?: (value: T | undefined) => string;
    /**
     * Checks the value before saving: a message keeps the editor open and is shown (and announced); may be async
     * (the save button is busy meanwhile)
     */
    validate?: (value: T | undefined) => string | null | undefined | Promise<string | null | undefined>;
    /** Editing state – use with v-model:editing */
    editing?: boolean;
    disabled?: boolean;
    saveLabel?: string;
    cancelLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof inlineEditRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<InlineEditProps<T>>(), {
    modelValue: undefined,
    defaultValue: undefined,
    mode: 'inline',
    editing: undefined,
});
const inlineEdit = useRecipe('inlineEdit', inlineEditRecipe, () => props.classes);
const emit = defineEmits<{
    'update:modelValue': [value: T | undefined];
    'update:editing': [editing: boolean];
    /** A valid edit was saved */
    save: [value: T | undefined];
    cancel: [];
}>();
defineSlots<{
    /** The editor: Input (default), Textarea, Select, NumberInput, DatePicker … bound to `value`/`setValue` */
    editor?(props: {
        value: T | undefined;
        setValue: (value: T | undefined) => void;
        save: () => void;
        cancel: () => void;
        invalid: boolean;
        /** Id of the error text – for aria-describedby of the editor */
        errorId: string | undefined;
        label: string;
    }): unknown;
    /** Own rendering of the value */
    display?(props: { value: T | undefined }): unknown;
}>();
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.inlineEdit;
const styles = inlineEdit();
const id = useId();
const internal = ref(false);
const ownValue = shallowRef<T | undefined>(props.defaultValue);
const model = computed(() => (props.modelValue !== undefined ? props.modelValue : ownValue.value));
const isEditing = computed(() => props.editing ?? internal.value);
const draft = shallowRef<T | undefined>(model.value);
const error = ref<string | null>(null);
const busy = ref(false);
const form = useTemplateRef<HTMLFormElement>('form');
const display = useTemplateRef<HTMLButtonElement>('display');
const text = computed(() =>
    props.format ? props.format(model.value) : model.value == null ? '' : String(model.value)
);

const focusEditor = () =>
    form.value?.querySelector<HTMLElement>('input, textarea, select, [contenteditable], button, [tabindex]')?.focus();

async function setEditing(next: boolean, restoreFocus = true) {
    if (next) {
        draft.value = model.value;
        error.value = null;
    }
    internal.value = next;
    emit('update:editing', next);
    await nextTick();
    if (props.mode === 'popover') return;
    // Into the editor, and back to the text a task later (so the Enter that saved does not open it again)
    if (next) focusEditor();
    else if (restoreFocus) setTimeout(() => display.value?.focus());
}

async function save() {
    if (busy.value) return;
    const value = draft.value;
    if (props.validate) {
        busy.value = true;
        try {
            error.value = (await props.validate(value)) || null;
        } finally {
            busy.value = false;
        }
        if (error.value) {
            await nextTick();
            focusEditor();
            return;
        }
    }
    ownValue.value = value;
    emit('update:modelValue', value);
    emit('save', value);
    void setEditing(false);
}
function cancel() {
    emit('cancel');
    void setEditing(false);
}
// Escape cancels; Ctrl/⌘+Enter saves (also from a textarea, where Enter makes a new line)
function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && props.mode === 'inline') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        void save();
    }
}
function onPopoverOpen(open: boolean) {
    if (open) void setEditing(true);
    else if (isEditing.value) cancel();
}
const setValue = (value: T | undefined) => {
    draft.value = value;
    if (error.value) error.value = null;
};
const errorId = computed(() => (error.value ? `${id}error` : undefined));
// Renders only its content – stands in for the popover parts in inline mode
const Passthrough: FunctionalComponent = (_, { slots }) => slots.default?.();
</script>

<template>
    <!--
        The value as a button; activating it shows an editor (inline or in a popover) with save and cancel. Enter
        saves (Ctrl/⌘+Enter in a textarea), Escape cancels; a failed check keeps the editor open with the message.
    -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <component
            :is="mode === 'popover' ? Popover : Passthrough"
            v-bind="
                mode === 'popover' ? { open: isEditing, placement: 'bottom-start', 'onUpdate:open': onPopoverOpen } : {}
            "
        >
            <component :is="mode === 'popover' ? PopoverTrigger : Passthrough">
                <button
                    v-if="mode === 'popover' || !isEditing"
                    ref="display"
                    type="button"
                    :class="styles.display()"
                    :disabled="disabled"
                    @click="mode === 'inline' && setEditing(true)"
                >
                    <slot name="display" :value="model">
                        <span :class="text ? styles.value() : styles.placeholder()">{{
                            text || (placeholder ?? t.empty)
                        }}</span>
                    </slot>
                    <span :class="styles.hint()">{{ t.title(label) }}</span>
                    <Pencil :class="styles.editIcon()" aria-hidden="true" />
                </button>
            </component>
            <component
                :is="mode === 'popover' ? PopoverContent : Passthrough"
                v-if="mode === 'popover' || isEditing"
                v-bind="mode === 'popover' ? { title: t.title(label) } : {}"
            >
                <form ref="form" :class="styles.form()" novalidate @submit.prevent="save" @keydown="onKeydown">
                    <div :class="styles.row()">
                        <div :class="styles.editor()">
                            <slot
                                name="editor"
                                :value="draft"
                                :set-value="setValue"
                                :save="save"
                                :cancel="cancel"
                                :invalid="!!error"
                                :error-id="errorId"
                                :label="label"
                            >
                                <Input
                                    :model-value="(draft as string | undefined) ?? ''"
                                    :aria-label="label"
                                    :invalid="!!error"
                                    :aria-describedby="errorId"
                                    size="sm"
                                    @update:model-value="setValue($event as T)"
                                />
                            </slot>
                        </div>
                        <div :class="styles.actions()">
                            <IconButton
                                :icon="Check"
                                :label="saveLabel ?? t.save"
                                type="submit"
                                variant="soft"
                                size="sm"
                                :aria-busy="busy || undefined"
                            />
                            <IconButton
                                :icon="X"
                                :label="cancelLabel ?? t.cancel"
                                variant="text"
                                size="sm"
                                @click="cancel"
                            />
                        </div>
                    </div>
                    <p v-if="error" :id="errorId" :class="styles.error()" role="alert">{{ error }}</p>
                </form>
            </component>
        </component>
    </div>
</template>
