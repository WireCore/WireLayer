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
} from '@wirecore/wirelayer-react';
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';

export interface AuthFormProps extends Omit<ComponentProps<'div'>, 'children' | 'title' | 'onSubmit'> {
    /** signIn, signUp, reset (password forgotten) or code (one-time code) (controlled) */
    mode?: AuthMode;
    defaultMode?: AuthMode;
    onModeChange?: (mode: AuthMode) => void;
    /** Modes the links switch between (default sign in, sign up and reset) */
    modes?: AuthMode[];
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
    /** Own checks per field, e.g. the validators of @wirecore/wirelayer-react/form – after the built-in ones */
    validators?: Partial<Record<AuthField, (value: string) => string | undefined>>;
    /** An error of the server (wrong password …), shown in the summary */
    error?: string;
    /** Submitting: the button shows a spinner */
    loading?: boolean;
    /** Reset: the link was sent (a status message replaces the form) */
    sent?: boolean;
    /** Start values, e.g. a known e-mail address */
    defaultValues?: Partial<AuthValues>;
    /** The fields are valid: the mode and the values (handle the request, then set `error` or move on) */
    onSubmit?: (payload: { mode: AuthMode } & AuthValues) => void;
    /** Buttons of sign-in providers (neutral buttons with text, no brand logos) */
    providers?: ReactNode;
    /** Below the form, e.g. terms or a help link */
    footer?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof authFormRecipe>;
}

/** One form for sign in, sign up, password reset and one-time code; errors in a summary that takes the focus */
export function AuthForm({
    mode,
    defaultMode = 'signIn',
    onModeChange,
    modes = ['signIn', 'signUp', 'reset'],
    title,
    description,
    titleTag: Title = 'h1',
    remember = true,
    passwordMinLength = 8,
    codeLength = 6,
    validators,
    error,
    loading,
    sent,
    defaultValues,
    onSubmit,
    providers,
    footer,
    classes,
    className,
    ...props
}: AuthFormProps) {
    const authForm = useRecipe('authForm', authFormRecipe, classes);
    const locale = useLocale();
    const t = locale.translations.authForm;
    const styles = authForm();
    const id = useId();
    const heading = useRef<HTMLHeadingElement>(null);
    const [internalMode, setInternalMode] = useState<AuthMode>(defaultMode);
    const current = mode ?? internalMode;
    const [values, setValues] = useState<AuthValues>({
        name: '',
        email: '',
        password: '',
        code: '',
        remember: false,
        ...defaultValues,
    });
    const set = <K extends keyof AuthValues>(key: K, value: AuthValues[K]) =>
        setValues((before) => ({ ...before, [key]: value }));
    // Errors after the first attempt, then live while correcting (WCAG 3.3.1)
    const [attempts, setAttempts] = useState(0);
    const options = { texts: locale.translations.validation, passwordMinLength, codeLength, validators };
    const errors = attempts ? validateAuth(current, values, options) : {};
    const fieldId = (field: AuthField) => `${id}${field}`;
    const summary = [
        ...(error ? [{ message: error }] : []),
        ...(Object.entries(errors) as [AuthField, string][]).map(([field, message]) => ({
            message,
            id: fieldId(field),
        })),
    ];
    // The new heading tells where we are after switching
    const [switched, setSwitched] = useState(0);
    useEffect(() => {
        if (switched) heading.current?.focus();
    }, [switched]);

    const switchTo = (next: AuthMode) => {
        setAttempts(0);
        setInternalMode(next);
        onModeChange?.(next);
        setSwitched((count) => count + 1);
    };
    const submit = () => {
        setAttempts((count) => count + 1);
        if (Object.keys(validateAuth(current, values, options)).length) return;
        onSubmit?.({ mode: current, ...values });
    };

    return (
        <div {...props} className={styles.base({ class: className })}>
            <div className={styles.header()}>
                <Title ref={heading} tabIndex={-1} className={styles.title()}>
                    {title ?? t.titles[current]}
                </Title>
                <p className={styles.description()}>{description ?? t.descriptions[current]}</p>
            </div>
            {providers && (current === 'signIn' || current === 'signUp') && (
                <>
                    <div role="group" aria-label={t.providers} className={styles.providers()}>
                        {providers}
                    </div>
                    <div className={styles.divider()}>{t.or}</div>
                </>
            )}
            <FormErrorSummary errors={summary} titleTag="h2" focusKey={attempts} />
            {current === 'reset' && sent ? (
                <p role="status" className={styles.status()}>
                    {t.resetSent}
                </p>
            ) : (
                <form
                    className={styles.form()}
                    noValidate
                    onSubmit={(event) => {
                        event.preventDefault();
                        submit();
                    }}
                >
                    {current === 'signUp' && (
                        <Field id={fieldId('name')} label={t.name} required error={errors.name}>
                            <Input
                                value={values.name}
                                onChange={(event) => set('name', event.target.value)}
                                name="name"
                                autoComplete="name"
                            />
                        </Field>
                    )}
                    {current !== 'code' && (
                        <Field id={fieldId('email')} label={t.email} required error={errors.email}>
                            <Input
                                value={values.email}
                                onChange={(event) => set('email', event.target.value)}
                                type="email"
                                name="email"
                                autoComplete="email"
                            />
                        </Field>
                    )}
                    {(current === 'signIn' || current === 'signUp') && (
                        <Field
                            id={fieldId('password')}
                            label={t.password}
                            required
                            helperText={current === 'signUp' ? t.passwordHint(passwordMinLength) : undefined}
                            error={errors.password}
                        >
                            <PasswordInput
                                value={values.password}
                                onChange={(event) => set('password', event.target.value)}
                                name="password"
                                autoComplete={current === 'signUp' ? 'new-password' : 'current-password'}
                            />
                        </Field>
                    )}
                    {current === 'code' && (
                        <Field id={fieldId('code')} label={t.code} required error={errors.code}>
                            <PinInput
                                value={values.code}
                                onValueChange={(code) => set('code', code)}
                                length={codeLength}
                                otp
                                name="code"
                            />
                        </Field>
                    )}
                    {current === 'signIn' && (remember || modes.includes('reset')) && (
                        <div className={styles.row()}>
                            {remember && (
                                <Checkbox
                                    checked={values.remember}
                                    onCheckedChange={(checked) => set('remember', checked === true)}
                                    name="remember"
                                >
                                    {t.remember}
                                </Checkbox>
                            )}
                            {modes.includes('reset') && (
                                <button type="button" className={styles.link()} onClick={() => switchTo('reset')}>
                                    {t.forgot}
                                </button>
                            )}
                        </div>
                    )}
                    <Button type="submit" loading={loading} block>
                        {t.submit[current]}
                    </Button>
                </form>
            )}
            {current === 'signIn' && modes.includes('signUp') ? (
                <p className={styles.footer()}>
                    {t.noAccount}{' '}
                    <button type="button" className={styles.link()} onClick={() => switchTo('signUp')}>
                        {t.signUpLink}
                    </button>
                </p>
            ) : current === 'signUp' && modes.includes('signIn') ? (
                <p className={styles.footer()}>
                    {t.hasAccount}{' '}
                    <button type="button" className={styles.link()} onClick={() => switchTo('signIn')}>
                        {t.signInLink}
                    </button>
                </p>
            ) : (current === 'reset' || current === 'code') && modes.includes('signIn') ? (
                <p className={styles.footer()}>
                    <button type="button" className={styles.link()} onClick={() => switchTo('signIn')}>
                        {t.back}
                    </button>
                </p>
            ) : null}
            {footer}
        </div>
    );
}
