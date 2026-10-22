import { container } from '@wirecore/wirelayer-recipes/native';
import { View, type ViewProps } from 'react-native';

export interface ContainerProps extends ViewProps {
    /** Largest width: sm 672, md 768, lg 1024 (default), xl 1280, full */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Without the side padding */
    flush?: boolean;
    className?: string;
}

/** Centres the content with a largest width and side padding (tablets, the web) */
export function Container({ size, flush, className, ...props }: ContainerProps) {
    return <View {...props} className={container({ size, flush, class: className })} />;
}
