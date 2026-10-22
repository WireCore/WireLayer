import { FileUpload as ArkFileUpload, useFileUpload } from '@ark-ui/react/file-upload';
import { Portal } from '@ark-ui/react/portal';
import {
    announce,
    dragFilesState,
    fileUpload as fileUploadRecipe,
    isPreviewableImage,
    UploadQueue,
    type RecipeClasses,
    type UploadFunction,
    type UploadState,
} from '@wirecore/wirelayer-recipes';
import { FileText, RotateCw, Upload, X } from 'lucide-react';
import {
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    type ClipboardEvent,
    type ComponentProps,
    type DragEvent,
    type Ref,
} from 'react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface FileUploadProps extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'dir' | 'ref'> {
    /** Visible label of the upload */
    label?: string;
    /** Allowed types, e.g. "application/pdf" or ["image/png", "image/jpeg"] (presets: FileTypes.images …) */
    accept?: string | string[];
    maxFiles?: number;
    /** Maximum size per file in bytes */
    maxFileSize?: number;
    /** The accepted files after every change */
    onFilesChange?: (files: File[]) => void;
    /** Files that were not taken, with the reasons as codes (FILE_INVALID_TYPE, FILE_TOO_LARGE, TOO_MANY_FILES …) */
    onFilesReject?: (rejections: { file: File; errors: string[] }[]) => void;
    /** A file finished uploading (or failed) */
    onUploadComplete?: (file: File, state: UploadState) => void;
    /** Text in the drop zone */
    dropzoneText?: string;
    /** Label of the button that opens the file dialog */
    triggerLabel?: string;
    /** Allowed types and sizes, e.g. "PDF, max. 5 MB" */
    hint?: string;
    /** Drop zone (default) or only the button */
    variant?: 'dropzone' | 'button';
    /** Uploads a file: report progress with onProgress(0–100), stop when the signal aborts; resolve when done */
    upload?: UploadFunction;
    /** Starts the upload as soon as files are added (otherwise with "Upload all") */
    autoUpload?: boolean;
    /** Thumbnails for images (object URLs, released again) */
    preview?: boolean;
    /** Files can be dropped anywhere in the window */
    fullscreenDrop?: boolean;
    /** Ctrl+V inside the component adds files from the clipboard */
    paste?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof fileUploadRecipe>;
    /** Methods: open, clear, uploadAll */
    ref?: Ref<FileUploadHandle>;
}

/** Methods of a FileUpload (ref) */
export interface FileUploadHandle {
    /** Opens the file dialog (e.g. from a button elsewhere) */
    open(): void;
    /** Removes all files */
    clear(): void;
    /** Uploads every file that is not uploaded yet */
    uploadAll(): Promise<void[]>;
}

type DragState = 'none' | 'accept' | 'reject';
const hasFiles = (event: { dataTransfer: DataTransfer | null }) =>
    [...(event.dataTransfer?.types ?? [])].includes('Files');

/**
 * Drop files onto the zone or choose them with the button (the keyboard path). Accepted files are listed with a
 * remove button each; rejected files are announced with the reason. With `upload` every file shows its progress and
 * can be cancelled or retried.
 */
