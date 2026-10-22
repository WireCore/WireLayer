import { Clipboard } from '@ark-ui/react/clipboard';
import {
    copyButton as copyButtonRecipe,
    iconButton as iconButtonRecipe,
    type Size,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Check, Copy } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CopyButtonProps {
    /** Text that is copied */
    value: string;
    /** Shows the value next to the button (monospace) */
    showValue?: boolean;
    /** Accessible name, e.g. "Copy IP address" */
    label?: string;
    size?: Size;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof copyButtonRecipe>;
}

/** Copies the value; the icon turns into a check and "Copied to clipboard" is announced */
export function CopyButton({
    classes,
    value,
    showValue = false,
    label: labelProp,
    size = 'sm',
    className,
    style,
}: CopyButtonProps) {
    const copyButton = useRecipe('copyButton', copyButtonRecipe, classes);
    const iconButton = useRecipe('iconButton', iconButtonRecipe);
    const styles = copyButton();
    const translations = useTranslations();
    const label = labelProp ?? translations.copyButton.label;
    const look = iconButton({ variant: 'text', size });
    return (
        <Clipboard.Root value={value} className={styles.base({ class: className })} style={style}>
            {showValue && <span className={styles.value()}>{value}</span>}
            <Clipboard.Trigger className={look.base()} aria-label={label}>
                <Clipboard.Indicator copied={<Check className={look.icon()} aria-hidden="true" />}>
                    <Copy className={look.icon()} aria-hidden="true" />
                </Clipboard.Indicator>
            </Clipboard.Trigger>
            <Clipboard.Context>
                {(api) => (
                    <span role="status" className={styles.status()}>
                        {api.copied ? translations.copyButton.copied : ''}
                    </span>
                )}
            </Clipboard.Context>
        </Clipboard.Root>
    );
}
