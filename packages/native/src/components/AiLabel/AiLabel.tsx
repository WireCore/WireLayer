import { aiLabel } from '@wirecore/wirelayer-recipes/native';
import { Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { Toggletip } from '../Toggletip/Toggletip.js';

export interface AiLabelProps extends ViewProps {
    /** Text of the label (default "AI-generated") */
    label?: string;
    /** Text behind the (i) button; `false` hides the button */
    explanation?: ReactNode | false;
    size?: 'sm' | 'md';
    className?: string;
    /** Content of the explanation instead of `explanation` */
    children?: ReactNode;
}

/** Marks content made by AI, with an explanation behind an info button */
export function AiLabel({ label, explanation, size, className, children, ...props }: AiLabelProps) {
    const translations = useTranslations();
    const styles = aiLabel({ size });
    const text = children ?? (explanation === false ? undefined : (explanation ?? translations.aiLabel.explanation));
    return (
        <View {...props} className={styles.base({ class: className })}>
            <View className={styles.chip()}>
                <Icon icon={Sparkles} className={styles.icon()} />
                <Text className={styles.label()}>{label ?? translations.aiLabel.label}</Text>
            </View>
            {explanation !== false && !!text && <Toggletip triggerLabel={translations.aiLabel.help} content={text} />}
        </View>
    );
}
