import { useRef, useState, useSyncExternalStore, type ComponentRef } from 'react';
import { Pressable, TextInput } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Button } from '../Button/Button.js';
import { Dialog } from '../Dialog/Dialog.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';
import { confirmStore, type ConfirmRequest } from './confirm.js';

export interface ConfirmDialogProps {
    /** Accessible name of the close button */
    closeLabel?: string;
}

/**
 * Place once at the root of the app; then `await confirm({ title })` and `await prompt({ title, label })` ask from
 * anywhere. An alertdialog: a press outside does not answer, the back button and Escape cancel.
 */
export function ConfirmDialog({ closeLabel }: ConfirmDialogProps) {
    const request = useSyncExternalStore(confirmStore.subscribe, confirmStore.get, confirmStore.get);
    const shown = useSyncExternalStore(confirmStore.subscribe, confirmStore.last, confirmStore.last);
    if (!shown) return null;
    // A new key per request: the field starts empty (or with defaultValue) every time
    return <ConfirmContent key={shown.id} request={shown} open={!!request} closeLabel={closeLabel} />;
}

function ConfirmContent({
    request,
    open,
    closeLabel,
}: {
    request: ConfirmRequest;
    open: boolean;
    closeLabel?: string;
}) {
    const translations = useTranslations();
    const [value, setValue] = useState(request.kind === 'prompt' ? (request.defaultValue ?? '') : '');
    const [submitted, setSubmitted] = useState(false);
    const cancelButton = useRef<ComponentRef<typeof Pressable>>(null);
    const field = useRef<ComponentRef<typeof TextInput>>(null);
    const typed = request.kind === 'confirm' ? request.typeToConfirm : undefined;
    const withField = request.kind === 'prompt' || !!typed;

    const error =
        request.kind === 'prompt'
            ? (request.validate?.(value) ?? undefined)
            : typed && value.trim() !== typed
              ? translations.confirm.mismatch
              : undefined;
    const submit = () => {
        setSubmitted(true);
        if (error) return;
        request.settle(true, value);
    };
    const cancel = () => request.settle(false);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) cancel();
            }}
            role="alertdialog"
            title={request.title}
            description={request.description}
            icon={request.icon}
            status={request.status}
            position={request.position}
            closeOnInteractOutside={false}
            closeLabel={closeLabel}
            initialFocusRef={withField ? field : cancelButton}
            footer={
                <>
                    <Button ref={cancelButton} variant="outline" size="sm" onPress={cancel}>
                        {request.cancelLabel ?? translations.common.cancel}
                    </Button>
                    <Button variant={request.status === 'danger' ? 'danger' : 'primary'} size="sm" onPress={submit}>
                        {request.confirmLabel ?? translations.common.confirm}
                    </Button>
                </>
            }
        >
            {withField && (
                <Field
                    label={request.kind === 'prompt' ? request.label : translations.confirm.typeToConfirm(typed ?? '')}
                    error={submitted ? error : undefined}
                >
                    <Input
                        ref={field}
                        value={value}
                        onChangeText={setValue}
                        placeholder={request.kind === 'prompt' ? request.placeholder : undefined}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={submit}
                    />
                </Field>
            )}
        </Dialog>
    );
}
