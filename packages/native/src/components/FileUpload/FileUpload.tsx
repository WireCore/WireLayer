import {
    fileUpload,
    formatFileSize,
    matchesAccept,
    UploadQueue,
    type UploadFunction,
    type UploadState,
} from '@wirecore/wirelayer-recipes/native';
import { File as FileIcon, RotateCcw, Trash2, Upload, X } from 'lucide-react-native';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Image, Text, View } from 'react-native';
import { useLocale } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Menu } from '../Menu/Menu.js';
import type { FilePicker, NativeFile } from './types.js';

export type { FilePicker, NativeFile } from './types.js';

/** Methods of FileUpload (ref) */
export interface FileUploadHandle {
    /** Opens the (first) picker */
    open: () => void;
    clear: () => void;
    uploadAll: () => Promise<void>;
}

export interface FileUploadProps {
    /** Visible label of the upload */
    label?: string;
    /** Sources of files: documentPicker(), imageLibraryPicker(), cameraPicker() or own – several open a choice sheet */
    pickers: FilePicker[];
    /** Allowed types, e.g. "application/pdf" or ["image/png", "image/jpeg"] (presets: FileTypes.images …) */
    accept?: string | string[];
    maxFiles?: number;
    /** Maximum size per file in bytes */
    maxFileSize?: number;
    /** The accepted files after every change */
    onFilesChange?: (files: NativeFile[]) => void;
    /** Files that were not taken, with the reasons as codes (FILE_INVALID_TYPE, FILE_TOO_LARGE, TOO_MANY_FILES, FILE_EXISTS) */
    onFilesReject?: (rejections: { file: NativeFile; errors: string[] }[]) => void;
    /** A file finished uploading (or failed) */
    onUploadComplete?: (file: NativeFile, state: UploadState) => void;
    /** Label of the button that opens the picker */
    triggerLabel?: string;
    /** Allowed types and sizes, e.g. "PDF, max. 5 MB" */
    hint?: string;
    /** Uploads a file: report progress with onProgress(0–100), stop when the signal aborts; resolve when done */
    upload?: UploadFunction<NativeFile>;
    /** Starts the upload as soon as files are added (otherwise with "Upload all") */
    autoUpload?: boolean;
    /** Thumbnails for images */
    preview?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** Methods: open, clear, uploadAll */
    ref?: Ref<FileUploadHandle>;
    className?: string;
}

/**
 * Choose files with the app's pickers (documents, photos, camera); accepted files are listed with a remove button
 * each, rejected ones are announced with the reason. With `upload` every file shows its progress and can be
 * cancelled or retried.
 */
