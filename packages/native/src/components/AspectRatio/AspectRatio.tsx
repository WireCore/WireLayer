import { aspectRatio } from '@wirecore/wirelayer-recipes/native';
import { View, type ViewProps } from 'react-native';

export interface AspectRatioProps extends ViewProps {
    /** Width ÷ height (default 16/9) */
    ratio?: number;
    className?: string;
}

/** Keeps the ratio of width and height, e.g. for images, videos and maps */
export function AspectRatio({ ratio = 16 / 9, className, style, ...props }: AspectRatioProps) {
    return <View {...props} className={aspectRatio({ class: className })} style={[{ aspectRatio: ratio }, style]} />;
}
