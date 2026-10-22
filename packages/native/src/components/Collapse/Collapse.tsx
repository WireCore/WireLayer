import { collapse } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useState } from 'react';
import { Animated, View, type ViewProps } from 'react-native';
import { useReducedMotion } from '../../utils/useReducedMotion.js';

export interface CollapseProps extends ViewProps {
    /** Shown (default false) */
    open?: boolean;
    className?: string;
}

/**
 * Shows and hides its content with a height animation (none with reduced motion). Hidden content is not rendered –
 * the button that toggles it carries `aria-expanded`.
 */
export function Collapse({ open = false, className, children, ...props }: CollapseProps) {
    const reducedMotion = useReducedMotion();
    const [height, setHeight] = useState(0);
    const [progress] = useState(() => new Animated.Value(open ? 1 : 0));
    const [shown, setShown] = useState(open);
    if (open && !shown) setShown(true);

    useEffect(() => {
        const run = Animated.timing(progress, {
            toValue: open ? 1 : 0,
            duration: reducedMotion ? 0 : 200,
            // Height cannot use the native driver
            useNativeDriver: false,
        });
        run.start(({ finished }) => {
            if (finished && !open) setShown(false);
        });
        return () => run.stop();
    }, [open, reducedMotion, progress]);

    if (!shown) return null;
    return (
        <Animated.View
            {...props}
            className={collapse({ class: className })}
            style={{
                height: height ? progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) : undefined,
            }}
        >
            <View onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>{children}</View>
        </Animated.View>
    );
}
