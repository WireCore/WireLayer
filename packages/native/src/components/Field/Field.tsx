import { field } from '@wirecore/wirelayer-recipes/native';
import { CircleCheck, Info } from 'lucide-react-native';
import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';

export interface FieldProps extends ViewProps {
    /** Id of the control (its nativeID) – e.g. the field name, so FormErrorSummary can move the focus to it */
    id?: string;
    label?: string;
    helperText?: string;
    /** Error message – also marks the field as invalid */
    error?: string;
    invalid?: boolean;
    /** Confirmation, e.g. "Username is available": shown with a check icon and read as the description; the control gets a green border */
    success?: string;
    required?: boolean;
    /** Marks the field as optional: "(optional)" after the label */
    optional?: boolean;
    /** Text after the label of an optional field (default "optional") */
    optionalText?: string;
    /** Explanation behind an (i) button next to the label – a tap shows it and screen readers read it */
    labelHelp?: string;
    disabled?: boolean;
    children?: ReactNode;
}

interface FieldContextValue {
    /** Id of the control (Field `id`) */
    controlId?: string;
    labelId: string;
    descriptionId: string;
    label?: string;
    /** Helper, success or error text – read after the label (accessibilityHint on iOS/Android, aria-describedby on the web) */
    description?: string;
    invalid: boolean;
    success: boolean;
    required: boolean;
    disabled: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Props a control inside a Field spreads onto its TextInput/Pressable */
export function useFieldControl({
    invalid,
    disabled,
    success,
}: {
    invalid?: boolean;
    disabled?: boolean;
    success?: boolean;
}) {
    const context = useContext(FieldContext);
    const isInvalid = invalid ?? context?.invalid ?? false;
    const isDisabled = disabled ?? context?.disabled ?? false;
    const props = context
        ? {
              'aria-label': context.label,
              'aria-labelledby': context.labelId,
              accessibilityHint: context.description,
              // Web only (react-native-web), not part of the RN types
              ...({
                  'aria-describedby': context.description ? context.descriptionId : undefined,
                  'aria-invalid': isInvalid || undefined,
                  'aria-required': context.required || undefined,
              } as object),
          }
        : {};
    return {
        invalid: isInvalid,
        disabled: isDisabled,
        /** Confirmed value (green border, check icon) – not while invalid */
        success: !isInvalid && (success ?? context?.success ?? false),
        label: context?.label,
        description: context?.description,
        required: context?.required ?? false,
        /** Field `id`: the control's nativeID, registered for FormErrorSummary (useFocusTarget) */
        controlId: context?.controlId,
        props,
    };
}

/** The `id` of the surrounding Field (controls that do not take its label, e.g. Checkbox, set it as nativeID) */
export const useFieldId = () => useContext(FieldContext)?.controlId;

/** Label, helper text, success or error for one control – passes name, description and state to the control inside */
export function Field({
    id: controlId,
    label,
    helperText,
    error,
    invalid = false,
    success,
    required = false,
    optional = false,
    optionalText,
    labelHelp,
    disabled = false,
    className,
    children,
    ...props
}: FieldProps) {
    const id = useId();
    const translations = useTranslations();
    const styles = field({ disabled });
    const [helpOpen, setHelpOpen] = useState(false);
    const { announce, region } = useAnnouncer();
    const context: FieldContextValue = {
        controlId,
        labelId: `${id}label`,
        descriptionId: `${id}description`,
        label,
        description: error ?? success ?? helperText,
        invalid: invalid || !!error,
        success: !!success,
        required,
        disabled,
    };
    const labelText = label && (
        <Text nativeID={context.labelId} className={styles.label()}>
            {label}
            {required && (
                <Text className={styles.requiredIndicator()} aria-hidden>
                    {' *'}
                </Text>
            )}
            {optional && !required && (
                <Text className={styles.optionalText()}>{` (${optionalText ?? translations.field.optional})`}</Text>
            )}
        </Text>
    );

    return (
        <FieldContext.Provider value={context}>
            <View {...props} className={styles.base({ class: className })}>
                {labelHelp ? (
                    <View className={styles.labelRow()}>
                        {labelText}
                        <Pressable
                            role="button"
                            aria-label={label ? translations.toggletip.labelFor(label) : translations.toggletip.label}
                            aria-expanded={helpOpen}
                            className={styles.help()}
                            onPress={() => {
                                if (!helpOpen) announce(labelHelp);
                                setHelpOpen(!helpOpen);
                            }}
                        >
                            <Icon icon={Info} className={styles.helpIcon()} />
                        </Pressable>
                    </View>
                ) : (
                    labelText
                )}
                {labelHelp && helpOpen && <Text className={styles.helpText()}>{labelHelp}</Text>}
                {children}
                {error ? (
                    <Text nativeID={context.descriptionId} className={styles.errorText()} role="alert">
                        {error}
                    </Text>
                ) : success ? (
                    <View className={styles.successRow()}>
                        <Icon icon={CircleCheck} className={styles.successIcon()} />
                        <Text nativeID={context.descriptionId} className={styles.successText()} role="status">
                            {success}
                        </Text>
                    </View>
                ) : (
                    helperText && (
                        <Text nativeID={context.descriptionId} className={styles.helperText()}>
                            {helperText}
                        </Text>
                    )
                )}
                {region}
            </View>
        </FieldContext.Provider>
    );
}
