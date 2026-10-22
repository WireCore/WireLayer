import {
    checkPasswordRequirements,
    input,
    passwordInput,
    passwordStrength,
    type PasswordRequirement,
} from '@wirecore/wirelayer-recipes/native';
import { Check, Circle, Eye, EyeOff } from 'lucide-react-native';
import { useId, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { TextField, type TextFieldProps } from '../../utils/TextField.js';
import { useControllable } from '../../utils/useControllable.js';

export interface PasswordInputProps extends Omit<
    TextFieldProps,
    'secureTextEntry' | 'leadingIcon' | 'prefix' | 'suffix'
> {
    /** Whether the password is shown in plain text (controlled, with onVisibleChange) */
    visible?: boolean;
    /** Initially show the password in plain text */
    defaultVisible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    /** Strength meter below the field – for choosing a new password */
    strength?: boolean;
    /** Checklist below the field, updated while typing: each rule with its state (icon and text) */
    requirements?: PasswordRequirement[];
}

const levels = ['weak', 'weak', 'fair', 'good', 'strong'] as const;

/**
 * Password field with a button that shows/hides the password ("Show/Hide password"); optional strength
 * meter and requirement checklist. New passwords: pass `autoComplete="new-password"` (and `textContentType="newPassword"` on iOS).
 */
export function PasswordInput({
    visible,
    defaultVisible = false,
    onVisibleChange,
    strength = false,
    requirements,
    onChangeText,
    accessibilityHint,
    ...props
}: PasswordInputProps) {
    const translations = useTranslations();
    const [shown, setShown] = useControllable(visible, defaultVisible, onVisibleChange);
    const [typed, setTyped] = useState(props.defaultValue ?? '');
    const text = props.value ?? typed;
    const id = useId();
    const styles = passwordInput();
    const field = input({ size: props.size });
    const level = passwordStrength(text);
    const met = requirements ? checkPasswordRequirements(text, requirements) : [];
    const t = translations.passwordStrength;
    const strengthText = text ? t.levels[level] : '';
    // Screen readers: the strength and the unmet rules follow the field's own description
    const hint = [
        accessibilityHint,
        strength && strengthText ? t.label(strengthText) : '',
        ...(requirements ?? []).map(
            (rule, index) =>
                `${rule.label}: ${met[index] ? translations.passwordRequirements.met : translations.passwordRequirements.unmet}`
        ),
    ]
        .filter(Boolean)
        .join('. ');

    return (
        <View className={styles.base()}>
            <TextField
                autoCapitalize="none"
                autoCorrect={false}
                {...props}
                accessibilityHint={hint || undefined}
                secureTextEntry={!shown}
                onChangeText={(next) => {
                    setTyped(next);
                    onChangeText?.(next);
                }}
                end={
                    <Pressable
                        role="button"
                        aria-label={translations.passwordInput.visibilityTrigger(shown)}
                        className={field.action()}
                        onPress={() => setShown(!shown)}
                    >
                        <Icon icon={shown ? EyeOff : Eye} className={field.actionIcon()} />
                    </Pressable>
                }
            />
            {strength && (
                <View className={styles.strength()} nativeID={`${id}strength`}>
                    <View className={styles.meter()} aria-hidden>
                        {[1, 2, 3, 4].map((bar) => (
                            <View
                                key={bar}
                                className={passwordInput({
                                    level: levels[level],
                                    empty: !text || bar > Math.max(level, 1),
                                }).bar()}
                            />
                        ))}
                    </View>
                    <Text className={styles.strengthText()} role="status" aria-live="polite">
                        {strengthText ? t.label(strengthText) : ''}
                    </Text>
                </View>
            )}
            {requirements && requirements.length > 0 && (
                <View
                    className={styles.requirements()}
                    aria-label={translations.passwordRequirements.label}
                    role="list"
                >
                    {requirements.map((rule, index) => {
                        const look = passwordInput({ met: met[index] });
                        const state = met[index]
                            ? translations.passwordRequirements.met
                            : translations.passwordRequirements.unmet;
                        const web = Platform.OS === 'web';
                        // The state is in the name (iOS/Android) or a hidden text (web) – the icon shows it visually
                        return (
                            <View
                                key={rule.label}
                                role="listitem"
                                accessibilityLabel={web ? undefined : `${rule.label}, ${state}`}
                                className={look.requirement()}
                            >
                                <Icon icon={met[index] ? Check : Circle} className={look.requirementIcon()} />
                                <Text className={look.requirementText()}>
                                    {rule.label}
                                    {web && <Text className={look.requirementState()}>{`, ${state}`}</Text>}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}
