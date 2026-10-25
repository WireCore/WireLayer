import {
    button as buttonRecipe,
    buttonColorKey,
    splitButton as splitButtonRecipe,
    type ButtonColor,
    type ButtonShape,
    type ButtonSize,
    type ButtonVariant,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronDown } from 'lucide-react';
import type { CSSProperties, MouseEvent } from 'react';
import type { IconComponent } from '../../types.js';
import { Menu, type MenuEntry } from '../Menu/Menu.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SplitButtonProps {
    /** Label of the main action */
    label: string;
    /** The other actions in the menu */
    items: readonly MenuEntry[];
    variant?: Exclude<ButtonVariant, 'link' | 'text'>;
    /** Colour combined with the variant, like Button `color` (e.g. outline in danger) */
    color?: ButtonColor;
    size?: ButtonSize;
    /** Corner shape of the joined control: `pill` (default), `rounded` or `square` */
    shape?: ButtonShape;
    icon?: IconComponent;
    disabled?: boolean;
    /** Accessible name of the menu button */
    menuLabel?: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
    onSelect?: (value: string) => void;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof splitButtonRecipe>;
}

/** Main action plus a menu with the other actions; both are separate buttons */
export function SplitButton({
    classes,
    label,
    items,
    variant = 'primary',
    color,
    size = 'md',
    shape,
    icon: Icon,
    disabled = false,
    menuLabel: menuLabelProp,
    onClick,
    onSelect,
    className,
    style,
}: SplitButtonProps) {
    const button = useRecipe('button', buttonRecipe);
    const splitButton = useRecipe('splitButton', splitButtonRecipe, classes);
    const styles = splitButton();
    const translations = useTranslations();
    const menuLabel = menuLabelProp ?? translations.splitButton.more;
    const look = button({ variant, color: buttonColorKey(color), size, shape });
    return (
        <div role="group" className={styles.base({ class: className })} style={style} aria-label={label}>
            <button type="button" className={look.base({ class: styles.main() })} disabled={disabled} onClick={onClick}>
                {Icon && <Icon className={look.icon()} aria-hidden="true" />}
                {label}
            </button>
            <Menu items={items} onSelect={onSelect}>
                <button
                    type="button"
                    className={look.base({ class: styles.toggle() })}
                    disabled={disabled}
                    aria-label={menuLabel}
                >
                    <ChevronDown className={styles.toggleIcon()} aria-hidden="true" />
                </button>
            </Menu>
        </div>
    );
}
