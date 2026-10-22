import { defaultLocale, translations as defaultTranslations, type Translations } from './i18n.js';

// Field validators with translated messages. Each one is a function (value → message or undefined) and a Standard
// Schema at the same time, so TanStack Form takes it directly: `validators: { onChange: isEmail() }`. All except
// isRequired accept an empty value – combine them with isRequired for mandatory fields.

/** Standard Schema v1 (https://standardschema.dev) – the parts TanStack Form and others read */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
    readonly '~standard': {
        readonly version: 1;
        readonly vendor: string;
        readonly validate: (
            value: unknown
        ) => { value: Output; issues?: undefined } | { issues: readonly { message: string }[] };
    };
}

/** A validator: call it with a value for the message (or undefined), or hand it to TanStack Form as a schema */
export type Validator<T = unknown> = ((value: T) => string | undefined) & StandardSchemaV1<T>;

export type ValidationTexts = Translations['validation'];

export interface ValidatorOptions {
    /** Own message instead of the translated one */
    message?: string;
    /** Texts of another language, e.g. `messages.en.validation` (useValidators passes the LocaleProvider's) */
    texts?: ValidationTexts;
}

/** Makes a validator from a check that returns the message or undefined */
export function createValidator<T = unknown>(check: (value: T) => string | undefined): Validator<T> {
    const validator = ((value: T) => check(value)) as Validator<T>;
    Object.defineProperty(validator, '~standard', {
        value: {
            version: 1,
            vendor: 'wirecore',
            validate: (value: unknown) => {
                const message = check(value as T);
                return message ? { issues: [{ message }] } : { value: value as T };
            },
        },
    });
    return validator;
}

/** The first message of several validators (in order) */
export function combineValidators<T>(...validators: ((value: T) => string | undefined)[]): Validator<T> {
    return createValidator<T>((value) => {
        for (const validator of validators) {
            const message = validator(value);
            if (message) return message;
        }
        return undefined;
    });
}

/** Empty: undefined, null, "", only spaces, [] */
export const isEmptyValue = (value: unknown) =>
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0);

const textsOf = (options?: ValidatorOptions) => options?.texts ?? defaultTranslations.validation;

/** A value is required (false counts as missing for checkboxes that must be ticked) */
export function isRequired<T = unknown>(options?: ValidatorOptions): Validator<T> {
    return createValidator<T>((value) =>
        isEmptyValue(value) || value === false ? (options?.message ?? textsOf(options).required) : undefined
    );
}

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** An e-mail address (name@domain.tld) */
export function isEmail(options?: ValidatorOptions): Validator<string | null | undefined> {
    return createValidator((value) =>
        isEmptyValue(value) || EMAIL.test(String(value).trim())
            ? undefined
            : (options?.message ?? textsOf(options).email)
    );
}

/** A web address; `protocols` default http and https */
export function isUrl(options?: ValidatorOptions & { protocols?: string[] }): Validator<string | null | undefined> {
    const protocols = options?.protocols ?? ['http', 'https'];
    return createValidator((value) => {
        if (isEmptyValue(value)) return undefined;
        try {
            const url = new URL(String(value).trim());
            if (protocols.includes(url.protocol.replace(/:$/, '')) && url.hostname) return undefined;
        } catch {
            // not a URL
        }
        return options?.message ?? textsOf(options).url;
    });
}

/** Length of a text (or list) between min and max characters/entries */
export function hasLength(
    limits: { min?: number; max?: number },
    options?: ValidatorOptions
): Validator<string | readonly unknown[] | null | undefined> {
    return createValidator((value) => {
        if (isEmptyValue(value)) return undefined;
        const length = typeof value === 'string' ? [...value].length : (value as readonly unknown[]).length;
        const texts = textsOf(options);
        const { min, max } = limits;
        if ((min !== undefined && length < min) || (max !== undefined && length > max)) {
            if (options?.message) return options.message;
            if (min !== undefined && max !== undefined) return texts.length(min, max);
            return min !== undefined ? texts.minLength(min) : texts.maxLength(max!);
        }
        return undefined;
    });
}

