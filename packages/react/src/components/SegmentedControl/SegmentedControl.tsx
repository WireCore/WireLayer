import { useFieldContext } from '@ark-ui/react/field';
import { SegmentGroup } from '@ark-ui/react/segment-group';
import {
    segmentedControl as segmentedControlRecipe,
    type SegmentedControlSize,
    type RecipeClasses,
    warnInDevelopment,
} from '@wirecore/wirelayer-recipes';
import { useEffect, type ComponentProps } from 'react';
import { SegmentedControlContext } from './context.js';
import { useFieldStatus } from '../Field/context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useLabelForWarning } from '../../utils/label-for.js';

/**
 * `V`: the type of the values, e.g. a union like `'ssh' | 'sftp'` (default string); `R`: whether `required` is set
 * (then onValueChange only gets values, never null)
 */
export interface SegmentedControlProps<V extends string = string, R extends boolean = false> extends Omit<
    ComponentProps<'div'>,
    'defaultValue' | 'dir'
> {
    value?: V | null;
    defaultValue?: V;
    onValueChange?: (value: R extends true ? V : V | null) => void;
    /** Accessible name of the group (visually hidden) – inside a Field with a label, the Field's label names it */
    label?: string;
    size?: SegmentedControlSize;
    disabled?: boolean;
    /**
     * A value is required (aria-required). onValueChange then only gets values (typed `V`, not `V | null`): a form
     * reset back to an empty start is not passed on
     */
    required?: R;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof segmentedControlRecipe>;
}

/** Few exclusive options as a segmented switch (radio group) */
export function SegmentedControl<V extends string = string, R extends boolean = false>({
    classes,
    value,
    defaultValue,
    onValueChange,
    label,
    size = 'md',
    disabled,
    required,
    name,
    className,
    children,
    ...props
}: SegmentedControlProps<V, R>) {
    useLabelForWarning('SegmentedControl', props.id);
    const segmentedControl = useRecipe('segmentedControl', segmentedControlRecipe, classes);
    const styles = segmentedControl({ size });
    // Inside a Field: its label names the group (unless it has a name of its own), its texts describe it
    const field = useFieldContext();
    const fieldStatus = useFieldStatus();
    const named = !!label || !!props['aria-label'] || !!props['aria-labelledby'];
    const fieldLabelled = !named && !!field && fieldStatus.labelled;
    useEffect(() => {
        if (!named && !fieldLabelled)
            warnInDevelopment(
                'SegmentedControl: pass `label` or place it in a Field with a label – the group has no name'
            );
    }, [named, fieldLabelled]);

    return (
        <SegmentedControlContext value={size}>
            <SegmentGroup.Root
                aria-describedby={field?.ariaDescribedby}
                {...(required ? { 'aria-required': true } : {})}
                {...props}
                className={styles.base({ class: className })}
                ids={fieldLabelled ? { label: field.ids.label } : undefined}
                value={value}
                defaultValue={defaultValue}
                onValueChange={(details) => {
                    // A required control never reports an empty value (Ark does on a form reset to an empty start:
                    // null or undefined)
                    if (details.value == null && required) return;
                    onValueChange?.(details.value as R extends true ? V : V | null);
                }}
                orientation="horizontal"
                disabled={disabled ?? field?.disabled}
                name={name}
            >
                {!fieldLabelled && <SegmentGroup.Label className={styles.label()}>{label}</SegmentGroup.Label>}
                {children}
            </SegmentGroup.Root>
        </SegmentedControlContext>
    );
}
