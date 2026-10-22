// Internal: loading spinner, clear button and status icon at the end of a text control
import { CircleAlert, CircleCheck, LoaderCircle, X } from 'lucide-react';

export interface InputStatusProps {
    loading?: boolean;
    /** Shows the clear button (clearable and not empty) */
    clear?: boolean;
    clearLabel: string;
    onClear?: () => void;
    invalid?: boolean;
    success?: boolean;
    /** Show the invalid icon (Input does; the boxed controls mark invalid by the border only) */
    invalidIcon?: boolean;
    classes: { spinner: string; clear: string; clearIcon: string; statusIcon: string };
}

export function InputStatus({
    loading,
    clear,
    clearLabel,
    onClear,
    invalid,
    success,
    invalidIcon,
    classes,
}: InputStatusProps) {
    return (
        <>
            {loading && <LoaderCircle className={classes.spinner} aria-hidden="true" />}
            {/* Not a tab stop: the usual editing keys delete the text, too */}
            {clear && (
                <button type="button" tabIndex={-1} className={classes.clear} aria-label={clearLabel} onClick={onClear}>
                    <X className={classes.clearIcon} aria-hidden="true" />
                </button>
            )}
            {invalid && invalidIcon ? (
                <CircleAlert className={classes.statusIcon} aria-hidden="true" />
            ) : (
                success && !invalid && <CircleCheck className={classes.statusIcon} aria-hidden="true" />
            )}
        </>
    );
}
