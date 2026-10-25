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
    /** Icon while pressed (default: `icon`) – the label stays the same */
    pressedIcon?: IconComponent;
    /** Props passed on to the icon component, e.g. { fill: 'currentColor' } for a filled icon or { strokeWidth: 1.5 } */
    iconProps?: Record<string, unknown>;
    /** Props of the icon while pressed, added to `iconProps` – e.g. { fill: 'currentColor' }: a filled icon when on */
    pressedIconProps?: Record<string, unknown>;
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
    icon,
    pressedIcon,
    iconProps,
    pressedIconProps,
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
            {(icon || pressedIcon) && (
                <Toggle.Context>
                    {(api) => {
                        const Icon = api.pressed ? (pressedIcon ?? icon) : icon;
                        return (
                            Icon && (
                                <Icon
                                    {...(api.pressed ? { ...iconProps, ...pressedIconProps } : iconProps)}
                                    className={look.icon()}
                                    aria-hidden="true"
                                />
                            )
                        );
                    }}
                </Toggle.Context>
            )}
            {children}
        </Toggle.Root>
    );
}
