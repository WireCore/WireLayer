<script setup lang="ts">
import {
    authForm as authFormRecipe,
    validateAuth,
    type AuthField,
    type AuthMode,
    type AuthValues,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import {
    Button,
    Checkbox,
    Field,
    FormErrorSummary,
    Input,
    PasswordInput,
    PinInput,
    useLocale,
    useRecipe,
} from '@wirecore/wirelayer-vue';
import { computed, nextTick, normalizeClass, reactive, ref, useAttrs, useId, useTemplateRef } from 'vue';

export interface AuthFormProps {
    /** signIn, signUp, reset (password forgotten) or code (one-time code) – use with v-model:mode */
    mode?: AuthMode;
    defaultMode?: AuthMode;
    /** Modes the links switch between (default sign in, sign up and reset) */
    modes?: readonly AuthMode[];
    /** Heading (default by mode) */
    title?: string;
    /** Text below the heading (default by mode) */
    description?: string;
    /** Heading level that fits the page (default h1) */
    titleTag?: 'h1' | 'h2' | 'h3';
    /** "Keep me signed in" when signing in (default true) */
    remember?: boolean;
    /** Minimum length of a new password (default 8) */
    passwordMinLength?: number;
    /** Digits of the one-time code (default 6) */
    codeLength?: number;
    /** Own checks per field, e.g. the validators of @wirecore/wirelayer-vue/form – after the built-in ones */
    validators?: Partial<Record<AuthField, (value: string) => string | undefined>>;
    /** An error of the server (wrong password …), shown in the summary */
    error?: string;
    /** Submitting: the button shows a spinner */
    loading?: boolean;
    /** Reset: the link was sent (a status message replaces the form) */
    sent?: boolean;
    /** Start values, e.g. a known e-mail address */
    defaultValues?: Partial<AuthValues>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof authFormRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<AuthFormProps>(), {
    mode: undefined,
    defaultMode: 'signIn',
    modes: () => ['signIn', 'signUp', 'reset'],
    titleTag: 'h1',
    remember: true,
    passwordMinLength: 8,
    codeLength: 6,
});
const emit = defineEmits<{
    'update:mode': [mode: AuthMode];
    /** The fields are valid: the mode and the values (handle the request, then set `error` or move on) */
    submit: [payload: { mode: AuthMode } & AuthValues];
}>();
defineSlots<{
    /** Buttons of sign-in providers (neutral buttons with text, no brand logos) */
    providers?(): unknown;
    /** Below the form, e.g. terms or a help link */
    footer?(): unknown;
}>();
const authForm = useRecipe('authForm', authFormRecipe, () => props.classes);
const attrs = useAttrs();
const locale = useLocale();
const t = computed(() => locale.value.translations.authForm);
const styles = authForm();
const id = useId();
const heading = useTemplateRef<HTMLElement>('heading');
const internalMode = ref<AuthMode>(props.defaultMode);
const current = computed(() => props.mode ?? internalMode.value);
const values = reactive<AuthValues>({
    name: '',
    email: '',
    password: '',
    code: '',
    remember: false,
    ...props.defaultValues,
});
// Errors after the first attempt, then live while correcting (WCAG 3.3.1)
const attempts = ref(0);
const errors = computed(() =>
    attempts.value
        ? validateAuth(current.value, values, {
              texts: locale.value.translations.validation,
              passwordMinLength: props.passwordMinLength,
              codeLength: props.codeLength,
              validators: props.validators,
          })
        : {}
);
const fieldId = (field: AuthField) => `${id}${field}`;
const summary = computed(() => [
    ...(props.error ? [{ message: props.error }] : []),
    ...(Object.entries(errors.value) as [AuthField, string][]).map(([field, message]) => ({
        message,
        id: fieldId(field),
    })),
]);

function switchTo(mode: AuthMode) {
    attempts.value = 0;
    internalMode.value = mode;
    emit('update:mode', mode);
    // The new heading tells where we are
    void nextTick(() => heading.value?.focus());
}
function submit() {
    attempts.value++;
    if (Object.keys(errors.value).length) return;
    emit('submit', { mode: current.value, ...values });
}
</script>

<template>
    <!-- One form for sign in, sign up, password reset and one-time code; errors in a summary that takes the focus -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div :class="styles.header()">
            <component :is="titleTag" ref="heading" tabindex="-1" :class="styles.title()">{{
                title ?? t.titles[current]
            }}</component>
            <p :class="styles.description()">{{ description ?? t.descriptions[current] }}</p>
        </div>
        <template v-if="$slots.providers && (current === 'signIn' || current === 'signUp')">
            <div role="group" :aria-label="t.providers" :class="styles.providers()"><slot name="providers" /></div>
            <div :class="styles.divider()">{{ t.or }}</div>
        </template>
        <FormErrorSummary :errors="summary" title-tag="h2" :focus-key="attempts" />
        <p v-if="current === 'reset' && sent" role="status" :class="styles.status()">{{ t.resetSent }}</p>
        <form v-else :class="styles.form()" novalidate @submit.prevent="submit">
            <Field v-if="current === 'signUp'" :id="fieldId('name')" :label="t.name" required :error="errors.name">
                <Input v-model="values.name" name="name" autocomplete="name" />
            </Field>
            <Field v-if="current !== 'code'" :id="fieldId('email')" :label="t.email" required :error="errors.email">
                <Input v-model="values.email" type="email" name="email" autocomplete="email" />
            </Field>
            <Field
                v-if="current === 'signIn' || current === 'signUp'"
                :id="fieldId('password')"
                :label="t.password"
                required
                :helper-text="current === 'signUp' ? t.passwordHint(passwordMinLength) : undefined"
                :error="errors.password"
            >
                <PasswordInput
                    v-model="values.password"
                    name="password"
                    :autocomplete="current === 'signUp' ? 'new-password' : 'current-password'"
                />
            </Field>
            <Field v-if="current === 'code'" :id="fieldId('code')" :label="t.code" required :error="errors.code">
                <PinInput v-model="values.code" :length="codeLength" otp name="code" />
            </Field>
            <div v-if="current === 'signIn' && (remember || modes.includes('reset'))" :class="styles.row()">
                <Checkbox v-if="remember" v-model:checked="values.remember" name="remember">{{ t.remember }}</Checkbox>
                <button v-if="modes.includes('reset')" type="button" :class="styles.link()" @click="switchTo('reset')">
                    {{ t.forgot }}
                </button>
            </div>
            <Button type="submit" :loading="loading" block>{{ t.submit[current] }}</Button>
        </form>
        <p v-if="current === 'signIn' && modes.includes('signUp')" :class="styles.footer()">
            {{ t.noAccount }}
            <button type="button" :class="styles.link()" @click="switchTo('signUp')">{{ t.signUpLink }}</button>
        </p>
        <p v-else-if="current === 'signUp' && modes.includes('signIn')" :class="styles.footer()">
            {{ t.hasAccount }}
            <button type="button" :class="styles.link()" @click="switchTo('signIn')">{{ t.signInLink }}</button>
        </p>
        <p v-else-if="(current === 'reset' || current === 'code') && modes.includes('signIn')" :class="styles.footer()">
            <button type="button" :class="styles.link()" @click="switchTo('signIn')">{{ t.back }}</button>
        </p>
        <slot name="footer" />
    </div>
</template>
