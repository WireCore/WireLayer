import { useFieldContext } from '@ark-ui/react/field';
import { PasswordInput as ArkPasswordInput } from '@ark-ui/react/password-input';
import {
    controlIds,
    checkPasswordRequirements,
    passwordInput as passwordInputRecipe,
    passwordStrength,
    setTextControlValue,
    type PasswordRequirement,
    type Size,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Check, Circle, Eye, EyeOff } from 'lucide-react';
import { useId, useRef, useState, type ComponentProps } from 'react';
import { useFieldStatus } from '../Field/context.js';
import { InputStatus } from '../Input/InputStatus.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface PasswordInputProps extends Omit<ComponentProps<'input'>, 'size' | 'type'> {
    size?: Size;
    invalid?: boolean;
    /** Confirmed value: green border and check icon (also inherited from a Field with `success`) */
    success?: boolean;
    /** Initially show the password in plain text */
    defaultVisible?: boolean;
    /** Whether the password is shown in plain text (controlled, with onVisibleChange) */
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
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
    /** Monospace font of the theme (JetBrains Mono) – for tokens, passphrases and keys */
    mono?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof passwordInputRecipe>;
}

/**
 * Password field with a button that shows/hides the password (named "Show/Hide password"); `ref` reaches the native
 * input
 */
export function PasswordInput({
    classes,
    size,
    invalid,
    success,
    disabled,
    readOnly,
    required,
    name,
    defaultVisible,
    visible,
    onVisibleChange,
    autoComplete = 'current-password',
    strength = false,
    requirements,
    loading = false,
    clearable = false,
    clearLabel,
    mono = false,
    id,
    className,
    style,
    ...props
}: PasswordInputProps) {
    const passwordInput = useRecipe('passwordInput', passwordInputRecipe, classes);
    const translations = useTranslations();
    const field = useFieldContext();
    const fieldStatus = useFieldStatus();
    const isInvalid = !!invalid || !!field?.invalid;
    const isSuccess = !isInvalid && (!!success || fieldStatus.success);
    const styles = passwordInput({ size, success: isSuccess, mono });

    // Strength: 4 bars and a word, announced politely and linked to the input
    const uid = useId();
    const [typed, setTyped] = useState(String(props.defaultValue ?? ''));
    const text = props.value === undefined ? typed : String(props.value);
    const level = passwordStrength(text);
    const levelText = text ? translations.passwordStrength.levels[level] : '';
    const met = checkPasswordRequirements(text, requirements ?? []);
    const describedBy =
        strength || requirements?.length
            ? [field?.ariaDescribedby, strength && `${uid}strength`, requirements?.length && `${uid}requirements`]
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

    return (
        <ArkPasswordInput.Root
            className={styles.base({ class: className })}
            style={style}
            invalid={invalid}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            name={name}
            defaultVisible={defaultVisible}
            visible={visible}
            onVisibilityChange={(details) => onVisibleChange?.(details.visible)}
            // Also `off` or `one-time-code` (secrets the browser should not save): Ark only types the password values
            autoComplete={autoComplete as 'current-password' | 'new-password'}
            translations={translations.passwordInput}
            {...controlIds(id, 'input', { input: field?.ids.control })}
        >
            <ArkPasswordInput.Control ref={control} className={styles.control()}>
                <ArkPasswordInput.Input
                    {...props}
                    aria-describedby={describedBy}
                    aria-busy={loading || undefined}
                    className={styles.input()}
                    onChange={(event) => {
                        setTyped(event.target.value);
                        props.onChange?.(event);
                    }}
                />
                {(loading || clearable || isSuccess) && (
                    <InputStatus
                        loading={loading}
                        clear={clearable && !!text && !(disabled || field?.disabled) && !(readOnly || field?.readOnly)}
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
                <ArkPasswordInput.VisibilityTrigger className={styles.toggle()}>
                    <ArkPasswordInput.Indicator fallback={<Eye className={styles.toggleIcon()} aria-hidden="true" />}>
                        <EyeOff className={styles.toggleIcon()} aria-hidden="true" />
                    </ArkPasswordInput.Indicator>
                </ArkPasswordInput.VisibilityTrigger>
            </ArkPasswordInput.Control>
            {strength && (
                <div className={styles.strength()}>
                    <div className={styles.meter()} aria-hidden="true">
                        {[1, 2, 3, 4].map((bar) => (
                            <span
                                key={bar}
                                className={styles.bar()}
                                data-level={level}
                                data-filled={bar <= level || undefined}
                            />
                        ))}
                    </div>
                    <span id={`${uid}strength`} className={styles.strengthText()} aria-live="polite">
                        {levelText && translations.passwordStrength.label(levelText)}
                    </span>
                </div>
            )}
            {!!requirements?.length && (
                <ul
                    id={`${uid}requirements`}
                    className={styles.requirements()}
                    aria-label={translations.passwordRequirements.label}
                >
                    {requirements.map((requirement, index) => (
                        <li key={requirement.label} className={styles.requirement()} data-met={met[index] || undefined}>
                            {met[index] ? (
                                <Check className={styles.requirementIcon()} aria-hidden="true" />
                            ) : (
                                <Circle className={styles.requirementIcon()} aria-hidden="true" />
                            )}
                            {requirement.label}
                            <span className={styles.requirementState()}>
                                {`: ${met[index] ? translations.passwordRequirements.met : translations.passwordRequirements.unmet}`}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </ArkPasswordInput.Root>
    );
}
