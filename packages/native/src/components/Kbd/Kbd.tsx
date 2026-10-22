import { formatHotkey, kbd } from '@wirecore/wirelayer-recipes/native';
import { Fragment, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';

export interface KbdProps {
    /** The key (without `hotkey`) */
    children?: ReactNode;
    /** A whole shortcut, shown key by key ("mod+k", "g i") – Apple devices show ⌘ ⌥ ⇧ */
    hotkey?: string;
}

/** A key or shortcut, e.g. in help texts for hardware keyboards (iPad, Android tablets, the web) */
export function Kbd({ children, hotkey }: KbdProps) {
    const translations = useTranslations();
    const styles = kbd();
    const keyView = (label: ReactNode, key: string | number) => (
        <View key={key} className={styles.key()}>
            <Text className={styles.keyLabel()}>{label}</Text>
        </View>
    );
    if (!hotkey) return <View className={styles.group()}>{keyView(children, 0)}</View>;
    const apple = Platform.OS === 'ios' || Platform.OS === 'macos';
    const steps = formatHotkey(hotkey, translations.hotkeys.keys, apple);
    return (
        <View className={styles.group()}>
            {steps.map((keys, step) => (
                <Fragment key={step}>
                    {step > 0 && <Text className={styles.then()}> {translations.hotkeys.then} </Text>}
                    {keys.map((key, index) => keyView(key, `${step}-${index}`))}
                </Fragment>
            ))}
        </View>
    );
}
