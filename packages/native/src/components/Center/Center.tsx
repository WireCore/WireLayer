import { center } from '@wirecore/wirelayer-recipes/native';
import { View, type ViewProps } from 'react-native';

export interface CenterProps extends ViewProps {
    /** Only as wide as the content (inline) instead of the full width */
    inline?: boolean;
    className?: string;
}

/** Centres its content horizontally and vertically */
export function Center({ inline, className, ...props }: CenterProps) {
    return <View {...props} className={center({ inline, class: className })} />;
}
