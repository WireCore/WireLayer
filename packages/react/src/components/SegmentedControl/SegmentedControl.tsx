import { SegmentGroup } from '@ark-ui/react/segment-group';
import {
    segmentedControl as segmentedControlRecipe,
    type SegmentedControlSize,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { SegmentedControlContext } from './context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SegmentedControlProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'dir'> {
    value?: string | null;
    defaultValue?: string;
    onValueChange?: (value: string | null) => void;
    /** Accessible name of the group (visually hidden) */
    label: string;
    size?: SegmentedControlSize;
    disabled?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof segmentedControlRecipe>;
}

/** Few exclusive options as a segmented switch (radio group) */
export function SegmentedControl({
    classes,
    value,
    defaultValue,
    onValueChange,
    label,
    size = 'md',
    disabled,
    name,
    className,
    children,
    ...props
}: SegmentedControlProps) {
    const segmentedControl = useRecipe('segmentedControl', segmentedControlRecipe, classes);
    const styles = segmentedControl({ size });

    return (
        <SegmentedControlContext value={size}>
            <SegmentGroup.Root
                {...props}
                className={styles.base({ class: className })}
                value={value}
                defaultValue={defaultValue}
                onValueChange={(details) => onValueChange?.(details.value)}
                orientation="horizontal"
                disabled={disabled}
                name={name}
            >
                <SegmentGroup.Label className={styles.label()}>{label}</SegmentGroup.Label>
                {children}
            </SegmentGroup.Root>
        </SegmentedControlContext>
    );
}
