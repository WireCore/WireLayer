import { text, type VariantProps } from '@wirecore/wirelayer-recipes/native';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

export interface TextProps extends RNTextProps {
    variant?: VariantProps<typeof text>['variant'];
}

/** Text in the WireLayer fonts and colours – React Native's own Text would use the system font. */
export function Text({ variant, className, ...props }: TextProps) {
    return <RNText {...props} className={text({ variant, class: className })} />;
}
