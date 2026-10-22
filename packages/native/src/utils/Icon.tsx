import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { useResolveClassNames } from 'uniwind';

export type IconComponent = LucideIcon;

/**
 * Lucide icons draw with SVG props, not styles: colour (`text-*`) and size (`size-*`) are resolved from the
 * recipe classes, layout classes (margins, alignment) apply to the wrapper.
 * Icons are decorative – the control carries the accessible name.
 */
export function Icon({
    icon: Component,
    className,
    filled = false,
}: {
    icon: IconComponent;
    className: string;
    /** Fills the shape with the colour, e.g. a chosen star */
    filled?: boolean;
}) {
    const style = useResolveClassNames(className);
    const color = typeof style.color === 'string' ? style.color : undefined;
    return (
        <View aria-hidden className={className}>
            <Component
                color={color}
                // Only when filled – an explicit undefined would replace Lucide's fill="none"
                {...(filled ? { fill: color } : {})}
                size={typeof style.width === 'number' ? style.width : 16}
            />
        </View>
    );
}
