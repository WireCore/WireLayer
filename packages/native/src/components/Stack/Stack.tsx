import { stack, type LayoutGap } from '@wirecore/wirelayer-recipes/native';
import { View, type ViewProps } from 'react-native';

export interface StackProps extends ViewProps {
    /** Space between the children (default md, 16) */
    gap?: LayoutGap;
    /** Cross-axis alignment (default stretch) */
    align?: 'stretch' | 'start' | 'center' | 'end';
    className?: string;
}

/** Children below each other with even spacing */
export function Stack({ gap, align, className, ...props }: StackProps) {
    return <View {...props} className={stack({ gap, align, class: className })} />;
}