/** A number between min and max (inclusive); texts are read as numbers */
export function isInRange(
    limits: { min?: number; max?: number },
    options?: ValidatorOptions & { locale?: string }
): Validator<number | string | null | undefined> {
    return createValidator((value) => {
        if (isEmptyValue(value)) return undefined;
        const number = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
        const texts = textsOf(options);
        const format = (limit: number) => new Intl.NumberFormat(options?.locale ?? defaultLocale).format(limit);
        if (Number.isNaN(number)) return options?.message ?? texts.number;
        const { min, max } = limits;
        if ((min !== undefined && number < min) || (max !== undefined && number > max)) {
            if (options?.message) return options.message;
            if (min !== undefined && max !== undefined) return texts.range(format(min), format(max));
            return min !== undefined ? texts.min(format(min)) : texts.max(format(max!));
        }
        return undefined;
    });
}

/** A whole number */
export function isInteger(options?: ValidatorOptions): Validator<number | string | null | undefined> {
    return createValidator((value) =>
        isEmptyValue(value) || /^-?\d+$/.test(String(value).trim())
            ? undefined
            : (options?.message ?? textsOf(options).integer)
    );
}

/** Text matches a regular expression; `message` says what is expected */
export function matchesPattern(pattern: RegExp, options?: ValidatorOptions): Validator<string | null | undefined> {
    return createValidator((value) =>
        isEmptyValue(value) || pattern.test(String(value)) ? undefined : (options?.message ?? textsOf(options).pattern)
    );
}

/**
 * Equals another field, e.g. password repetition: `matchesField(() => form.getFieldValue('password'))` (and
 * `onChangeListenTo: ['password']` so it re-checks when the other field changes)
 */
export function matchesField<T>(other: () => T, options?: ValidatorOptions): Validator<T> {
    return createValidator<T>((value) =>
        isEmptyValue(value) || value === other() ? undefined : (options?.message ?? textsOf(options).matches)
    );
}

/** IBAN with its check digits (ISO 13616, mod 97) – spaces are allowed */
export function isIbanValue(value: string): boolean {
    const iban = value.replace(/\s+/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let remainder = 0;
    for (const char of rearranged) {
        const digits = /\d/.test(char) ? char : String(char.charCodeAt(0) - 55);
        for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
    }
    return remainder === 1;
}

/** An IBAN (check digits are checked) */
export function isIban(options?: ValidatorOptions): Validator<string | null | undefined> {
    return createValidator((value) =>
        isEmptyValue(value) || isIbanValue(String(value)) ? undefined : (options?.message ?? textsOf(options).iban)
    );
}

/**
 * A phone number: digits with optional +, spaces, brackets, dashes and slashes – 6 to 15 digits (E.164 allows at most
 * 15)
 */
export function isPhone(options?: ValidatorOptions): Validator<string | null | undefined> {
    return createValidator((value) => {
        if (isEmptyValue(value)) return undefined;
        const text = String(value).trim();
        const digits = text.replace(/\D/g, '').length;
        return /^\+?[\d\s()/.-]+$/.test(text) && digits >= 6 && digits <= 15
            ? undefined
            : (options?.message ?? textsOf(options).phone);
    });
}

/** All validators with the texts of one language – what useValidators returns */
export function createValidators(texts: ValidationTexts = defaultTranslations.validation, locale = defaultLocale) {
    const withTexts = <O extends ValidatorOptions>(options?: O) => ({ texts, ...options }) as O;
    return {
        isRequired: <T = unknown>(options?: ValidatorOptions) => isRequired<T>(withTexts(options)),
        isEmail: (options?: ValidatorOptions) => isEmail(withTexts(options)),
        isUrl: (options?: ValidatorOptions & { protocols?: string[] }) => isUrl(withTexts(options)),
        hasLength: (limits: { min?: number; max?: number }, options?: ValidatorOptions) =>
            hasLength(limits, withTexts(options)),
        isInRange: (limits: { min?: number; max?: number }, options?: ValidatorOptions & { locale?: string }) =>
            isInRange(limits, withTexts({ locale, ...options })),
        isInteger: (options?: ValidatorOptions) => isInteger(withTexts(options)),
        matchesPattern: (pattern: RegExp, options?: ValidatorOptions) => matchesPattern(pattern, withTexts(options)),
        matchesField: <T>(other: () => T, options?: ValidatorOptions) => matchesField(other, withTexts(options)),
        isIban: (options?: ValidatorOptions) => isIban(withTexts(options)),
        isPhone: (options?: ValidatorOptions) => isPhone(withTexts(options)),
        combine: combineValidators,
    };
}

export type Validators = ReturnType<typeof createValidators>;
