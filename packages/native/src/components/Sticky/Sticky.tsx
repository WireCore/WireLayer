import { sticky } from '@wirecore/wirelayer-recipes/native';
import { View, type ViewProps } from 'react-native';

export interface StickyProps extends ViewProps {
    /** Edge it belongs to (default top) */
    edge?: 'top' | 'bottom';
    /** Look of an action bar: background, padding, buttons at the end */
    bar?: boolean;
    className?: string;
}

/**
 * Stays in view while the content scrolls: place it before (top) or after (bottom) the ScrollView – e.g. the
 * buttons of a long form. React Native has no `position: sticky`; inside a ScrollView use `stickyHeaderIndices`.
 */
export function Sticky({ edge, bar, className, ...props }: StickyProps) {
    return <View {...props} className={sticky({ edge, bar, class: className })} />;
}