export function FileUpload({
    label,
    pickers,
    accept,
    maxFiles,
    maxFileSize,
    onFilesChange,
    onFilesReject,
    onUploadComplete,
    triggerLabel,
    hint,
    upload,
    autoUpload = false,
    preview = false,
    disabled = false,
    invalid = false,
    ref,
    className,
}: FileUploadProps) {
    const { locale, translations } = useLocale();
    const t = translations.fileUpload;
    const multiple = maxFiles !== 1;
    const [files, setFiles] = useState<NativeFile[]>([]);
    const [states, setStates] = useState<Map<NativeFile, UploadState>>(new Map());
    const [errors, setErrors] = useState<string[]>([]);
    const { announce, region } = useAnnouncer();
    const latest = useRef({ upload, onUploadComplete, announce, t });
    useEffect(() => {
        latest.current = { upload, onUploadComplete, announce, t };
    });
    const known = useRef(new Map<NativeFile, UploadState>());
    // Created on first use (in a handler) – it reads the latest props through `latest`
    const queueRef = useRef<UploadQueue<NativeFile> | null>(null);
    const queue = () =>
        (queueRef.current ??= new UploadQueue<NativeFile>(
            (file, options) => latest.current.upload?.(file, options) ?? Promise.resolve(),
            (next) => {
                // Announce the end of an upload once
                for (const [file, state] of next) {
                    if (known.current.get(file)?.status === state.status) continue;
                    if (state.status !== 'done' && state.status !== 'error') continue;
                    latest.current.onUploadComplete?.(file, state);
                    latest.current.announce(
                        state.status === 'done'
                            ? latest.current.t.uploaded(file as unknown as File)
                            : latest.current.t.failed(file as unknown as File)
                    );
                }
                known.current = next;
                setStates(next);
            }
        ));
    useEffect(() => () => queueRef.current?.dispose(), []);
    const accepted = typeof accept === 'string' ? accept.split(',').map((entry) => entry.trim()) : accept;
    const styles = fileUpload({ invalid, disabled });
    const asFile = (file: NativeFile) => file as unknown as File;

    const change = (next: NativeFile[]) => {
        setFiles(next);
        onFilesChange?.(next);
    };
    const add = (picked: NativeFile[]) => {
        const rejections: { file: NativeFile; errors: string[] }[] = [];
        const taken: NativeFile[] = [];
        for (const file of picked) {
            const reasons: string[] = [];
            if (!matchesAccept(file.type ?? '', file.name, accepted)) reasons.push('FILE_INVALID_TYPE');
            if (maxFileSize !== undefined && (file.size ?? 0) > maxFileSize) reasons.push('FILE_TOO_LARGE');
            if ([...files, ...taken].some((entry) => entry.uri === file.uri)) reasons.push('FILE_EXISTS');
            if (!reasons.length && maxFiles !== undefined && files.length + taken.length >= maxFiles)
                reasons.push('TOO_MANY_FILES');
            if (reasons.length) rejections.push({ file, errors: reasons });
            else taken.push(file);
        }
        // One file at a time replaces the chosen one
        const next = maxFiles === 1 && taken.length ? taken.slice(0, 1) : [...files, ...taken];
        if (maxFiles === 1 && taken.length) for (const file of files) queue().remove(file);
        if (taken.length) {
            change(next);
            if (upload) {
                queue().add(taken);
                if (autoUpload) for (const file of taken) void queue().start(file);
            }
        }
        const messages = rejections.map(
            ({ file, errors: codes }) => `${file.name}: ${codes.map((code) => t.errors[code] ?? code).join(', ')}`
        );
        setErrors(messages);
        if (messages.length) announce(messages.join('. '));
        if (rejections.length) onFilesReject?.(rejections);
    };
    const pickFrom = async (picker: FilePicker | undefined) => {
        if (!picker || disabled) return;
        add(await picker.pick({ multiple, accept: accepted }));
    };
    const remove = (file: NativeFile) => {
        queue().remove(file);
        change(files.filter((entry) => entry !== file));
        announce(`${t.deleteFile(asFile(file))}`);
    };
    useImperativeHandle(ref, () => ({
        open: () => void pickFrom(pickers[0]),
        clear: () => {
            for (const file of files) queue().remove(file);
            change([]);
        },
        uploadAll: async () => void (await queue().startAll()),
    }));

    const labelOf = (picker: FilePicker) =>
        picker.label ?? (picker.kind ? t.sources[picker.kind] : (triggerLabel ?? t.trigger(multiple)));
    const pending =
        upload &&
        !autoUpload &&
        [...states.values()].some((state) => state.status === 'pending' || state.status === 'error');
    const trigger = (
        <Button
            variant="outline"
            leadingIcon={Upload}
            disabled={disabled}
            onPress={pickers.length === 1 ? () => void pickFrom(pickers[0]) : undefined}
        >
            {triggerLabel ?? t.trigger(multiple)}
        </Button>
    );

    return (
        <View className={styles.base({ class: className })}>
            {!!label && <Text className={styles.label()}>{label}</Text>}
            <View className={styles.zone()}>
                <Icon icon={Upload} className={styles.zoneIcon()} />
                {pickers.length > 1 ? (
                    <Menu
                        title={triggerLabel ?? t.trigger(multiple)}
                        items={pickers.map((picker, index) => ({
                            value: String(index),
                            label: labelOf(picker),
                            icon: picker.icon,
                        }))}
                        onSelect={(index) => void pickFrom(pickers[Number(index)])}
                    >
                        {trigger}
                    </Menu>
                ) : (
                    trigger
                )}
                {!!hint && <Text className={styles.zoneText()}>{hint}</Text>}
            </View>
            {errors.map((message) => (
                <Text key={message} className={styles.error()}>
                    {message}
                </Text>
            ))}
            {files.length > 0 && (
                <View role="list" className={styles.list()}>
                    {files.map((file) => {
                        const state = states.get(file);
                        const status = state?.status;
                        const look = fileUpload({ status: status ?? 'pending' });
                        const meta = [
                            file.size !== undefined ? formatFileSize(file.size, locale) : '',
                            status === 'uploading'
                                ? t.status.uploading(state!.progress)
                                : status
                                  ? t.status[status]
                                  : '',
                        ]
                            .filter(Boolean)
                            .join(' · ');
                        const image = preview && (file.type ?? '').startsWith('image/');
                        return (
                            <View key={file.uri} role="listitem" className={look.item()}>
                                {image ? (
                                    <Image source={{ uri: file.uri }} className={look.thumb()} alt="" aria-hidden />
                                ) : (
                                    <Icon icon={FileIcon} className={look.fileIcon()} />
                                )}
                                <View className={look.itemBody()}>
                                    <Text className={look.itemName()} numberOfLines={1}>
                                        {file.name}
                                    </Text>
                                    {!!meta && <Text className={look.itemMeta()}>{meta}</Text>}
                                    {status === 'uploading' && (
                                        <View
                                            role="progressbar"
                                            aria-label={t.progress(asFile(file))}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={state!.progress}
                                            className={look.track()}
                                        >
                                            <View className={look.range()} style={{ width: `${state!.progress}%` }} />
                                        </View>
                                    )}
                                </View>
                                {upload && status === 'pending' && !autoUpload && (
                                    <IconButton
                                        icon={Upload}
                                        label={`${t.upload}: ${file.name}`}
                                        variant="text"
                                        onPress={() => void queue().start(file)}
                                    />
                                )}
                                {status === 'uploading' && (
                                    <IconButton
                                        icon={X}
                                        label={t.cancel(asFile(file))}
                                        variant="text"
                                        onPress={() => queue().cancel(file)}
                                    />
                                )}
                                {(status === 'error' || status === 'cancelled') && (
                                    <IconButton
                                        icon={RotateCcw}
                                        label={t.retry(asFile(file))}
                                        variant="text"
                                        onPress={() => void queue().start(file)}
                                    />
                                )}
                                <IconButton
                                    icon={Trash2}
                                    label={t.deleteFile(asFile(file))}
                                    variant="text"
                                    disabled={disabled}
                                    onPress={() => remove(file)}
                                />
                            </View>
                        );
                    })}
                </View>
            )}
            {pending && (
                <View className={styles.footer()}>
                    <Button size="sm" leadingIcon={Upload} onPress={() => void queue().startAll()}>
                        {t.uploadAll}
                    </Button>
                </View>
            )}
            {region}
        </View>
    );
}
