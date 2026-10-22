import { useSyncExternalStore } from 'react';
import { Dialog } from '../Dialog/Dialog.js';
import { dialogStore, type DialogRequest } from './dialogs.js';

export interface DialogHostProps {
    /** Accessible name of the close buttons */
    closeLabel?: string;
}

/** Place once at the root of the app; shows the dialogs of `openDialog()` */
export function DialogHost({ closeLabel }: DialogHostProps) {
    const dialogs = useSyncExternalStore(dialogStore.subscribe, dialogStore.get, dialogStore.get);
    return <DialogStack dialogs={dialogs} closeLabel={closeLabel} />;
}

// Each open dialog renders the next one inside its modal – iOS presents a second modal only from the one on top.
// A closing one (fading out) leaves the next ones beside it, so they are not hidden with it.
function DialogStack({ dialogs, closeLabel }: { dialogs: DialogRequest[]; closeLabel?: string }) {
    const [dialog, ...rest] = dialogs;
    if (!dialog) return null;
    const close = (result?: unknown) => dialog.settle(result);
    const next = <DialogStack dialogs={rest} closeLabel={closeLabel} />;
    return (
        <>
            <Dialog
                open={dialog.open}
                onOpenChange={(open) => {
                    if (!open) close(undefined);
                }}
                title={dialog.title}
                description={dialog.description}
                size={dialog.size}
                position={dialog.position}
                fullscreen={dialog.fullscreen}
                scrollBehavior={dialog.scrollBehavior}
                closable={dialog.closable !== false}
                closeOnEscape={dialog.closeOnEscape !== false}
                closeOnInteractOutside={dialog.closeOnInteractOutside !== false}
                closeLabel={closeLabel}
            >
                {dialog.content(close as (result?: never) => void, dialog.data)}
                {dialog.open && next}
            </Dialog>
            {!dialog.open && next}
        </>
    );
}
