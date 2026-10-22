import { tv } from './tv.js';
import { combineValidators, hasLength, isEmail, isRequired, type ValidationTexts } from './validators.js';

// Page blocks (@wirecore/wirelayer-blocks-vue / @wirecore/wirelayer-blocks-react).

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

export const siteHeader = tv({
    slots: {
        base: 'relative border-b border-line bg-bg text-fg',
        bar: 'mx-auto flex h-[60px] max-w-7xl items-center gap-5 px-[18px]',
        brand: ['flex shrink-0 items-center gap-2.5 rounded-sm text-[17px] font-bold tracking-[-0.03em]', focusRing],
        logo: 'flex h-6 shrink-0 items-center [&>*]:h-full [&>*]:w-auto',
        nav: 'mx-auto hidden items-center gap-0.5 md:flex',
        link: [
            'rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted transition-colors motion-reduce:transition-none',
            'hover:text-fg aria-[current=page]:bg-line aria-[current=page]:text-fg',
            focusRing,
        ],
        actions: 'ms-auto hidden shrink-0 items-center gap-2 md:ms-0 md:flex',
        toggle: 'ms-auto md:hidden',
        panel: [
            'border-t border-line px-[18px] py-3 md:hidden',
            'motion-safe:data-[state=open]:animate-fade-in motion-safe:data-[state=closed]:animate-fade-out',
        ],
        panelNav: 'flex flex-col gap-1',
        panelLink: [
            'flex h-10 items-center rounded-lg px-3 text-[15px] font-medium text-muted transition-colors motion-reduce:transition-none',
            'hover:bg-line hover:text-fg aria-[current=page]:bg-line aria-[current=page]:text-fg',
            focusRing,
        ],
        panelActions: 'mt-3 flex flex-wrap gap-2 border-t border-line pt-3',
    },
});

export const ctaSection = tv({
    slots: {
        base: 'relative flex flex-col items-start gap-3.5 overflow-hidden rounded-panel bg-fg px-[26px] py-[30px] text-bg forced-colors:border',
        image: 'pointer-events-none absolute top-1/2 -inset-e-[8%] h-[160%] w-auto -translate-y-1/2 -rotate-8 opacity-[0.06]',
        title: 'relative max-w-[340px] text-[26px] leading-[1.02] font-semibold tracking-[-0.045em]',
        description: 'relative max-w-[420px] text-sm leading-[1.55] text-bg/65',
        actions: 'relative flex flex-wrap gap-2',
    },
});

/** Sign-in, registration and password reset: one form that switches between the modes */
export const authForm = tv({
    slots: {
        base: 'flex w-full max-w-sm flex-col gap-5',
        header: 'flex flex-col gap-1.5',
        title: 'm-0 text-2xl font-semibold tracking-[-0.03em] text-fg',
        description: 'm-0 text-sm text-muted',
        providers: 'flex flex-col gap-2',
        divider: [
            'flex items-center gap-3 text-xs text-muted uppercase',
            'before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line',
        ],
        form: 'flex flex-col gap-4',
        row: 'flex flex-wrap items-center justify-between gap-2',
        link: [
            'cursor-pointer rounded-sm text-sm font-medium text-fg underline underline-offset-2 hover:text-muted',
            focusRing,
        ],
        footer: 'm-0 text-center text-sm text-muted',
        status: 'm-0 text-sm text-fg',
    },
});

/** Two columns: the form on one side, an image or teaser on the other (stacked on small screens) */
export const authLayout = tv({
    slots: {
        base: 'grid min-h-dvh w-full bg-bg text-fg lg:grid-cols-2',
        main: 'flex flex-col justify-center gap-8 px-6 py-10 sm:px-12',
        brand: 'flex items-center gap-2.5 text-[17px] font-bold tracking-[-0.03em]',
        content: 'mx-auto flex w-full max-w-sm flex-col',
        aside: 'relative hidden overflow-hidden bg-fg text-bg lg:flex lg:flex-col lg:justify-end lg:p-12 forced-colors:border-s',
        image: 'absolute inset-0 size-full object-cover',
        /** Keeps the teaser readable over the image */
        scrim: 'absolute inset-0 bg-linear-to-t from-fg from-25% via-fg/80 to-fg/10',
        teaser: 'relative flex max-w-md flex-col gap-3',
        footer: 'mx-auto w-full max-w-sm text-xs text-muted',
    },
    variants: {
        /** Which side the form is on */
        side: {
            start: {},
            end: { main: 'lg:order-2' },
        },
    },
    defaultVariants: {
        side: 'start',
    },
});

/** Modes of the AuthForm: sign in, sign up, reset the password, enter a one-time code */
export type AuthMode = 'signIn' | 'signUp' | 'reset' | 'code';
export type AuthField = 'name' | 'email' | 'password' | 'code';

export interface AuthValues {
    name: string;
    email: string;
    password: string;
    code: string;
    remember: boolean;
}

/** Fields of a mode, in order */
export function authFields(mode: AuthMode): AuthField[] {
    return { signIn: ['email', 'password'], signUp: ['name', 'email', 'password'], reset: ['email'], code: ['code'] }[
        mode
    ] as AuthField[];
}

export interface AuthValidationOptions {
    /** Messages of another language (default German) */
    texts?: ValidationTexts;
    /** Minimum length of a new password (sign up, default 8) */
    passwordMinLength?: number;
    /** Digits of the one-time code (default 6) */
    codeLength?: number;
    /** Own checks per field (e.g. the validators of /form) – run after the built-in ones */
    validators?: Partial<Record<AuthField, (value: string) => string | undefined>>;
}

/** Errors of the fields of a mode: required, e-mail format, password length (sign up), complete code */
export function validateAuth(
    mode: AuthMode,
    values: AuthValues,
    options: AuthValidationOptions = {}
): Partial<Record<AuthField, string>> {
    const texts = options.texts;
    const required = isRequired<string>({ texts });
    const checks: Record<AuthField, (value: string) => string | undefined> = {
        name: required,
        email: combineValidators(required, isEmail({ texts })),
        password:
            mode === 'signUp'
                ? combineValidators(required, hasLength({ min: options.passwordMinLength ?? 8 }, { texts }))
                : required,
        code: combineValidators(
            required,
            hasLength({ min: options.codeLength ?? 6, max: options.codeLength ?? 6 }, { texts })
        ),
    };
    const errors: Partial<Record<AuthField, string>> = {};
    for (const field of authFields(mode)) {
        const message = checks[field](values[field]) ?? options.validators?.[field]?.(values[field]);
        if (message) errors[field] = message;
    }
    return errors;
}
