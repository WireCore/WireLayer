import { group, groupItem, type LayoutGap } from '@wirecore/wirelayer-recipes/native';
import { Children, isValidElement } from 'react';
import { View, type ViewProps } from 'react-native';

export interface GroupProps extends ViewProps {
    /** Space between the children (default sm, 8) */
    gap?: LayoutGap;
    justify?: 'start' | 'center' | 'end' | 'between';
    /** Vertical alignment (default middle) */
    align?: 'middle' | 'top' | 'bottom' | 'baseline' | 'stretch';
    /** One line, no wrapping */
    nowrap?: boolean;
    /** The children share the width equally */
    grow?: boolean;
    className?: string;
}

/** Children side by side, wrapping onto the next line when there is no room */
export function Group({ gap, justify, align, nowrap, grow, className, children, ...props }: GroupProps) {
    return (
        <View {...props} className={group({ gap, justify, align, nowrap, class: className })}>
            {grow
                ? Children.map(children, (child) =>
                      isValidElement(child) ? <View className={groupItem()}>{child}</View> : child
                  )
                : children}
        </View>
    );
}
