import { Toggle } from '@ark-ui/react/toggle';
import {
    button as buttonRecipe,
    toggleButton as toggleButtonRecipe,
    type Size,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ToggleButtonProps extends Omit<ComponentProps<'button'>, 'onChange'> {
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
    size?: Size;
    icon?: IconComponent;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof toggleButtonRecipe>;
}

/** Button that stays pressed (aria-pressed), e.g. "Active only" – the label does not change with the state */
export function ToggleButton({
    classes,
    pressed,
    defaultPressed = false,
    onPressedChange,
    size = 'md',
    icon: Icon,
    disabled = false,
    className,
    children,
    ...props
}: ToggleButtonProps) {
    const button = useRecipe('button', buttonRecipe);
    const toggleButton = useRecipe('toggleButton', toggleButtonRecipe, classes);
    const look = button({ variant: 'outline', size });
    return (
        <Toggle.Root
            {...props}
            className={look.base({ class: [toggleButton(), className] })}
            pressed={pressed}
            defaultPressed={defaultPressed}
            onPressedChange={onPressedChange}
            disabled={disabled}
        >
            {Icon && <Icon className={look.icon()} aria-hidden="true" />}
            {children}
        </Toggle.Root>
    );
}
