import { buttonGroup } from '@wirecore/wirelayer-recipes/native';
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

export interface ButtonGroupProps extends ViewProps {
    /** Accessible name of the group (role "group"), e.g. "View" */
    label?: string;
    /** Buttons side by side (default) or stacked */
    orientation?: 'horizontal' | 'vertical';
    /** Full width of the container; the buttons share it */
    block?: boolean;
    /** Button or IconButton elements */
    children?: ReactNode;
}

/** Buttons joined into one control (role "group"): only the outer corners stay round, also stacked */
export function ButtonGroup({ label, orientation, block, className, children, ...props }: ButtonGroupProps) {
    const items = Children.toArray(children).filter(isValidElement) as ReactElement<{ className?: string }>[];
    return (
        <View
            role="group"
            aria-label={label}
            {...props}
            className={buttonGroup({ orientation, block }).base({ class: className })}
        >
            {items.map((item, index) => {
                const position =
                    items.length === 1
                        ? 'only'
                        : index === 0
                          ? 'first'
                          : index === items.length - 1
                            ? 'last'
                            : 'middle';
                return cloneElement(item, {
                    className: buttonGroup({ orientation, block, position }).item({ class: item.props.className }),
                });
            })}
        </View>
    );
}
