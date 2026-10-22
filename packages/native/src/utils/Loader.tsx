import { ActivityIndicator } from 'react-native';
import { useResolveClassNames } from 'uniwind';

/** Small decorative spinner inside a control – the control itself is marked busy (aria-busy) */
export function Loader({ className }: { className: string }) {
    const style = useResolveClassNames(className);
    return (
        <ActivityIndicator
            aria-hidden
            className={className}
            color={typeof style.color === 'string' ? style.color : undefined}
            size="small"
        />
    );
}
