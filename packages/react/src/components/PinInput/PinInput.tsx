import { useFieldContext } from '@ark-ui/react/field';
import { PinInput as ArkPinInput } from '@ark-ui/react/pin-input';
import { pinInput as pinInputRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { CSSProperties } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface PinInputProps {
    /** Number of characters */
    length?: number;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** All characters entered */
    onValueComplete?: (value: string) => void;
    type?: 'numeric' | 'alphanumeric' | 'alphabetic';
    /** One-time code: the browser/phone may fill it in from an SMS */
    otp?: boolean;
    /** Show dots instead of the characters */
    mask?: boolean;
    placeholder?: string;
    invalid?: boolean;
    disabled?: boolean;
    name?: string;
    /** Accessible name of the group without a surrounding Field */
    'aria-label'?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof pinInputRecipe>;
}

const toArray = (value: string | undefined) => (value === undefined ? undefined : value.split(''));

/** Code input (OTP, PIN): one box per character, typing moves on, pasting fills all boxes */
export function PinInput({
    classes,
    length = 6,
    value,
    defaultValue,
    onValueChange,
    onValueComplete,
    type = 'numeric',
    otp = true,
    mask,
    placeholder = '',
    invalid,
    disabled,
    name,
    'aria-label': ariaLabel,
    className,
    style,
}: PinInputProps) {
    const pinInput = useRecipe('pinInput', pinInputRecipe, classes);
    const styles = pinInput();
    const translations = useTranslations();
    const field = useFieldContext();

    return (
        <ArkPinInput.Root
            className={styles.base({ class: className })}
            style={style}
            count={length}
            value={toArray(value)}
            defaultValue={toArray(defaultValue)}
            onValueChange={(details) => {
                onValueChange?.(details.valueAsString);
                // Ark's own completion event does not fire when controlled
                if (details.value.length === length && details.value.every(Boolean)) {
                    onValueComplete?.(details.valueAsString);
                }
            }}
            type={type}
            otp={otp}
            mask={mask}
            placeholder={placeholder}
            invalid={invalid}
            disabled={disabled}
            name={name}
            translations={translations.pinInput}
        >
            {/* One named group around the boxes – each box is "Digit 2 of 6" */}
            <ArkPinInput.Control
                className={styles.control()}
                role="group"
                aria-labelledby={field?.ids.label}
                aria-label={field ? undefined : ariaLabel}
                aria-describedby={field?.ariaDescribedby}
            >
                {Array.from({ length }, (_, index) => (
                    <ArkPinInput.Input key={index} index={index} className={styles.input()} />
                ))}
            </ArkPinInput.Control>
            <ArkPinInput.HiddenInput />
        </ArkPinInput.Root>
    );
}
