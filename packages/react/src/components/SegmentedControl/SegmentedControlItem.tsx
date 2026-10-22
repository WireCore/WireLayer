import { SegmentGroup } from '@ark-ui/react/segment-group';
import { segmentedControl as segmentedControlRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useContext, type ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { SegmentedControlContext } from './context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SegmentedControlItemProps extends ComponentProps<'label'> {
    value: string;
    /** Icon component before the label */
    icon?: IconComponent;
    disabled?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof segmentedControlRecipe>;
}

/** One option of a SegmentedControl */
export function SegmentedControlItem({
    classes,
    value,
    icon: Icon,
    disabled,
    className,
    children,
    ...props
}: SegmentedControlItemProps) {
    const segmentedControl = useRecipe('segmentedControl', segmentedControlRecipe, classes);
    const size = useContext(SegmentedControlContext);
    const styles = segmentedControl({ size: size ?? undefined });

    return (
        <SegmentGroup.Item {...props} className={styles.item({ class: className })} value={value} disabled={disabled}>
            {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
            <SegmentGroup.ItemText>{children}</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
    );
}
