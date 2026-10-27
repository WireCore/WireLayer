import { Dialog as ArkDialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import { dialog as dialogRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { X } from 'lucide-react';
import { useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { confirmStore, type ConfirmButtonOptions, type ConfirmRequest } from './confirm.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ConfirmDialogProps {
    /** Accessible name of the close button */
    closeLabel?: string;
    /** Look of the confirm button in every request (default: size sm, `primary`, `danger` for status danger) */
    confirmButton?: ConfirmButtonOptions;
    /** Look of the cancel button in every request (default: size sm, `outline`) */
    cancelButton?: ConfirmButtonOptions;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof dialogRecipe>;
}

/** Place once in the app; ask with `await confirm({ title, … })` or `await prompt({ title, label })` */
export function ConfirmDialog({ classes, closeLabel, confirmButton, cancelButton }: ConfirmDialogProps) {
    const dialog = useRecipe('dialog', dialogRecipe, classes);
    const translations = useTranslations();
    const request = useSyncExternalStore(confirmStore.subscribe, confirmStore.get, () => null);
    // Keeps the content while the closing animation runs
    const [content, setContent] = useState<ConfirmRequest | null>(null);
    // Text of prompt() or typeToConfirm; the error shows after the first attempt to confirm
    const [value, setValue] = useState('');
    const [attempted, setAttempted] = useState(false);
    if (request && request !== content) {
        setContent(request);
        setValue(request.kind === 'prompt' ? (request.defaultValue ?? '') : '');
        setAttempted(false);
    }
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const inputBox = useRef<HTMLDivElement>(null);
    const styles = dialog({ status: content?.status, position: content?.position });
    const Icon = content?.icon;
    const typeToConfirm = content?.kind === 'confirm' ? content.typeToConfirm : undefined;
    const inputLabel =
        content?.kind === 'prompt'
            ? content.label
            : typeToConfirm === undefined
              ? undefined
              : translations.confirm.typeToConfirm(typeToConfirm);
    const error =
        content?.kind === 'prompt'
            ? (content.validate?.(value) ?? undefined)
            : typeToConfirm !== undefined && value.trim() !== typeToConfirm
              ? translations.confirm.mismatch
              : undefined;
    const submit = () => {
        setAttempted(true);
        if (!error) request?.settle(true, value);
    };

    return (
        <ArkDialog.Root
            open={!!request}
            onOpenChange={(details) => !details.open && request?.settle(false)}
            role="alertdialog"
            // The text field gets the focus when there is one, otherwise cancelling (the safe choice)
            initialFocusEl={() => inputBox.current?.querySelector('input') ?? cancelButtonRef.current}
            finalFocusEl={() => content?.returnFocus ?? null}
            lazyMount
            unmountOnExit
        >
            {content && (
                <Portal>
                    <ArkDialog.Backdrop className={styles.backdrop()} />
                    <ArkDialog.Positioner className={styles.positioner()}>
                        <ArkDialog.Content className={styles.content()}>
                            <div className={styles.header()}>
                                {Icon && (
                                    <span className={styles.iconBox()}>
                                        <Icon className={styles.icon()} aria-hidden="true" />
                                    </span>
                                )}
                                <ArkDialog.CloseTrigger
                                    className={styles.close()}
                                    aria-label={closeLabel ?? translations.common.close}
                                >
                                    <X className={styles.closeIcon()} aria-hidden="true" />
                                </ArkDialog.CloseTrigger>
                            </div>
                            <div className={styles.body()}>
                                <ArkDialog.Title className={styles.title()}>{content.title}</ArkDialog.Title>
                                {content.description && (
                                    <ArkDialog.Description className={styles.description()}>
                                        {content.description}
                                    </ArkDialog.Description>
                                )}
                                {inputLabel && (
                                    <div ref={inputBox}>
                                        <Field label={inputLabel} error={attempted ? error : undefined}>
                                            <Input
                                                value={value}
                                                onChange={(event) => setValue(event.target.value)}
                                                placeholder={
                                                    content.kind === 'prompt' ? content.placeholder : undefined
                                                }
                                                autoComplete="off"
                                                onKeyDown={(event) => {
                                                    if (event.key !== 'Enter') return;
                                                    event.preventDefault();
                                                    submit();
                                                }}
                                            />
                                        </Field>
                                    </div>
                                )}
                            </div>
                            <div className={styles.footer()}>
                                <Button
                                    ref={cancelButtonRef}
                                    variant="outline"
                                    size="sm"
                                    {...cancelButton}
                                    {...content.cancelButton}
                                    onClick={() => request?.settle(false)}
                                >
                                    {content.cancelLabel ?? translations.common.cancel}
                                </Button>
                                <Button
                                    variant={content.status === 'danger' ? 'danger' : 'primary'}
                                    size="sm"
                                    {...confirmButton}
                                    {...content.confirmButton}
                                    onClick={submit}
                                >
                                    {content.confirmLabel ?? translations.common.confirm}
                                </Button>
                            </div>
                        </ArkDialog.Content>
                    </ArkDialog.Positioner>
                </Portal>
            )}
        </ArkDialog.Root>
    );
}
