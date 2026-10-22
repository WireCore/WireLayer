import { Popover } from '@ark-ui/react/popover';
import { Portal } from '@ark-ui/react/portal';
import { confirmPopup as confirmPopupRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useId, useRef, useState, type ReactElement } from 'react';
import { Button } from '../Button/Button.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ConfirmPopupProps {
    /** The question, e.g. "Delete the server?" */
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** The confirm button in the danger colour */
    danger?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
    /** The control that asks, e.g. a delete button */
    children: ReactElement;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof confirmPopupRecipe>;
}

/**
 * Asks right at the control (e.g. a delete button). An alert dialog without a backdrop: the focus starts on the
 * safe answer, Escape cancels, then it returns to the control.
 */
export function ConfirmPopup({
    classes,
    message,
    confirmLabel: confirmLabelProp,
    cancelLabel: cancelLabelProp,
    danger = false,
    onConfirm,
    onCancel,
    children,
}: ConfirmPopupProps) {
    const confirmPopup = useRecipe('confirmPopup', confirmPopupRecipe, classes);
    const styles = confirmPopup();
    const translations = useTranslations();
    const confirmLabel = confirmLabelProp ?? translations.confirmPopup.confirm;
    const cancelLabel = cancelLabelProp ?? translations.confirmPopup.cancel;
    const id = useId();
    const [open, setOpen] = useState(false);
    const cancelButton = useRef<HTMLButtonElement>(null);
    // Escape or a click outside count as cancel – but not after an answer closed it
    const answered = useRef(false);
    const settle = (confirmed: boolean) => {
        answered.current = true;
        setOpen(false);
        if (confirmed) onConfirm?.();
        else onCancel?.();
    };

    return (
        <Popover.Root
            open={open}
            onOpenChange={(details) => {
                setOpen(details.open);
                if (details.open) answered.current = false;
                else if (!answered.current) onCancel?.();
            }}
            initialFocusEl={() => cancelButton.current}
            positioning={{ placement: 'bottom', gutter: 8 }}
            lazyMount
            unmountOnExit
        >
            <Popover.Trigger asChild>{children}</Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content className={styles.content()} role="alertdialog" aria-labelledby={`${id}message`}>
                        <p id={`${id}message`} className={styles.message()}>
                            {message}
                        </p>
                        <div className={styles.actions()}>
                            <Button ref={cancelButton} variant="outline" size="sm" onClick={() => settle(false)}>
                                {cancelLabel}
                            </Button>
                            <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={() => settle(true)}>
                                {confirmLabel}
                            </Button>
                        </div>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
}
