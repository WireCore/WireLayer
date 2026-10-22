import { ToggleGroup } from '@ark-ui/react/toggle-group';
import {
    chip as chipRecipe,
    chipGroup as chipGroupRecipe,
    type ChipSize,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import { useContext, type ComponentProps, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { ChipGroupContext } from './context.js';

export interface ChipProps extends Omit<ComponentProps<'button'>, 'value'> {
    /** Value of the option inside a ChipGroup (required there; a standalone chip does not need it) */
    value?: string;
    /** Icon component before the label */
    icon?: IconComponent;
    /** Text of a standalone chip (or the children); also names its remove button */
    label?: string;
    /** Standalone chip: small round image before the label (decorative) */
    avatar?: string;
    /** Standalone chip: shows a remove button that calls `onRemove` */
    removable?: boolean;
    /** Accessible name of the remove button (default: "Remove <label>") */
    removeLabel?: string;
    onRemove?: () => void;
    /** Standalone chip: size */
    size?: ChipSize;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipes chipGroup and chip) */
    classes?: RecipeClasses<typeof chipGroupRecipe> & RecipeClasses<typeof chipRecipe>;
}

/** One option of a ChipGroup (a toggle button); outside a ChipGroup a standalone chip, optionally removable */
export function Chip({
    classes,
    value,
    icon: Icon,
    disabled,
    label,
    avatar,
    removable = false,
    removeLabel,
    onRemove,
    size,
    className,
    children,
    ...props
}: ChipProps) {
    const inGroup = useContext(ChipGroupContext);
    const chipGroup = useRecipe('chipGroup', chipGroupRecipe, classes);
    const chip = useRecipe('chip', chipRecipe, classes);
    const translations = useTranslations();
    if (inGroup) {
        const styles = chipGroup();
        return (
            <ToggleGroup.Item
                {...props}
                className={styles.chip({ class: className })}
                value={value ?? ''}
                disabled={disabled}
            >
                {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
                {children}
            </ToggleGroup.Item>
        );
    }
    const styles = chip({ size, removable, withAvatar: !!avatar, disabled: !!disabled });
    // Standalone: a label, not a control; only the remove button is focusable
    return (
        <span {...(props as ComponentProps<'span'>)} className={styles.base({ class: className })}>
            {avatar ? (
                <img src={avatar} alt="" className={styles.avatar()} />
            ) : (
                Icon && <Icon className={styles.icon()} aria-hidden="true" />
            )}
            <span className={styles.label()}>{(children as ReactNode) ?? label}</span>
            {removable && (
                <button
                    type="button"
                    className={styles.remove()}
                    disabled={disabled}
                    aria-label={removeLabel ?? translations.chip.remove(label)}
                    onClick={onRemove}
                >
                    <X className={styles.removeIcon()} aria-hidden="true" />
                </button>
            )}
        </span>
    );
}
