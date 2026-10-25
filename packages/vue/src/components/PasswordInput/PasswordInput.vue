<script setup lang="ts">
import { PasswordInput } from '@ark-ui/vue/password-input';
import { Check, Circle, Eye, EyeOff } from '@lucide/vue';
import { useFieldContext } from '@ark-ui/vue/field';
import {
    checkPasswordRequirements,
    passwordInput as passwordInputRecipe,
    passwordStrength,
    setTextControlValue,
    type PasswordRequirement,
    type RecipeClasses,
    type Size,
} from '@wirecore/wirelayer-recipes';
import { computed, ref, useAttrs, useId, useTemplateRef } from 'vue';
import { splitAttrs } from '../../utils/attrs.js';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';
import { useFieldStatus } from '../Field/context.js';
import InputStatus from '../Input/InputStatus.vue';

const translations = useTranslations();

export interface PasswordInputProps {
    size?: Size;
    invalid?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    /** Initially show the password in plain text */
    defaultVisible?: boolean;
    /** Whether the password is shown in plain text – use with v-model:visible */
    visible?: boolean;
    autocomplete?: 'current-password' | 'new-password';
    /** Strength meter below the field – for choosing a new password */
    strength?: boolean;
    /**
     * Checklist below the field, updated while typing: each rule with its state (icon and text), linked to the input
     * as its description
     */
    requirements?: readonly PasswordRequirement[];
    /** Shows a spinner in the field and marks it busy (aria-busy) */
    loading?: boolean;
    /** Shows a button that empties the field while it has a value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    /** Initial value without v-model */
    defaultValue?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof passwordInputRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<PasswordInputProps>(), {
    invalid: undefined,
    success: undefined,
    disabled: undefined,
    readOnly: undefined,
    required: undefined,
    defaultVisible: undefined,
    visible: undefined,
    autocomplete: 'current-password',
    strength: false,
    requirements: undefined,
    defaultValue: undefined,
});
const emit = defineEmits<{ 'update:visible': [visible: boolean] }>();
const passwordInput = useRecipe('passwordInput', passwordInputRecipe, () => props.classes);
const model = defineModel<string>();
const attrs = useAttrs();
const split = computed(() => splitAttrs(attrs));
const field = useFieldContext();
const fieldStatus = useFieldStatus();
const isInvalid = computed(() => !!props.invalid || !!field?.value.invalid);
const isSuccess = computed(() => !isInvalid.value && (!!props.success || fieldStatus.value.success));
const styles = computed(() => passwordInput({ size: props.size, success: isSuccess.value }));

// Strength: 4 bars and a word, announced politely and linked to the input
const id = useId();
// Typed value without v-model
const typed = ref(props.defaultValue);
const current = computed(() => model.value ?? typed.value);
const level = computed(() => passwordStrength(current.value ?? ''));
const levelText = computed(() => (current.value ? translations.passwordStrength.levels[level.value] : ''));
const met = computed(() => checkPasswordRequirements(current.value ?? '', props.requirements ?? []));
function onInput(event: Event) {
    typed.value = (event.target as HTMLInputElement).value;
    model.value = typed.value;
}
const describedBy = computed(() =>
    props.strength || props.requirements?.length
        ? [
              field?.value.ariaDescribedby,
              props.strength && `${id}strength`,
              props.requirements?.length && `${id}requirements`,
          ]
              .filter(Boolean)
              .join(' ')
        : undefined
);

const isDisabled = computed(() => !!props.disabled || !!field?.value.disabled);
const isReadOnly = computed(() => !!props.readOnly || !!field?.value.readOnly);
const control = useTemplateRef<{ $el: HTMLElement }>('control');
function clear() {
    const input = control.value?.$el.querySelector('input');
    if (!input) return;
    setTextControlValue(input);
    input.focus();
}
</script>

<template>
    <!-- Password field with a button that shows/hides the password ("Show/Hide password") -->
    <PasswordInput.Root
        :class="styles.base({ class: split.className })"
        :style="split.style"
        :invalid="invalid"
        :disabled="disabled"
        :read-only="readOnly"
        :required="required"
        :name="name"
        :default-visible="defaultVisible"
        :visible="visible"
        :auto-complete="autocomplete"
        :translations="translations.passwordInput"
        @visibility-change="emit('update:visible', $event.visible)"
    >
        <PasswordInput.Control ref="control" :class="styles.control()">
            <PasswordInput.Input
                v-bind="split.rest"
                :aria-describedby="describedBy"
                :aria-busy="loading || undefined"
                :value="current"
                :class="styles.input()"
                @input="onInput"
            />
            <InputStatus
                v-if="loading || clearable || isSuccess"
                :loading="loading"
                :clear="clearable && !!current && !isDisabled && !isReadOnly"
                :clear-label="clearLabel ?? translations.field.clear"
                :success="isSuccess"
                :classes="{
                    spinner: styles.spinner(),
                    clear: styles.clear(),
                    clearIcon: styles.clearIcon(),
                    statusIcon: styles.statusIcon(),
                }"
                @clear="clear"
            />
            <PasswordInput.VisibilityTrigger :class="styles.toggle()">
                <PasswordInput.Indicator>
                    <EyeOff :class="styles.toggleIcon()" aria-hidden="true" />
                    <template #fallback><Eye :class="styles.toggleIcon()" aria-hidden="true" /></template>
                </PasswordInput.Indicator>
            </PasswordInput.VisibilityTrigger>
        </PasswordInput.Control>
        <div v-if="strength" :class="styles.strength()">
            <div :class="styles.meter()" aria-hidden="true">
                <span
                    v-for="bar in 4"
                    :key="bar"
                    :class="styles.bar()"
                    :data-level="level"
                    :data-filled="bar <= level || undefined"
                />
            </div>
            <span :id="`${id}strength`" :class="styles.strengthText()" aria-live="polite">
                <template v-if="levelText">{{ translations.passwordStrength.label(levelText) }}</template>
            </span>
        </div>
        <ul
            v-if="requirements?.length"
            :id="`${id}requirements`"
            :class="styles.requirements()"
            :aria-label="translations.passwordRequirements.label"
        >
            <li
                v-for="(requirement, index) in requirements"
                :key="requirement.label"
                :class="styles.requirement()"
                :data-met="met[index] || undefined"
            >
                <Check v-if="met[index]" :class="styles.requirementIcon()" aria-hidden="true" />
                <Circle v-else :class="styles.requirementIcon()" aria-hidden="true" />
                {{ requirement.label
                }}<span :class="styles.requirementState()">{{
                    `: ${met[index] ? translations.passwordRequirements.met : translations.passwordRequirements.unmet}`
                }}</span>
            </li>
        </ul>
    </PasswordInput.Root>
</template>