export function FileUpload({
    classes,
    label,
    accept,
    maxFiles = 1,
    maxFileSize,
    onFilesChange,
    onFilesReject,
    onUploadComplete,
    dropzoneText,
    triggerLabel,
    hint,
    variant = 'dropzone',
    upload,
    autoUpload,
    preview,
    fullscreenDrop,
    paste,
    disabled,
    invalid,
    required,
    name,
    className,
    ref,
    onPaste,
    ...props
}: FileUploadProps) {
    const fileUpload = useRecipe('fileUpload', fileUploadRecipe, classes);
    const styles = fileUpload();
    const translations = useTranslations();
    const t = translations.fileUpload;
    const several = maxFiles > 1;
    const [states, setStates] = useState(() => new Map<File, UploadState>());
    const [drag, setDrag] = useState<DragState>('none');
    const [windowDrag, setWindowDrag] = useState<DragState>('none');
    // Latest callbacks for the queue and the window listeners
    const latest = useRef({ upload, onUploadComplete, t });
    useEffect(() => {
        latest.current = { upload, onUploadComplete, t };
    });
    const reported = useRef(new Map<File, UploadState>());
    // Created on first use (never while rendering)
    const queueRef = useRef<UploadQueue | null>(null);
    const queue = () =>
        (queueRef.current ??= new UploadQueue(
            (file, options) => latest.current.upload!(file, options),
            (next) => {
                for (const [file, state] of next) {
                    if (reported.current.get(file)?.status === state.status) continue;
                    const texts = latest.current.t;
                    if (state.status === 'done') announce(texts.uploaded(file));
                    if (state.status === 'error') announce(texts.failed(file), { politeness: 'assertive' });
                    if (state.status === 'done' || state.status === 'error')
                        latest.current.onUploadComplete?.(file, state);
                }
                reported.current = next;
                setStates(next);
            }
        ));
    useEffect(() => () => queueRef.current?.dispose(), []);

    const api = useFileUpload({
        accept,
        maxFiles,
        maxFileSize,
        disabled,
        invalid,
        required,
        name,
        translations: t,
        onFileChange: (details) => {
            onFilesChange?.(details.acceptedFiles);
            if (!upload) return;
            const known = new Set(states.keys());
            for (const file of known) if (!details.acceptedFiles.includes(file)) queue().remove(file);
            const added = details.acceptedFiles.filter((file) => !known.has(file));
            queue().add(added);
            if (autoUpload) for (const file of added) void queue().start(file);
        },
        onFileReject: (details) =>
            onFilesReject?.(details.files.map(({ file, errors }) => ({ file, errors: [...errors] }))),
    });
    useImperativeHandle(ref, () => ({
        open: () => api.openFilePicker(),
        clear: () => api.clearFiles(),
        uploadAll: () => queue().startAll(),
    }));

    const dragState = (event: { dataTransfer: DataTransfer | null }): DragState =>
        dragFilesState([...(event.dataTransfer?.items ?? [])], {
            accept,
            maxFiles,
            current: maxFiles > 1 ? api.acceptedFiles.length : 0,
        });
    const onDrag = (event: DragEvent<HTMLDivElement>) => setDrag(dragState(event));

    // Drop anywhere: an overlay while files are over the window; the drop goes to the upload
    const windowState = useRef({ api, dragState, depth: 0, over: 'none' as DragState });
    useEffect(() => {
        windowState.current.api = api;
        windowState.current.dragState = dragState;
    });
    useEffect(() => {
        if (!fullscreenDrop) return;
        const current = windowState.current;
        const set = (next: DragState) => {
            current.over = next;
            setWindowDrag(next);
        };
        const enter = (event: globalThis.DragEvent) => {
            if (!hasFiles(event) || current.api.disabled) return;
            current.depth++;
            set(current.dragState(event));
        };
        const leave = (event: globalThis.DragEvent) => {
            if (!hasFiles(event)) return;
            current.depth = Math.max(0, current.depth - 1);
            if (!current.depth) set('none');
        };
        const over = (event: globalThis.DragEvent) => {
            if (hasFiles(event) && current.over !== 'none') event.preventDefault();
        };
        const drop = (event: globalThis.DragEvent) => {
            if (!hasFiles(event) || current.over === 'none') return;
            event.preventDefault();
            current.depth = 0;
            set('none');
            current.api.setClipboardFiles(event.dataTransfer);
        };
        window.addEventListener('dragenter', enter);
        window.addEventListener('dragleave', leave);
        window.addEventListener('dragover', over);
        window.addEventListener('drop', drop);
        return () => {
            window.removeEventListener('dragenter', enter);
            window.removeEventListener('dragleave', leave);
            window.removeEventListener('dragover', over);
            window.removeEventListener('drop', drop);
        };
    }, [fullscreenDrop]);

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
        onPaste?.(event);
        if (!paste || !event.clipboardData?.files.length) return;
        event.preventDefault();
        const count = event.clipboardData.files.length;
        if (api.setClipboardFiles(event.clipboardData)) announce(t.pasted(count));
    };
    const statusOf = (file: File) => {
        const status = states.get(file)?.status;
        return fileUpload({ uploadStatus: status === 'error' ? 'failed' : status === 'done' ? 'done' : undefined });
    };
    const statusText = (state: UploadState) =>
        state.status === 'uploading' ? t.status.uploading(state.progress) : t.status[state.status];
    const pending = [...states.values()].some((state) => state.status === 'pending' || state.status === 'error');
    const trigger = (
        <ArkFileUpload.Trigger asChild>
            <Button variant="outline" size="sm" leadingIcon={variant === 'button' ? Upload : undefined}>
                {triggerLabel ?? t.trigger(several)}
            </Button>
        </ArkFileUpload.Trigger>
    );

    return (
        <ArkFileUpload.RootProvider
            {...props}
            value={api}
            className={styles.base({ class: className })}
            onPaste={handlePaste}
        >
            {label && <ArkFileUpload.Label className={styles.label()}>{label}</ArkFileUpload.Label>}
            {variant === 'button' ? (
                trigger
            ) : (
                // A labelled group, not a focusable zone with a button inside (nested interactive controls)
                <ArkFileUpload.Dropzone
                    disableClick
                    role="group"
                    className={fileUpload({ drag }).dropzone()}
                    onDragEnter={onDrag}
                    onDragOver={onDrag}
                    onDragLeave={() => setDrag('none')}
                    onDrop={() => setDrag('none')}
                >
                    <Upload className={styles.dropzoneIcon()} aria-hidden="true" />
                    {drag !== 'none' ? (
                        <span className={fileUpload({ drag }).dragText()}>
                            {drag === 'accept' ? t.dropAccept(several) : t.dropReject}
                        </span>
                    ) : (
                        <span className={styles.dropzoneText()}>{dropzoneText ?? t.dropzoneText(several)}</span>
                    )}
                    {trigger}
                    {hint && <span className={styles.hint()}>{hint}</span>}
                </ArkFileUpload.Dropzone>
            )}
            {variant === 'button' && hint && <span className={styles.hint()}>{hint}</span>}
            {api.acceptedFiles.length > 0 && (
                <ArkFileUpload.ItemGroup className={styles.list()}>
                    {api.acceptedFiles.map((file) => {
                        const state = states.get(file);
                        return (
                            <ArkFileUpload.Item key={file.name} file={file} className={statusOf(file).item()}>
                                {preview && isPreviewableImage(file) ? (
                                    <ArkFileUpload.ItemPreview type="image/*">
                                        <ArkFileUpload.ItemPreviewImage className={styles.thumbnail()} />
                                    </ArkFileUpload.ItemPreview>
                                ) : (
                                    <FileText className={styles.itemIcon()} aria-hidden="true" />
                                )}
                                <div className={styles.itemText()}>
                                    <ArkFileUpload.ItemName className={styles.itemName()} />
                                    <ArkFileUpload.ItemSizeText className={styles.itemSize()} />
                                    {state && (
                                        <>
                                            {state.status === 'uploading' && (
                                                <div
                                                    role="progressbar"
                                                    aria-label={t.progress(file)}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    aria-valuenow={state.progress}
                                                    className={styles.itemProgress()}
                                                >
                                                    <div
                                                        className={styles.itemProgressRange()}
                                                        style={{ width: `${state.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                            <span className={statusOf(file).itemStatus()}>{statusText(state)}</span>
                                        </>
                                    )}
                                </div>
                                {state && (
                                    <div className={styles.itemActions()}>
                                        {state.status === 'uploading' && (
                                            <IconButton
                                                icon={X}
                                                label={t.cancel(file)}
                                                variant="text"
                                                size="sm"
                                                onClick={() => queue().cancel(file)}
                                            />
                                        )}
                                        {(state.status === 'error' || state.status === 'cancelled') && (
                                            <IconButton
                                                icon={RotateCw}
                                                label={t.retry(file)}
                                                variant="text"
                                                size="sm"
                                                onClick={() => void queue().start(file)}
                                            />
                                        )}
                                    </div>
                                )}
                                <ArkFileUpload.ItemDeleteTrigger className={styles.itemDelete()}>
                                    <X className={styles.itemDeleteIcon()} aria-hidden="true" />
                                </ArkFileUpload.ItemDeleteTrigger>
                            </ArkFileUpload.Item>
                        );
                    })}
                </ArkFileUpload.ItemGroup>
            )}
            {upload && !autoUpload && pending && (
                <Button variant="primary" size="sm" leadingIcon={Upload} onClick={() => void queue().startAll()}>
                    {several ? t.uploadAll : t.upload}
                </Button>
            )}
            {/* Live region exists before errors appear, so they are announced */}
            <div className={styles.errors()} role="alert">
                {api.rejectedFiles.length > 0 && (
                    <ul>
                        {api.rejectedFiles.map(({ file, errors }) => (
                            <li key={file.name}>
                                {file.name}: {errors.map((error) => t.errors[error] ?? error).join(', ')}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <ArkFileUpload.HiddenInput />
            {fullscreenDrop && windowDrag !== 'none' && (
                <Portal>
                    <div className={styles.overlay()} data-drag={windowDrag} aria-hidden="true">
                        <Upload className={styles.overlayIcon()} />
                        {windowDrag === 'accept' ? t.fullscreen : t.dropReject}
                    </div>
                </Portal>
            )}
        </ArkFileUpload.RootProvider>
    );
}
