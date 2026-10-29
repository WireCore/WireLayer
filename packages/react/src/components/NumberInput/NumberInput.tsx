import { useFieldContext } from '@ark-ui/react/field';
import { NumberInput as ArkNumberInput } from '@ark-ui/react/number-input';
import {
    controlIds,
    defaultNumberFormat,
    insertIntoTextControl,
    numberInput as numberInputRecipe,
    numberInputKey,
    parseLocaleNumber,
    setTextControlValue,
    toNumberInputValue,
    type Size,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react';
import { useId, useRef, useState, type ComponentProps } from 'react';
import { useFieldStatus } from '../Field/context.js';
import { InputStatus } from '../Input/InputStatus.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** What an emptied field becomes when it is left: `min` (or 0) or the last valid number */
export type NumberInputEmptyFallback = 'min' | 'previous';

/** `F`: the type of `emptyFallback` (with it onValueChange only gets numbers, never null) */
export interface NumberInputProps<F extends NumberInputEmptyFallback | undefined = undefined> extends Omit<
    ComponentProps<'input'>,
    'value' | 'defaultValue' | 'size' | 'min' | 'max' | 'step' | 'onChange' | 'prefix'
> {
    value?: number | null;
    defaultValue?: number | null;
    onValueChange?: (value: F extends string ? number : number | null) => void;
    min?: number;
    max?: number;
    step?: number;
    /** Display format, e.g. { style: 'currency', currency: 'EUR' } – default: locale format, all decimals */
    formatOptions?: Intl.NumberFormatOptions;
    locale?: string;
    size?: Size;
    invalid?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    /** Shows the − / + buttons (default); arrow keys keep working without them. Holding a button repeats */
    stepper?: boolean;
    /** `inline`: − and + side by side (default); `stacked`: up above down at the end (the field is 48px high) */
    stepperLayout?: 'inline' | 'stacked';
    /** Free text before the number, e.g. "≈" – independent of the number format */
    prefix?: string;
    /** Free text after the number, e.g. "pt" or "pcs" – independent of the number format */
    suffix?: string;
    /** Allows numbers below zero (default); false blocks the minus key and sets the minimum to 0 */
    allowNegative?: boolean;
    /** Allows decimals (default); false blocks the decimal separator and rounds to whole numbers */
    allowDecimal?: boolean;
    /** Exactly this many decimals, e.g. 2 → "12.50" */
    decimals?: number;
    /**
     * Out of min/max: `blur` corrects the value when the field is left (default), `strict` does not let it leave the
     * range, `none` keeps it (mark it invalid yourself)
     */
    clampBehavior?: 'blur' | 'strict' | 'none';
    /**
     * A number is always set: an emptied field falls back to `min` (or 0) or to the last valid number (`previous`)
     * when it is left or Enter is pressed – onValueChange then only gets numbers (typed `number`, not `number | null`)
     */
    emptyFallback?: F;
    /** Selects the whole number when the field gets the focus */
    selectOnFocus?: boolean;
    /** Shows a spinner in the field and marks it busy (aria-busy) */
    loading?: boolean;
    /** Shows a button that empties the field while it has a value */
    clearable?: boolean;
    /** Accessible name of the clear button (default "Clear input") */
    clearLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof numberInputRecipe>;
}

/** Number field with − / + buttons, arrow keys and locale formatting ("1,234.5"); `ref` reaches the native input */
export function NumberInput<F extends NumberInputEmptyFallback | undefined = undefined>({
    classes,
    value,
    defaultValue,
    onValueChange,
    min: minProp,
    max,
    step,
    formatOptions = defaultNumberFormat,
    locale: localeProp,
    size,
    invalid,
    success,
    disabled,
    readOnly,
    required,
    name,
    stepper = true,
    stepperLayout = 'inline',
    prefix,
    suffix,
    allowNegative = true,
    allowDecimal = true,
    decimals,
    clampBehavior = 'blur',
    emptyFallback,
    selectOnFocus = false,
    loading = false,
    clearable = false,
    clearLabel,
    id,
    className,
    style,
    onKeyDown,
    onPaste,
    onFocus,
    ...props
}: NumberInputProps<F>) {
    const numberInput = useRecipe('numberInput', numberInputRecipe, classes);
    const localeContext = useLocale();
    const locale = localeProp ?? localeContext.locale;
    const translations = useTranslations();
    const field = useFieldContext();
    const fieldStatus = useFieldStatus();
    const isInvalid = !!invalid || !!field?.invalid;
    const isSuccess = !isInvalid && (!!success || fieldStatus.success);
    const styles = numberInput({ size, stacked: stepperLayout === 'stacked', success: isSuccess });
    // Fixed decimals or whole numbers on top of the given format
    const format: Intl.NumberFormatOptions =
        decimals !== undefined
            ? { ...formatOptions, minimumFractionDigits: decimals, maximumFractionDigits: decimals }
            : allowDecimal
              ? formatOptions
              : { ...formatOptions, maximumFractionDigits: 0 };
    const min = allowNegative ? minProp : Math.max(minProp ?? 0, 0);
    // The text as typed ("12." while entering 12.5) – formatting the number again would swallow the separator
    const [typed, setTyped] = useState<{ text: string; number: number | null } | null>(null);
    // The last valid number typed – an emptied field with emptyFallback="previous" goes back to it (or to `value`)
    const previous = useRef(defaultValue ?? null);
    const controlled =
        value === undefined
            ? // Uncontrolled with a fallback: the typed text, so the fallback number can be put back
              emptyFallback
                ? typed?.text
                : undefined
            : // With a fallback an emptied field keeps its value until it is left
              typed && (typed.number === value || (!!emptyFallback && typed.number === null))
              ? typed.text
              : toNumberInputValue(value, locale, format);
    const text = controlled ?? typed?.text ?? toNumberInputValue(defaultValue, locale, format) ?? '';

    const prefixId = useId();
    const suffixId = useId();
    const describedBy =
        prefix || suffix
            ? [field?.ariaDescribedby, prefix && prefixId, suffix && suffixId, props['aria-describedby']]
                  .filter(Boolean)
                  .join(' ')
            : undefined;
    const control = useRef<HTMLDivElement>(null);
    const clear = () => {
        const input = control.current?.querySelector('input');
        if (!input) return;
        setTextControlValue(input);
        input.focus();
    };
    const locked = !!disabled || !!readOnly || !!field?.disabled || !!field?.readOnly;

    return (
        <ArkNumberInput.Root
            className={styles.base({ class: className })}
            style={style}
            value={controlled}
            defaultValue={toNumberInputValue(defaultValue, locale, format)}
            {...controlIds(id, 'input', { label: field?.ids.label, input: field?.ids.control })}
            onValueChange={(details) => {
                const number = Number.isNaN(details.valueAsNumber) ? null : details.valueAsNumber;
                setTyped({ text: details.value, number });
                if (number === null && emptyFallback) return;
                if (number !== null) previous.current = number;
                onValueChange?.(number as F extends string ? number : number | null);
            }}
            onValueCommit={(details) => {
                // Leaving the field (or Enter) with an empty text: the fallback number
                if (!emptyFallback || !Number.isNaN(details.valueAsNumber)) return;
                const last = value ?? previous.current;
                const number = emptyFallback === 'previous' && last !== null ? last : (min ?? 0);
                setTyped({ text: toNumberInputValue(number, locale, format) ?? '', number });
                onValueChange?.(number as F extends string ? number : number | null);
            }}
            min={min}
            max={max}
            step={step}
            formatOptions={format}
            locale={locale}
            invalid={invalid}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            name={name}
            clampValueOnBlur={clampBehavior !== 'none'}
            allowOverflow={clampBehavior !== 'strict'}
            translations={translations.numberInput}
        >
            <ArkNumberInput.Control ref={control} className={styles.control()}>
                {prefix && (
                    <span id={prefixId} className={styles.prefix()}>
                        {prefix}
                    </span>
                )}
                <ArkNumberInput.Input
                    {...props}
                    {...(describedBy ? { 'aria-describedby': describedBy } : {})}
                    className={styles.input()}
                    aria-busy={loading || undefined}
                    onKeyDown={(event) => {
                        onKeyDown?.(event);
                        // "." and "," both type the decimal separator of the locale; minus and decimals can be blocked
                        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
                        const input = event.currentTarget;
                        const start = input.selectionStart ?? input.value.length;
                        const rest = input.value.slice(0, start) + input.value.slice(input.selectionEnd ?? start);
                        const action = numberInputKey(event.key, rest, locale, {
                            allowDecimal: allowDecimal && decimals !== 0,
                            allowNegative,
                        });
                        if (!action) return;
                        event.preventDefault();
                        if (action !== 'block') insertIntoTextControl(input, action.insert);
                    }}
                    onPaste={(event) => {
                        onPaste?.(event);
                        // A pasted number replacing the whole text is read in either notation ("1234.5", "1.234,5")
                        const input = event.currentTarget;
                        const whole =
                            (input.selectionStart ?? 0) === 0 && (input.selectionEnd ?? 0) === input.value.length;
                        const number = parseLocaleNumber(event.clipboardData.getData('text'), locale);
                        if (event.defaultPrevented || !whole || number === null) return;
                        event.preventDefault();
                        setTextControlValue(input, toNumberInputValue(number, locale, format));
                    }}
                    onFocus={(event) => {
                        onFocus?.(event);
                        const input = event.currentTarget;
                        // After the click that focused it, which would place the caret again
                        if (selectOnFocus) requestAnimationFrame(() => input.select());
                    }}
                />
                {(loading || clearable || isSuccess) && (
                    <InputStatus
                        loading={loading}
                        clear={clearable && !!text && !locked}
                        clearLabel={clearLabel ?? translations.field.clear}
                        onClear={clear}
                        success={isSuccess}
                        classes={{
                            spinner: styles.spinner(),
                            clear: styles.clear(),
                            clearIcon: styles.clearIcon(),
                            statusIcon: styles.statusIcon(),
                        }}
                    />
                )}
                {suffix && (
                    <span id={suffixId} className={styles.suffix()}>
                        {suffix}
                    </span>
                )}
                {stepper && stepperLayout === 'stacked' ? (
                    <div className={styles.stepper()}>
                        <ArkNumberInput.IncrementTrigger className={styles.button()}>
                            <ChevronUp className={styles.buttonIcon()} aria-hidden="true" />
                        </ArkNumberInput.IncrementTrigger>
                        <ArkNumberInput.DecrementTrigger className={styles.button()}>
                            <ChevronDown className={styles.buttonIcon()} aria-hidden="true" />
                        </ArkNumberInput.DecrementTrigger>
                    </div>
                ) : (
                    stepper && (
                        <>
                            <ArkNumberInput.DecrementTrigger className={styles.button()}>
                                <Minus className={styles.buttonIcon()} aria-hidden="true" />
                            </ArkNumberInput.DecrementTrigger>
                            <ArkNumberInput.IncrementTrigger className={styles.button()}>
                                <Plus className={styles.buttonIcon()} aria-hidden="true" />
                            </ArkNumberInput.IncrementTrigger>
                        </>
                    )
                )}
            </ArkNumberInput.Control>
        </ArkNumberInput.Root>
    );
}
