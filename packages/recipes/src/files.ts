// Files for FileUpload: type presets, the check while something is dragged over, and the upload of each file with
// progress, cancel and retry.

/** Common `accept` values: `accept={FileTypes.images}` or `[...FileTypes.pdf, ...FileTypes.office]` */
export const FileTypes = {
    images: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'],
    pdf: ['application/pdf'],
    office: [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation',
    ],
    text: ['text/plain', 'text/markdown'],
    csv: ['text/csv'],
    archives: ['application/zip', 'application/x-7z-compressed', 'application/gzip', 'application/x-tar'],
    audio: ['audio/*'],
    video: ['video/*'],
} as const satisfies Record<string, readonly string[]>;

/** Whether a MIME type (and file name) matches an `accept` list ("image/*", ".pdf", "application/pdf") */
export function matchesAccept(type: string, name: string, accept: string | readonly string[] | undefined): boolean {
    const list = (typeof accept === 'string' ? accept.split(',') : (accept ?? [])).map((entry) =>
        entry.trim().toLowerCase()
    );
    if (!list.length) return true;
    const mime = type.toLowerCase();
    const lowerName = name.toLowerCase();
    return list.some((entry) => {
        if (entry.startsWith('.')) return lowerName.endsWith(entry);
        if (entry.endsWith('/*')) return mime.startsWith(entry.slice(0, -1));
        return mime === entry;
    });
}

/**
 * State while files are dragged over the drop zone, from the drag data (only types are known before the drop):
 * "reject" when a type is not accepted or there are too many files, else "accept".
 */
export function dragFilesState(
    items: readonly { kind: string; type: string }[],
    options: { accept?: string | readonly string[]; maxFiles?: number; current?: number } = {}
): 'accept' | 'reject' {
    const files = items.filter((item) => item.kind === 'file');
    if (options.maxFiles !== undefined && files.length + (options.current ?? 0) > options.maxFiles) return 'reject';
    // Some browsers hide the types while dragging – then accept and let the drop decide
    const typed = files.filter((item) => item.type);
    return typed.every((item) => matchesAccept(item.type, '', options.accept)) ? 'accept' : 'reject';
}

export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error' | 'cancelled';

export interface UploadState {
    status: UploadStatus;
    /** 0–100 */
    progress: number;
    error?: string;
}

/**
 * Uploads one file; report progress (0–100) and stop when the signal aborts. `F` is the file type: a browser File,
 * or the picked file of React Native ({ uri, name, type, size })
 */
export type UploadFunction<F = File> = (
    file: F,
    options: { onProgress: (percent: number) => void; signal: AbortSignal }
) => Promise<unknown>;

/**
 * The uploads of FileUpload: one per file, started, cancelled and retried by file. `onChange` gets the states
 * after every change (progress, done, failed).
 */
export class UploadQueue<F extends object = File> {
    #states = new Map<F, UploadState>();
    #controllers = new Map<F, AbortController>();
    #upload: UploadFunction<F>;
    #onChange: (states: Map<F, UploadState>) => void;

    constructor(upload: UploadFunction<F>, onChange: (states: Map<F, UploadState>) => void) {
        this.#upload = upload;
        this.#onChange = onChange;
    }

    configure(upload: UploadFunction<F>) {
        this.#upload = upload;
    }

    get(file: F): UploadState | undefined {
        return this.#states.get(file);
    }

    /** Files not uploaded yet become pending (shown with an "upload" state) */
    add(files: readonly F[]) {
        for (const file of files)
            if (!this.#states.has(file)) this.#states.set(file, { status: 'pending', progress: 0 });
        this.#emit();
    }

    /** Uploads the file; resolves when it is done, failed or cancelled */
    async start(file: F): Promise<void> {
        this.#controllers.get(file)?.abort();
        const controller = new AbortController();
        this.#controllers.set(file, controller);
        this.#set(file, { status: 'uploading', progress: 0 });
        try {
            await this.#upload(file, {
                signal: controller.signal,
                onProgress: (percent) => {
                    if (controller.signal.aborted) return;
                    this.#set(file, {
                        status: 'uploading',
                        progress: Math.max(0, Math.min(100, Math.round(percent))),
                    });
                },
            });
            if (!controller.signal.aborted) this.#set(file, { status: 'done', progress: 100 });
        } catch (error) {
            if (!controller.signal.aborted)
                this.#set(file, {
                    status: 'error',
                    progress: 0,
                    error: error instanceof Error ? error.message : String(error ?? ''),
                });
        } finally {
            if (this.#controllers.get(file) === controller) this.#controllers.delete(file);
        }
    }

    /** Starts every pending (or failed) file */
    startAll(): Promise<void[]> {
        const waiting = [...this.#states].filter(([, state]) => state.status === 'pending' || state.status === 'error');
        return Promise.all(waiting.map(([file]) => this.start(file)));
    }

    cancel(file: F) {
        const controller = this.#controllers.get(file);
        if (!controller) return;
        controller.abort();
        this.#controllers.delete(file);
        this.#set(file, { status: 'cancelled', progress: 0 });
    }

    /** Forgets the file (cancels a running upload) */
    remove(file: F) {
        this.#controllers.get(file)?.abort();
        this.#controllers.delete(file);
        this.#states.delete(file);
        this.#emit();
    }

    /** Cancels everything (unmount) */
    dispose() {
        for (const controller of this.#controllers.values()) controller.abort();
        this.#controllers.clear();
    }

    #set(file: F, state: UploadState) {
        if (!this.#states.has(file) && state.status !== 'uploading') return;
        this.#states.set(file, state);
        this.#emit();
    }

    #emit() {
        this.#onChange(new Map(this.#states));
    }
}

/** Whether a file can be shown as a thumbnail (an image the browser decodes) */
export const isPreviewableImage = (file: File) => /^image\/(png|jpe?g|gif|webp|avif|svg\+xml|bmp)$/.test(file.type);
